<?php

require_once __DIR__ . '/../config/db.php';

class UsuarioRepository
{

    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // =========================
    // OBTENER USUARIO POR EMAIL
    // =========================
    public function findByEmail($email)
    {
        $sql = "SELECT * FROM usuarios WHERE email = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();

        return $stmt->get_result()->fetch_assoc();
    }

    // =========================
    // OBTENER USUARIO POR ID
    // =========================
    public function findById($userId)
    {

        $sql = "SELECT id, nombre, email, id_rol, estado
            FROM usuarios
            WHERE id = ?
            LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return null;
        }
        return $result->fetch_assoc();
    }

    // =========================
    // CREAR USUARIO
    // =========================
    public function create($nombre, $email, $passwordHash, $rolId)
    {

        $sql = "INSERT INTO usuarios (nombre, email, password, id_rol, estado)
            VALUES (?, ?, ?, ?, 'ACTIVO')";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("sssi", $nombre, $email, $passwordHash, $rolId);

        $stmt->execute();

        return $this->conn->insert_id;
    }

    // =========================
    // ACTUALIZAR ESTADO
    // =========================
    public function updateEstado($id, $estado)
    {
        $sql = "UPDATE usuarios SET estado = ? WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $estado, $id);

        return $stmt->execute();
    }

    // =========================
    // VERIFICAR EMAIL EXISTE
    // =========================
    public function emailExists($email)
    {
        $sql = "SELECT id FROM usuarios WHERE email = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();

        return $stmt->get_result()->num_rows > 0;
    }


public function incrementAttempts($id)
{        // 1. subir intento    // 1. subir intento, asegurando valor inicial válido
    $sql = "UPDATE usuarios 
            SET login_attempts = login_attempts + 1
            WHERE id = ?";

    $stmt = $this->conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();

    // 2. obtener intentos actuales
    $sql2 = "SELECT login_attempts FROM usuarios WHERE id = ?";
    $stmt2 = $this->conn->prepare($sql2);
    $stmt2->bind_param("i", $id);
    $stmt2->execute();

    $result = $stmt2->get_result();
    $row = $result->fetch_assoc();

    // 3. bloquear si llega a 5
    if ($row['login_attempts'] >= 5) {
        $sql3 = "UPDATE usuarios 
                SET locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                WHERE id = ?";

        $stmt3 = $this->conn->prepare($sql3);
        $stmt3->bind_param("i", $id);
        $stmt3->execute();
    }
}

    public function resetAttempts($id)
    {
        $sql = "UPDATE usuarios 
            SET login_attempts = 0,
                locked_until = NULL
            WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
    }
}
