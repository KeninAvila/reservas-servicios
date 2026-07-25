<?php

class ReservaRepository
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

    public function findByUuidForProfesional(string $uuid, int $userId): ?array
    {
        $sql = "SELECT r.id, r.fecha, r.hora, er.nombre AS estado
                FROM reservas r
                JOIN profesionales_perfil pp ON r.profesional_id = pp.id
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.uuid = ? AND pp.user_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("si", $uuid, $userId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
    }

    public function updateEstadoById(int $id, int $estadoId): bool
    {
        $sql  = "UPDATE reservas SET estado_id = ? WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $estadoId, $id);
        return $stmt->execute() && $stmt->affected_rows > 0;
    }

    public function listByProfesionalId(int $profesionalId, ?string $estadoNombre = null): array
    {
        if ($estadoNombre) {
            $sql = "SELECT r.id, r.uuid, r.cliente_nombre, r.cliente_telefono, r.cliente_nota,
                           r.fecha, r.hora, r.duracion_min, r.precio,
                           r.respuesta_profesional, r.fecha_respuesta,
                           er.nombre AS estado,
                           s.nombre AS servicio_nombre, s.precio AS servicio_precio
                    FROM reservas r
                    JOIN estados_reserva er ON r.estado_id = er.id
                    JOIN servicios s ON r.servicio_id = s.id
                    WHERE r.profesional_id = ?
                      AND er.nombre = ?
                    ORDER BY r.fecha ASC, r.hora ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("is", $profesionalId, $estadoNombre);
        } else {
            $sql = "SELECT r.id, r.uuid, r.cliente_nombre, r.cliente_telefono, r.cliente_nota,
                           r.fecha, r.hora, r.duracion_min, r.precio,
                           r.respuesta_profesional, r.fecha_respuesta,
                           er.nombre AS estado,
                           s.nombre AS servicio_nombre, s.precio AS servicio_precio
                    FROM reservas r
                    JOIN estados_reserva er ON r.estado_id = er.id
                    JOIN servicios s ON r.servicio_id = s.id
                    WHERE r.profesional_id = ?
                    ORDER BY r.fecha ASC, r.hora ASC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $profesionalId);
        }

        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById(int $id, int $profesionalId): ?array
    {
        $sql = "SELECT r.id, r.uuid, r.estado_id, r.profesional_id,
                       r.cliente_nombre, r.cliente_telefono,
                       r.fecha, r.hora, r.duracion_min, r.precio,
                       er.nombre AS estado
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.id = ? AND r.profesional_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("ii", $id, $profesionalId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result ?: null;
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

    public function updateStatus(int $id, int $profesionalId, int $estadoId, ?string $respuesta = null): bool
    {
        $now = date('Y-m-d H:i:s');

        if ($respuesta !== null) {
            $sql = "UPDATE reservas
                    SET estado_id = ?, respuesta_profesional = ?, fecha_respuesta = ?
                    WHERE id = ? AND profesional_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("issii", $estadoId, $respuesta, $now, $id, $profesionalId);
        } else {
            $sql = "UPDATE reservas
                    SET estado_id = ?, fecha_respuesta = ?
                    WHERE id = ? AND profesional_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("isii", $estadoId, $now, $id, $profesionalId);
        }

        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function createReserva(array $data): ?int
    {
        $uuid  = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $sql = "INSERT INTO reservas
                    (uuid, profesional_id, servicio_id, estado_id, cliente_nombre, cliente_telefono,
                     cliente_nota, fecha, hora, duracion_min, precio, expira_en)
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
            error_log('ReservaRepository::createReserva: ' . $stmt->error);
            return null;
        }

        return $this->conn->insert_id;
    }

    public function getStatsByProfesionalId(int $profesionalId): array
    {
        // Reservas del mes actual
        $sql = "SELECT COUNT(*) AS total FROM reservas
                WHERE profesional_id = ?
                  AND MONTH(fecha) = MONTH(CURDATE())
                  AND YEAR(fecha) = YEAR(CURDATE())";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $reservasMes = (int)$stmt->get_result()->fetch_assoc()['total'];

        // Ingresos del mes (ACEPTADA + FINALIZADA)
        $sql = "SELECT COALESCE(SUM(r.precio), 0) AS ingresos
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.profesional_id = ?
                  AND er.nombre IN ('ACEPTADA', 'FINALIZADA')
                  AND MONTH(r.fecha) = MONTH(CURDATE())
                  AND YEAR(r.fecha) = YEAR(CURDATE())";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $ingresosMes = (float)$stmt->get_result()->fetch_assoc()['ingresos'];

        // Reservas totales por estado
        $sql = "SELECT er.nombre AS estado, COUNT(*) AS cantidad
                FROM reservas r
                JOIN estados_reserva er ON r.estado_id = er.id
                WHERE r.profesional_id = ?
                GROUP BY er.nombre";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $porEstado = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Top 5 servicios más solicitados
        $sql = "SELECT s.nombre, COUNT(*) AS cantidad
                FROM reservas r
                JOIN servicios s ON r.servicio_id = s.id
                WHERE r.profesional_id = ?
                GROUP BY s.id, s.nombre
                ORDER BY cantidad DESC
                LIMIT 5";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $topServicios = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Horas más ocupadas
        $sql = "SELECT HOUR(hora) AS hora, COUNT(*) AS cantidad
                FROM reservas
                WHERE profesional_id = ?
                GROUP BY HOUR(hora)
                ORDER BY hora ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $horasPico = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Reservas por mes (últimos 6 meses)
        $sql = "SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, COUNT(*) AS cantidad
                FROM reservas
                WHERE profesional_id = ?
                  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY mes
                ORDER BY mes ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $porMes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Total histórico de reservas
        $sql = "SELECT COUNT(*) AS total FROM reservas WHERE profesional_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();
        $totalHistorico = (int)$stmt->get_result()->fetch_assoc()['total'];

        return [
            'reservas_mes'     => $reservasMes,
            'ingresos_mes'     => $ingresosMes,
            'total_historico'  => $totalHistorico,
            'por_estado'       => $porEstado,
            'top_servicios'    => $topServicios,
            'horas_pico'       => $horasPico,
            'por_mes'          => $porMes,
        ];
    }

    public function getReservasByFecha(int $profesionalId, string $fecha): array
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
}
