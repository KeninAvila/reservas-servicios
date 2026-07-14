<?php

class AbuseProtectionService
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function check(string $action, string $email, array $limits): array
    {
        $ip = $this->clientIp();
        $hash = hash('sha256', strtolower(trim($email)));

        foreach ($limits as $limit) {
            [$scope, $maximum, $minutes] = $limit;
            $count = $scope === 'ip'
                ? $this->countByIp($action, $ip, $minutes)
                : $this->countByIdentifier($action, $hash, $minutes);

            if ($count >= $maximum) {
                return ['allowed' => false, 'message' => 'Demasiadas solicitudes. Intenta nuevamente más tarde.'];
            }
        }

        return ['allowed' => true, 'ip' => $ip, 'hash' => $hash];
    }

    public function record(string $action, string $ip, string $hash): void
    {
        $stmt = $this->conn->prepare('INSERT INTO abuse_events (action, ip_address, identifier_hash) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $action, $ip, $hash);
        $stmt->execute();

        if (random_int(1, 100) === 1) {
            $this->conn->query("DELETE FROM abuse_events WHERE created_at < NOW() - INTERVAL 30 DAY");
        }
    }

    public function isHoneypotClean(array $data): bool
    {
        return trim((string)($data['website'] ?? '')) === '';
    }

    public function verifyTurnstile(?string $token): bool
    {
        $secret = trim((string)($_ENV['TURNSTILE_SECRET_KEY'] ?? ''));
        if ($secret === '') {
            return true;
        }
        if (!$token) {
            return false;
        }

        $payload = http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => $this->clientIp()]);
        $context = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\n", 'content' => $payload, 'timeout' => 8]]);
        $response = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
        $result = $response ? json_decode($response, true) : null;
        return !empty($result['success']);
    }

    public function cleanupPendingAccounts(): void
    {
        if (random_int(1, 100) !== 1) return;
        $this->conn->query("DELETE u FROM usuarios u
            LEFT JOIN profesionales_perfil pp ON pp.user_id = u.id
            WHERE u.email_verificado = 0
              AND u.created_at < NOW() - INTERVAL 7 DAY
              AND pp.id IS NULL");
    }

    private function countByIp(string $action, string $ip, int $minutes): int
    {
        $since = date('Y-m-d H:i:s', time() - ($minutes * 60));
        $stmt = $this->conn->prepare('SELECT COUNT(*) total FROM abuse_events WHERE action = ? AND ip_address = ? AND created_at >= ?');
        $stmt->bind_param('sss', $action, $ip, $since);
        $stmt->execute();
        return (int)$stmt->get_result()->fetch_assoc()['total'];
    }

    private function countByIdentifier(string $action, string $hash, int $minutes): int
    {
        $since = date('Y-m-d H:i:s', time() - ($minutes * 60));
        $stmt = $this->conn->prepare('SELECT COUNT(*) total FROM abuse_events WHERE action = ? AND identifier_hash = ? AND created_at >= ?');
        $stmt->bind_param('sss', $action, $hash, $since);
        $stmt->execute();
        return (int)$stmt->get_result()->fetch_assoc()['total'];
    }

    private function clientIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
    }
}
