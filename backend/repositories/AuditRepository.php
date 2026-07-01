<?php

class AuditRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function insert(int $userId, string $accion, string $tabla, ?int $registroId, ?string $detalles, string $ip): void
    {
        $sql = "INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, detalles, ip)
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return;

        $stmt->bind_param("ississ", $userId, $accion, $tabla, $registroId, $detalles, $ip);
        $stmt->execute();
    }
}
