<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/../security/Security.php';
require_once __DIR__ . '/SessionService.php';

class GoogleAuthService
{
    private UsuarioRepository $users;
    private SessionService $sessions;
    private string $clientId;

    public function __construct($conn)
    {
        $this->users = new UsuarioRepository($conn);
        $this->sessions = new SessionService();
        $this->clientId = trim((string)($_ENV['GOOGLE_CLIENT_ID'] ?? '10515267213-a1np60l7ie2vaji2pgvp39mokh5tis5c.apps.googleusercontent.com'));
    }

    public function authenticate(string $credential, ?string $password = null): array
    {
        $identity = $this->verifyCredential($credential);
        if (!$identity['success']) return $identity;

        $payload = $identity['data'];
        $googleSub = (string)$payload['sub'];
        $email = strtolower(trim((string)$payload['email']));
        $name = trim((string)($payload['name'] ?? $email));
        $user = $this->users->findByGoogleSub($googleSub);

        if (!$user) {
            $user = $this->users->findByEmail($email);
            if ($user) {
                if (!empty($user['google_sub'])) {
                    return ['success' => false, 'message' => 'No se pudo vincular esta cuenta de Google.'];
                }
                if ($password === null) {
                    return ['success' => false, 'requires_link' => true, 'message' => 'Confirma tu contraseña para vincular Google con tu cuenta existente.'];
                }
                if (!Security::verifyPassword($password, $user['password'])) {
                    return ['success' => false, 'requires_link' => true, 'message' => 'Contraseña incorrecta.'];
                }
                if (!$this->users->linkGoogleIdentity((int)$user['id'], $googleSub)) {
                    return ['success' => false, 'message' => 'No se pudo vincular la cuenta de Google.'];
                }
                $user = $this->users->findByEmail($email);
            } else {
                $passwordHash = Security::hashPassword(bin2hex(random_bytes(32)));
                $userId = $this->users->createGoogleUser($name, $email, $googleSub, $passwordHash);
                if (!$userId) return ['success' => false, 'message' => 'No se pudo crear la cuenta.'];
                $user = $this->users->findByEmail($email);
            }
        }

        if ($user['estado'] !== 'ACTIVO') return ['success' => false, 'message' => 'Usuario suspendido.'];

        $sessionId = $this->sessions->createSessionId();
        $expiresAt = $this->sessions->buildExpiresAt();
        $this->users->createUserSession((int)$user['id'], $sessionId, $_SERVER['REMOTE_ADDR'] ?? 'unknown', $_SERVER['HTTP_USER_AGENT'] ?? 'unknown', $expiresAt);
        unset($user['password'], $user['verification_token'], $user['verification_expires'], $user['reset_token'], $user['reset_expires']);

        return ['success' => true, 'message' => 'Acceso con Google exitoso.', 'data' => ['user' => $user, 'session_id' => $sessionId]];
    }

    private function verifyCredential(string $credential): array
    {
        if ($credential === '') {
            return ['success' => false, 'message' => 'Google Sign-In no está disponible.'];
        }
        try {
            $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($credential);
            $curl = curl_init($url);
            curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FAILONERROR => true]);
            $response = curl_exec($curl);
            curl_close($curl);
            $payload = $response ? json_decode($response, true) : false;
        } catch (Throwable $e) {
            error_log('Google token verification: ' . $e->getMessage());
            $payload = false;
        }
        $validIssuer = in_array($payload['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true);
        $emailVerified = ($payload['email_verified'] ?? false) === true || ($payload['email_verified'] ?? '') === 'true';
        if (!$payload || ($payload['aud'] ?? '') !== $this->clientId || !$validIssuer || (int)($payload['exp'] ?? 0) <= time()
            || empty($payload['sub']) || empty($payload['email']) || !$emailVerified) {
            return ['success' => false, 'message' => 'La credencial de Google no es válida.'];
        }
        return ['success' => true, 'data' => $payload];
    }
}
