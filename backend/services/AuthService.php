<?php

require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/../helpers/Security.php';

class AuthService
{

    private $usuarioRepository;

    public function __construct($conn)
    {
        $this->usuarioRepository = new UsuarioRepository($conn);
    }

    // =========================
    // REGISTRO DE USUARIO
    // =========================
    public function register($nombre, $email, $password)
    {
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
                "success" => false,
                "message" => "El correo ya está registrado"
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

        $userId = $this->usuarioRepository->create(
            $nombre,
            $email,
            $passwordHash,
            $rolId
        );

        if (!$userId) {
            return [
                "success" => false,
                "message" => "Error al registrar usuario"
            ];
        }

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

                // IMPORTANTE: SALIR AQUÍ MISMO
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

        // 4. Password
        if (!Security::verifyPassword($password, $user['password'])) {

            // SOLO AQUÍ SE SUMA INTENTO
            $this->usuarioRepository->incrementAttempts($user['id']);

            return [
                "success" => false,
                "message" => "Credenciales inválidas"
            ];
        }

        // 5. Login correcto → reset
        $this->usuarioRepository->resetAttempts($user['id']);

        unset($user['password']);

        return [
            "success" => true,
            "message" => "Login exitoso",
            "data" => $user
        ];
    }
    // =========================
    // OBTENER USUARIO
    // =========================
    public function getUserById($id)
    {
        return $this->usuarioRepository->findById($id);
    }
}
