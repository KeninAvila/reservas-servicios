<?php

class ExcepcionRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function getProfileIdByUserId(int $userId): ?int
    {
        $sql  = "SELECT id FROM profesionales_perfil WHERE user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return $row['id'] ?? null;
    }

    public function findByProfesionalId(int $profesionalId): array
    {
        $sql  = "SELECT id, fecha, motivo FROM excepciones_horario WHERE profesional_id = ? ORDER BY fecha ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function existsForDate(int $profesionalId, string $fecha): bool
    {
        $sql  = "SELECT id FROM excepciones_horario WHERE profesional_id = ? AND fecha = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $profesionalId, $fecha);
        $stmt->execute();
        return (bool)$stmt->get_result()->fetch_assoc();
    }

    public function create(int $profesionalId, string $fecha, ?string $motivo): bool
    {
        $sql  = "INSERT INTO excepciones_horario (profesional_id, fecha, motivo) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("iss", $profesionalId, $fecha, $motivo);
        return $stmt->execute();
    }

    public function delete(int $id, int $profesionalId): bool
    {
        $sql  = "DELETE FROM excepciones_horario WHERE id = ? AND profesional_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $id, $profesionalId);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }
}
