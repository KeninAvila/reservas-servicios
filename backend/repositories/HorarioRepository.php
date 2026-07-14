<?php

class HorarioRepository
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

    public function findByProfesionalId(int $profesionalId): array
    {
        $sql = "SELECT dia_semana, hora_inicio, hora_fin, activo
                FROM horarios_profesional
                WHERE profesional_id = ?
                ORDER BY dia_semana ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function upsertDay(int $profesionalId, int $diaSemana, string $horaInicio, string $horaFin, int $activo): bool
    {
        $checkSql = "SELECT id FROM horarios_profesional WHERE profesional_id = ? AND dia_semana = ?";
        $checkStmt = $this->conn->prepare($checkSql);
        $checkStmt->bind_param("ii", $profesionalId, $diaSemana);
        $checkStmt->execute();
        $existing = $checkStmt->get_result()->fetch_assoc();

        if ($existing) {
            $sql = "UPDATE horarios_profesional
                    SET hora_inicio = ?, hora_fin = ?, activo = ?
                    WHERE profesional_id = ? AND dia_semana = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ssiii", $horaInicio, $horaFin, $activo, $profesionalId, $diaSemana);
        } else {
            $sql = "INSERT INTO horarios_profesional (profesional_id, dia_semana, hora_inicio, hora_fin, activo)
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iissi", $profesionalId, $diaSemana, $horaInicio, $horaFin, $activo);
        }

        return $stmt->execute();
    }
}
