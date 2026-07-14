<?php

require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/../security/Security.php';
require_once __DIR__ . '/../services/EmailService.php';
require_once __DIR__ . '/../services/TokenService.php';
require_once __DIR__ . '/../services/RateLimitService.php';
require_once __DIR__ . '/../services/SessionService.php';
require_once __DIR__ . '/../services/AbuseProtectionService.php';

class AuthService
{

    private $usuarioRepository;
    private $tokenService;
    private $rateLimitService;
    private $sessionService;
    private $abuseProtection;

    public function __construct($conn)
    {
        $this->usuarioRepository = new UsuarioRepository($conn);
        $this->tokenService = new TokenService();
        $this->rateLimitService = new RateLimitService($conn);
        $this->sessionService = new SessionService();
        $this->abuseProtection = new AbuseProtectionService($conn);
    }

    // =========================
    // REGISTRO DE USUARIO
    // =========================
    public function register($nombre, $email, $password, array $context = [])
    {
        if (!$this->abuseProtection->isHoneypotClean($context)) {
            return ['success' => false, 'message' => 'No se pudo procesar la solicitud.'];
        }
        if (!$this->abuseProtection->verifyTurnstile($context['turnstile_token'] ?? null)) {
            return ['success' => false, 'message' => 'No se pudo validar que eres una persona.'];
        }
        $limit = $this->abuseProtection->check('register', $email, [
            ['ip', 5, 60], ['ip', 20, 1440], ['identifier', 3, 1440]
        ]);
        if (!$limit['allowed']) return ['success' => false, 'message' => $limit['message']];
        $this->abuseProtection->record('register', $limit['ip'], $limit['hash']);
        $this->abuseProtection->cleanupPendingAccounts();

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Formato de email inválido"
            ];
        }

        if (strlen($password) < 8) {
            return [
                "success" => false,
                "message" => "La contraseña debe tener al menos 6 caracteres"
            ];
        }

        if ($this->usuarioRepository->emailExists($email)) {
            return [
                "success" => true,
                "message" => "Si el correo puede registrarse, recibirás un enlace de verificación.",
                "data" => []
            ];
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos una letra mayúscula"
            ];
        }

        if (!preg_match('/[0-9]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos un número"
            ];
        }

        $passwordHash = Security::hashPassword($password);
        $rolId = 2;
        $token = $this->tokenService->generateToken();
        $expires = $this->tokenService->generateExpiration(24 * 60);

        $userId = $this->usuarioRepository->create(
            $nombre,
            $email,
            $passwordHash,
            $rolId,
            $token,
            $expires
        );

        if (!$userId) {
            return [
                "success" => false,
                "message" => "Error al registrar usuario"
            ];
        }

        $emailService = new EmailService();
        $emailService->sendVerificationEmail($email, $nombre, $token);

        // devolver usuario creado
        $user = $this->usuarioRepository->findById($userId);

        return [
            "success" => true,
            "message" => "Usuario registrado correctamente",
            "data" => $user
        ];
    }

    // =========================
    // LOGIN
    // =========================
    public function login($email, $password)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        if ($this->rateLimitService->checkAndRegisterLoginAttempt($ip) >= 30) {
            return [
                "success" => false,
                "message" => "Demasiados intentos desde esta dirección IP. Intente nuevamente más tarde."
            ];
        }

        $this->usuarioRepository->recordLoginAttempt($ip);

        // 1. Buscar usuario
        $user = $this->usuarioRepository->findByEmail($email);

        if (!$user) {
            return [
                "success" => false,
                "message" => "Credenciales inválidas"
            ];
        }

        // 2. BLOQUEO (DEBE SER ABSOLUTO, SALIDA INMEDIATA)
        if (!empty($user['locked_until'])) {

            $lockedTime = new DateTime($user['locked_until']);
            $now = new DateTime();

            if ($lockedTime > $now) {
                return [
                    "success" => false,
                    "message" => "Cuenta bloqueada temporalmente"
                ];
            }
        }

        // 3. Estado
        if ($user['estado'] !== 'ACTIVO') {
            return [
                "success" => false,
                "message" => "Usuario suspendido"
            ];
        }

        // 4. Verificación de correo
        if (empty($user['email_verificado']) || (int)$user['email_verificado'] !== 1) {
            return [
                "success" => false,
                "message" => "Debe verificar su correo antes de iniciar sesión"
            ];
        }

        // 5. Password
        if (!Security::verifyPassword($password, $user['password'])) {
            $loginInfo = $this->usuarioRepository->getUserLoginAttempts($user['id']);
            $attempts = (int)($loginInfo['login_attempts'] ?? 0) + 1;
            $blockMinutes = $this->getBlockMinutes($attempts);
            $lockedUntil = null;

            if ($blockMinutes > 0) {
                $lockedUntil = date('Y-m-d H:i:s', strtotime('+' . $blockMinutes . ' minutes'));
            }

            $this->usuarioRepository->updateLoginLock($user['id'], $lockedUntil, $attempts);

            return [
                "success" => false,
                "message" => "Credenciales inválidas"
            ];
        }

        // 5. Login correcto → reset
        $this->usuarioRepository->resetLoginLock($user['id']);

        $sessionId = $this->sessionService->createSessionId();
        $expiresAt = $this->sessionService->buildExpiresAt();
        $this->usuarioRepository->createUserSession(
            $user['id'],
            $sessionId,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $expiresAt
        );

        unset($user['password']);

        return [
            "success" => true,
            "message" => "Login exitoso",
            "data" => [
                'user' => $user,
                'session_id' => $sessionId,
                'expires_at' => $expiresAt
            ]
        ];
    }
    public function resendVerification($email, array $context = [])
    {
        if (!$this->abuseProtection->isHoneypotClean($context)) {
            return ['success' => true, 'message' => 'Si la cuenta existe, recibirás un correo de verificación.'];
        }
        if (!$this->abuseProtection->verifyTurnstile($context['turnstile_token'] ?? null)) {
            return ['success' => false, 'message' => 'No se pudo validar que eres una persona.'];
        }
        $limit = $this->abuseProtection->check('resend_verification', $email, [
            ['identifier', 1, 2], ['identifier', 5, 1440], ['ip', 20, 1440]
        ]);
        if (!$limit['allowed']) return ['success' => false, 'message' => $limit['message']];
        $this->abuseProtection->record('resend_verification', $limit['ip'], $limit['hash']);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Formato de email inválido"
            ];
        }

        $user = $this->usuarioRepository->findByEmail($email);

        if (!$user) {
            return [
                "success" => true,
                "message" => "Si la cuenta existe, recibirás un correo de verificación."
            ];
        }

        if (!empty($user['email_verificado']) && (int)$user['email_verificado'] === 1) {
            return [
                "success" => true,
                "message" => "Si la cuenta existe, recibirás un correo de verificación."
            ];
        }

        $token = $this->tokenService->generateToken();
        $expires = $this->tokenService->generateExpiration(24 * 60);

        $updated = $this->usuarioRepository->updateVerificationTokenByEmail($email, $token, $expires);

        if (!$updated) {
            return [
                "success" => false,
                "message" => "No se pudo actualizar el token de verificación"
            ];
        }

        $emailService = new EmailService();
        $emailService->sendVerificationEmail($email, $user['nombre'], $token);

        return [
            "success" => true,
            "message" => "Si la cuenta existe, recibirás un correo de verificación."
        ];
    }

    // =========================
    // OBTENER USUARIO
    // =========================
    public function getUserById($id)
    {
        return $this->usuarioRepository->findById($id);
    }

    public function revokeSession($userId, $sessionId)
    {
        return $this->usuarioRepository->revokeSession($userId, $sessionId);
    }

    private function getBlockMinutes($attempts)
    {
        if ($attempts < 4) {
            return 0;
        }

        $steps = [15, 30, 60, 720];
        $index = min($attempts - 4, count($steps) - 1);
        return $steps[$index] ?? 720;
    }
}
