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
    public function create($nombre, $email, $passwordHash, $rolId, $token = null, $expires = null)
    {
        $sql = "INSERT INTO usuarios (nombre, email, password, id_rol, estado, email_verificado, verification_token, verification_expires)
            VALUES (?, ?, ?, ?, 'ACTIVO', 0, ?, ?)";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("sssiss", $nombre, $email, $passwordHash, $rolId, $token, $expires);

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

        // 3. bloquear si llega al máximo configurado
        if ($row['login_attempts'] >= LOGIN_MAX_ATTEMPTS) {
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

    public function findByToken($token)
    {
        $sql = "SELECT * FROM usuarios WHERE verification_token = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $token);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    public function verifyEmail($id)
    {
        $sql = "UPDATE usuarios 
            SET email_verificado = 1,
                verification_token = NULL,
                verification_expires = NULL
            WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public function updateVerificationTokenByEmail($email, $token, $expires)
    {
        $sql = "UPDATE usuarios 
            SET verification_token = ?, verification_expires = ?
            WHERE email = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("sss", $token, $expires, $email);
        return $stmt->execute();
    }

    public function saveResetToken($id, $token, $expires)
    {
        $sql = "UPDATE usuarios 
            SET reset_token = ?, reset_expires = ?
            WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ssi", $token, $expires, $id);

        return $stmt->execute();
    }

    public function checkLoginRateLimit($ip)
    {
        $windowStart = date('Y-m-d H:i:s', strtotime('-15 minutes'));
        $sql = "SELECT COUNT(*) as attempts FROM login_attempts WHERE ip_address = ? AND created_at >= ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ss", $ip, $windowStart);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        return (int) $row['attempts'];
    }

    public function recordLoginAttempt($ip)
    {
        $sql = "INSERT INTO login_attempts (ip_address, created_at) VALUES (?, NOW())";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $ip);
        return $stmt->execute();
    }

    public function getUserLoginAttempts($id)
    {
        $sql = "SELECT login_attempts, locked_until FROM usuarios WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function updateLoginLock($id, $lockedUntil, $attemptCount)
    {
        $sql = "UPDATE usuarios SET login_attempts = ?, locked_until = ? WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("isi", $attemptCount, $lockedUntil, $id);
        return $stmt->execute();
    }

    public function resetLoginLock($id)
    {
        $sql = "UPDATE usuarios SET login_attempts = 0, locked_until = NULL WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    public function getPasswordRecoveryCount($userId)
    {
        $sql = "SELECT COUNT(*) as count FROM password_recovery_requests WHERE user_id = ? AND requested_at >= ?";
        $windowStart = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $userId, $windowStart);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return (int) $row['count'];
    }

    public function recordPasswordRecoveryRequest($userId)
    {
        $sql = "INSERT INTO password_recovery_requests (user_id, requested_at) VALUES (?, NOW())";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        return $stmt->execute();
    }

    public function invalidateUserSessions($userId)
    {
        $sql = "UPDATE user_sessions SET revoked = 1 WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log('UsuarioRepository::invalidateUserSessions: ' . $this->conn->error);
            return false;
        }
        $stmt->bind_param("i", $userId);
        return $stmt->execute();
    }

    public function createUserSession($userId, $sessionId, $ipAddress, $userAgent, $expiresAt)
    {
        $sql = "INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, created_at, last_activity, expires_at, revoked)
            VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 0)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("issss", $userId, $sessionId, $ipAddress, $userAgent, $expiresAt);
        return $stmt->execute();
    }

    public function findActiveSession($userId, $sessionId)
    {
        $sql = "SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ? AND revoked = 0 AND expires_at > NOW() LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $userId, $sessionId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function revokeSession($userId, $sessionId)
    {
        $sql = "UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND session_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $userId, $sessionId);
        return $stmt->execute();
    }

    public function revokeAllUserSessions($userId)
    {
        $sql = "UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND revoked = 0";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        return $stmt->execute();
    }

    public function touchSession($userId, $sessionId)
    {
        $sql = "UPDATE user_sessions SET last_activity = NOW() WHERE user_id = ? AND session_id = ? AND revoked = 0";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $userId, $sessionId);
        return $stmt->execute();
    }

    public function findByResetToken($token)
    {
        $sql = "SELECT * FROM usuarios WHERE reset_token = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $token);
        $stmt->execute();

        return $stmt->get_result()->fetch_assoc();
    }

    public function updatePassword($id, $password)
    {
        $sql = "UPDATE usuarios SET password = ? WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $password, $id);
        return $stmt->execute();
    }

    public function clearResetToken($id)
    {
        $sql = "UPDATE usuarios 
            SET reset_token = NULL,
                reset_expires = NULL
            WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
