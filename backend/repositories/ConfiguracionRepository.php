<?php

class ConfiguracionRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function getProfileIdByUserId(int $userId): ?int
    {
        $sql = "SELECT id FROM profesionales_perfil WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result['id'] ?? null;
    }

    public function findByProfesionalId(int $profesionalId): ?array
    {
        $sql = "SELECT intervalo_agenda, anticipacion_horas, max_reserva_dias
                FROM configuracion_profesional
                WHERE profesional_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() ?: null;
    }

    public function upsert(int $profesionalId, int $intervalo, int $anticipacion, int $maxDias): bool
    {
        $checkSql = "SELECT id FROM configuracion_profesional WHERE profesional_id = ?";
        $checkStmt = $this->conn->prepare($checkSql);
        $checkStmt->bind_param("i", $profesionalId);
        $checkStmt->execute();
        $existing = $checkStmt->get_result()->fetch_assoc();

        if ($existing) {
            $sql = "UPDATE configuracion_profesional
                    SET intervalo_agenda = ?, anticipacion_horas = ?, max_reserva_dias = ?
                    WHERE profesional_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iiii", $intervalo, $anticipacion, $maxDias, $profesionalId);
        } else {
            $sql = "INSERT INTO configuracion_profesional
                        (profesional_id, intervalo_agenda, anticipacion_horas, max_reserva_dias)
                    VALUES (?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iiii", $profesionalId, $intervalo, $anticipacion, $maxDias);
        }

        return $stmt->execute();
    }
}
