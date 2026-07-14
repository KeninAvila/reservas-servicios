<?php

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../config/session.php';

class AuthController
{

    private $authService;

    public function __construct($conn)
    {
        $this->authService = new AuthService($conn);
    }

    // =========================
    // REGISTRO
    // =========================
    public function register($data)
    {

        $nombre = trim($data['nombre'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$nombre || !$email || !$password) {
            Response::error("Todos los campos son obligatorios");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error("Email no válido");
        }

        $result = $this->authService->register($nombre, $email, $password, is_array($data) ? $data : []);

        if (!$result['success']) {
            Response::error($result['message']);
        }

        Response::success($result['message'], $result['data']);
    }

    // =========================
    // LOGIN
    // =========================
    public function login($data)
    {

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            Response::error("Email y contraseña son obligatorios");
        }

        $result = $this->authService->login($email, $password);

        if (!$result['success']) {
            Response::error($result['message']);
        }

        // 🔐 CREAR SESIÓN (CONTROLLER RESPONSABLE)
        $data = $result['data'];
        $user = $data['user'];

        session_regenerate_id(true);

        $_SESSION['usuario_id'] = $user['id'];
        $_SESSION['rol'] = $user['id_rol'];
        $_SESSION['session_id'] = $data['session_id'];

        Response::success("Login exitoso", $user);
    }

    // =========================
    // LOGOUT
    // =========================
    public function logout()
    {

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $userId = $_SESSION['usuario_id'] ?? null;
        $sessionId = $_SESSION['session_id'] ?? session_id();

        if ($userId) {
            $this->authService->revokeSession($userId, $sessionId);
        }

        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();

        Response::success("Sesión cerrada");
    }

    // =========================
    // REENVIAR VERIFICACIÓN
    // =========================
    public function resendVerification($data)
    {
        $email = trim($data['email'] ?? '');

        if (!$email) {
            Response::error("El correo electrónico es obligatorio");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error("Email no válido");
        }

        $result = $this->authService->resendVerification($email, is_array($data) ? $data : []);

        if (!$result['success']) {
            Response::error($result['message']);
        }

        Response::success($result['message']);
    }

    // =========================
    // USUARIO LOGUEADO
    // =========================
    public function me()
    {

        if (!isset($_SESSION['usuario_id'])) {
            Response::error("No autenticado");
        }

        $user = $this->authService->getUserById($_SESSION['usuario_id']);

        if (!$user) {
            Response::error("Usuario no encontrado");
        }

        unset($user['password']);

        Response::success("Usuario autenticado", $user);
    }
}
