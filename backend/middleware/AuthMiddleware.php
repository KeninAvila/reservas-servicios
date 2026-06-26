<?php

require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/Response.php';

class AuthMiddleware {

    public static function check() {

        // 1. Verificar sesión PHP
        if (!isset($_SESSION['usuario_id'])) {
            Response::error("No autenticado");
        }

        $usuario_id = $_SESSION['usuario_id'];

        global $conn;

        // 2. Verificar que el usuario exista y esté activo
        $sql = "SELECT id, nombre, email, id_rol, estado FROM usuarios WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            session_destroy();
            Response::error("Usuario no válido");
        }

        $usuario = $result->fetch_assoc();

        // 3. Verificar estado del usuario
        if ($usuario['estado'] !== 'ACTIVO') {
            session_destroy();
            Response::error("Usuario suspendido");
        }

        // 4. Cargar usuario globalmente para uso posterior
        $_SESSION['usuario'] = $usuario;

        return $usuario;
    }
}