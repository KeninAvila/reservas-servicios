<?php

require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/../validators/PasswordValidator.php';
require_once __DIR__ . '/../services/EmailService.php';
require_once __DIR__ . '/../security/Security.php';
require_once __DIR__ . '/../services/TokenService.php';
require_once __DIR__ . '/../services/AbuseProtectionService.php';

class PasswordService
{
    private $usuarioRepository;
    private $tokenService;
    private $abuseProtection;

    public function __construct($conn)
    {
        $this->usuarioRepository = new UsuarioRepository($conn);
        $this->tokenService = new TokenService();
        $this->abuseProtection = new AbuseProtectionService($conn);
    }

    public function forgotPassword($data)
    {
        $validation = PasswordValidator::validateResetRequest($data);

        if (!$validation['success']) {
            return $validation;
        }

        $email = trim($data['email'] ?? '');
        if (!$this->abuseProtection->isHoneypotClean($data)) {
            return ['success' => true, 'message' => 'Si la cuenta existe, recibirás un enlace para restablecer la contraseña.'];
        }
        if (!$this->abuseProtection->verifyTurnstile($data['turnstile_token'] ?? null)) {
            return ['success' => false, 'message' => 'No se pudo validar que eres una persona.'];
        }
        $limit = $this->abuseProtection->check('forgot_password', $email, [
            ['identifier', 1, 2], ['identifier', 3, 60], ['ip', 20, 1440]
        ]);
        if (!$limit['allowed']) return ['success' => false, 'message' => $limit['message']];
        $this->abuseProtection->record('forgot_password', $limit['ip'], $limit['hash']);
        $user = $this->usuarioRepository->findByEmail($email);

        if (!$user) {
            return [
                "success" => true,
                "message" => "Si la cuenta existe, recibirás un enlace para restablecer la contraseña."
            ];
        }

        if ($this->usuarioRepository->getPasswordRecoveryCount($user['id']) >= 3) {
            return [
                "success" => false,
                "message" => "Ha excedido el número de solicitudes de recuperación permitidas. Intente nuevamente más tarde."
            ];
        }

        $this->usuarioRepository->recordPasswordRecoveryRequest($user['id']);

        $token = $this->tokenService->generateToken();
        $expires = $this->tokenService->generateExpiration(60);

        $this->usuarioRepository->saveResetToken($user['id'], $token, $expires);

        $emailService = new EmailService();
        $emailService->sendResetPasswordEmail($email, $user['nombre'], $token);

        return [
            "success" => true,
            "message" => "Si la cuenta existe, recibirás un enlace para restablecer la contraseña."
        ];
    }

    public function resetPassword($data)
    {
        $validation = PasswordValidator::validateResetPassword($data);

        if (!$validation['success']) {
            return $validation;
        }

        $token = trim($data['token'] ?? '');
        $password = $data['password'] ?? '';

        $user = $this->usuarioRepository->findByResetToken($token);

        if (!$user) {
            return [
                "success" => false,
                "message" => "El enlace de recuperación no es válido."
            ];
        }

        if ($this->tokenService->isExpired($user['reset_expires'])) {
            return [
                "success" => false,
                "message" => "El enlace de recuperación ha expirado."
            ];
        }

        $passwordHash = Security::hashPassword($password);
        $this->usuarioRepository->updatePassword($user['id'], $passwordHash);
        $this->usuarioRepository->clearResetToken($user['id']);
        $this->usuarioRepository->invalidateUserSessions($user['id']);

        return [
            "success" => true,
            "message" => "La contraseña fue actualizada correctamente."
        ];
    }
}
