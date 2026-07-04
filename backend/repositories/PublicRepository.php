<?php

class PublicRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function listProfesionales(): array
    {
        $sql = "SELECT pp.id AS profesional_id, pp.nombre_negocio, u.nombre, u.id AS user_id,
                       c.nombre AS categoria, c.id AS categoria_id,
                       pr.nombre AS provincia,
                       ci.nombre AS ciudad,
                       pp.direccion_1, pp.descripcion, pp.foto_perfil, pp.banner, pp.telefono
                FROM profesionales_perfil pp
                JOIN usuarios u ON pp.user_id = u.id
                JOIN categorias c ON pp.categoria_id = c.id
                JOIN provincias pr ON pp.provincia_id = pr.id
                JOIN ciudades ci ON pp.ciudad_id = ci.id
                WHERE u.estado = 'ACTIVO'
                ORDER BY pp.created_at DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getServiciosByProfesionalId(int $profesionalId): array
    {
        $sql = "SELECT id, nombre, descripcion, precio, duracion_min, estado
                FROM servicios
                WHERE profesional_id = ?
                  AND estado = 'activo'
                ORDER BY nombre ASC";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getServicioById(int $servicioId, int $profesionalId): ?array
    {
        $sql = "SELECT id, nombre, descripcion, precio, duracion_min
                FROM servicios
                WHERE id = ? AND profesional_id = ? AND estado = 'activo'";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $servicioId, $profesionalId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function getHorarioByDia(int $profesionalId, int $diaSemana): ?array
    {
        $sql = "SELECT hora_inicio, hora_fin, activo
                FROM horarios_profesional
                WHERE profesional_id = ? AND dia_semana = ? AND activo = 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $profesionalId, $diaSemana);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function getReservasOcupadas(int $profesionalId, string $fecha): array
    {
        $sql = "SELECT r.hora, r.duracion_min
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.profesional_id = ?
                  AND r.fecha = ?
                  AND er.nombre IN ('PENDIENTE', 'ACEPTADA')";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $profesionalId, $fecha);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getConfiguracion(int $profesionalId): array
    {
        $sql = "SELECT intervalo_agenda, anticipacion_horas, max_reserva_dias
                FROM configuracion_profesional
                WHERE profesional_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        return $result ?: [
            'intervalo_agenda'  => 15,
            'anticipacion_horas' => 2,
            'max_reserva_dias'  => 60,
        ];
    }

    public function getEstadoId(string $nombre): ?int
    {
        $sql = "SELECT id FROM estados_reserva WHERE nombre = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $nombre);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result['id'] ?? null;
    }

    public function findByUuid(string $uuid): ?array
    {
        $sql = "SELECT r.uuid, r.cliente_nombre, r.fecha, r.hora, r.duracion_min, r.precio,
                       er.nombre AS estado,
                       s.nombre AS servicio_nombre,
                       u.nombre AS profesional_nombre,
                       pp.user_id AS profesional_user_id
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                JOIN servicios s ON r.servicio_id = s.id
                JOIN profesionales_perfil pp ON r.profesional_id = pp.id
                JOIN usuarios u ON pp.user_id = u.id
                WHERE r.uuid = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $uuid);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function checkExcepcion(int $profesionalId, string $fecha): bool
    {
        $sql = "SELECT id FROM excepciones_horario WHERE profesional_id = ? AND fecha = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $profesionalId, $fecha);
        $stmt->execute();
        return (bool)$stmt->get_result()->fetch_assoc();
    }

    public function getProfesionalById(int $id): ?array
    {
        $sql = "SELECT pp.id AS profesional_id, pp.nombre_negocio, u.nombre, u.id AS user_id,
                       c.nombre AS categoria, c.id AS categoria_id,
                       pr.nombre AS provincia,
                       ci.nombre AS ciudad,
                       pp.direccion_1, pp.descripcion, pp.foto_perfil, pp.banner, pp.telefono,
                       pp.google_maps_url
                FROM profesionales_perfil pp
                JOIN usuarios u ON pp.user_id = u.id
                JOIN categorias c ON pp.categoria_id = c.id
                JOIN provincias pr ON pp.provincia_id = pr.id
                JOIN ciudades ci ON pp.ciudad_id = ci.id
                WHERE pp.id = ? AND u.estado = 'ACTIVO'";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function findReservaForCancel(string $uuid): ?array
    {
        $sql = "SELECT r.id, r.fecha, r.hora, r.expira_en, er.nombre AS estado
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.uuid = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("s", $uuid);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function cancelReservaByUuid(string $uuid, int $estadoId): bool
    {
        $sql = "UPDATE reservas SET estado_id = ? WHERE uuid = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("is", $estadoId, $uuid);
        return $stmt->execute() && $stmt->affected_rows > 0;
    }

    public function createReserva(array $data): ?string
    {
        $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $sql = "INSERT INTO reservas
                    (uuid, profesional_id, servicio_id, estado_id, cliente_nombre,
                     cliente_telefono, cliente_nota, fecha, hora, duracion_min, precio,
                     expira_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(
            "siiisssssid",
            $uuid,
            $data['profesional_id'],
            $data['servicio_id'],
            $data['estado_id'],
            $data['cliente_nombre'],
            $data['cliente_telefono'],
            $data['cliente_nota'],
            $data['fecha'],
            $data['hora'],
            $data['duracion_min'],
            $data['precio']
        );

        if (!$stmt->execute()) {
            error_log('PublicRepository::createReserva: ' . $stmt->error);
            return null;
        }

        return $uuid;
    }
}
