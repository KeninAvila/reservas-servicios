<?php

class AdminRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function listProfesionales(?string $estado = null): array
    {
        if ($estado) {
            $sql = "SELECT u.id, u.nombre, u.email, u.estado, u.created_at,
                           pp.id AS profesional_id, pp.descripcion,
                           c.nombre AS categoria
                    FROM usuarios u
                    LEFT JOIN profesionales_perfil pp ON pp.user_id = u.id
                    LEFT JOIN categorias c ON pp.categoria_id = c.id
                    WHERE u.id_rol = 2 AND u.estado = ?
                    ORDER BY u.created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $estado);
        } else {
            $sql = "SELECT u.id, u.nombre, u.email, u.estado, u.created_at,
                           pp.id AS profesional_id, pp.descripcion,
                           c.nombre AS categoria
                    FROM usuarios u
                    LEFT JOIN profesionales_perfil pp ON pp.user_id = u.id
                    LEFT JOIN categorias c ON pp.categoria_id = c.id
                    WHERE u.id_rol = 2
                    ORDER BY u.created_at DESC";
            $stmt = $this->conn->prepare($sql);
        }

        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function updateUserStatus(int $userId, string $estado): bool
    {
        $sql  = "UPDATE usuarios SET estado = ? WHERE id = ? AND id_rol = 2";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $estado, $userId);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function getStats(): array
    {
        $totalProfesionales = $this->countQuery("SELECT COUNT(*) FROM usuarios WHERE id_rol = 2");
        $totalReservas      = $this->countQuery("SELECT COUNT(*) FROM reservas");
        $reservasPendientes = $this->countQuery(
            "SELECT COUNT(*) FROM reservas r
             JOIN estados_reserva er ON r.estado_id = er.id
             WHERE er.nombre = 'PENDIENTE'"
        );

        return [
            'total_profesionales' => $totalProfesionales,
            'total_reservas'      => $totalReservas,
            'reservas_pendientes' => $reservasPendientes,
        ];
    }

    public function listReservas(?string $estado = null): array
    {
        if ($estado) {
            $sql = "SELECT r.id, r.uuid, r.cliente_nombre, r.cliente_telefono,
                           r.fecha, r.hora, r.duracion_min, r.precio,
                           er.nombre AS estado,
                           s.nombre AS servicio_nombre,
                           u.nombre AS profesional_nombre
                    FROM reservas r
                    JOIN estados_reserva er ON r.estado_id = er.id
                    JOIN servicios s ON r.servicio_id = s.id
                    JOIN profesionales_perfil pp ON r.profesional_id = pp.id
                    JOIN usuarios u ON pp.user_id = u.id
                    WHERE er.nombre = ?
                    ORDER BY r.fecha DESC, r.hora DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $estado);
        } else {
            $sql = "SELECT r.id, r.uuid, r.cliente_nombre, r.cliente_telefono,
                           r.fecha, r.hora, r.duracion_min, r.precio,
                           er.nombre AS estado,
                           s.nombre AS servicio_nombre,
                           u.nombre AS profesional_nombre
                    FROM reservas r
                    JOIN estados_reserva er ON r.estado_id = er.id
                    JOIN servicios s ON r.servicio_id = s.id
                    JOIN profesionales_perfil pp ON r.profesional_id = pp.id
                    JOIN usuarios u ON pp.user_id = u.id
                    ORDER BY r.fecha DESC, r.hora DESC";
            $stmt = $this->conn->prepare($sql);
        }

        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function listCategorias(): array
    {
        $sql = "SELECT c.id, c.nombre, c.descripcion, c.estado,
                       COUNT(pp.id) AS total_profesionales
                FROM categorias c
                LEFT JOIN profesionales_perfil pp ON pp.categoria_id = c.id
                GROUP BY c.id
                ORDER BY c.nombre ASC";
        return $this->conn->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    public function createCategoria(string $nombre, string $descripcion): bool
    {
        $sql  = "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ss", $nombre, $descripcion);
        return $stmt->execute();
    }

    public function deleteCategoria(int $id): array
    {
        $check = $this->conn->prepare("SELECT COUNT(*) FROM profesionales_perfil WHERE categoria_id = ?");
        $check->bind_param("i", $id);
        $check->execute();
        $count = (int)$check->get_result()->fetch_row()[0];

        if ($count > 0) {
            return ['ok' => false, 'message' => "No se puede eliminar: $count profesional(es) usa(n) esta categoría."];
        }

        $stmt = $this->conn->prepare("DELETE FROM categorias WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return ['ok' => true];
    }

    public function listCategoriasActivas(): array
    {
        return $this->conn->query(
            "SELECT id, nombre, descripcion FROM categorias WHERE estado='ACTIVO' ORDER BY nombre ASC"
        )->fetch_all(MYSQLI_ASSOC);
    }

    private function countQuery(string $sql): int
    {
        $result = $this->conn->query($sql);
        return (int)($result->fetch_row()[0] ?? 0);
    }
}
