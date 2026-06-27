<?php

require_once __DIR__ . '/../repositories/UsuarioRepository.php';

class RateLimitService
{
    private $usuarioRepository;

    public function __construct($conn)
    {
        $this->usuarioRepository = new UsuarioRepository($conn);
    }

    public function checkAndRegisterLoginAttempt($ip)
    {
        $ip = $this->normalizeIp($ip);
        return $this->usuarioRepository->checkLoginRateLimit($ip);
    }

    private function normalizeIp($ip)
    {
        if (empty($ip)) {
            return 'unknown';
        }

        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
    }
}
