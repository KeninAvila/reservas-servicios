<?php

class ServicioRepository
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    /**
     * Obtiene el ID del perfil profesional
     * asociado al usuario autenticado.
     */
    public function getProfileIdByUserId(int $userId): ?int
    {
        $sql = "SELECT id
                FROM profesionales_perfil
                WHERE user_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();

        return $result['id'] ?? null;
    }

    /**
     * Busca un servicio que pertenezca al profesional.
     * Se usa para verificar propiedad antes de actualizar.
     */
    public function findServiceById(int $serviceId, int $profesionalId): ?array
    {
        $sql = "SELECT *
                FROM servicios
                WHERE id = ?
                  AND profesional_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param(
            "ii",
            $serviceId,
            $profesionalId
        );

        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();

        return $result ?: null;
    }

    /**
     * Inserta o actualiza un servicio.
     */
    public function upsertService(int $profesionalId, array $data): array
    {

        // ===========================
        // ACTUALIZAR
        // ===========================
        if (isset($data['id']) && is_numeric($data['id'])) {

            $service = $this->findServiceById(
                (int)$data['id'],
                $profesionalId
            );

            if (!$service) {

                return [
                    "success" => false,
                    "message" => "El servicio no existe o no pertenece al profesional."
                ];
            }

            $sql = "UPDATE servicios
                    SET
                        nombre = ?,
                        descripcion = ?,
                        precio = ?,
                        duracion_min = ?,
                        estado = ?
                    WHERE
                        id = ?
                    AND profesional_id = ?";

            $stmt = $this->conn->prepare($sql);

            $stmt->bind_param(
                "ssdisii",
                $data['nombre'],
                $data['descripcion'],
                $data['precio'],
                $data['duracion_min'],
                $data['estado'],
                $data['id'],
                $profesionalId
            );
        }

        // ===========================
        // INSERTAR
        // ===========================
        else {

            $sql = "INSERT INTO servicios
                    (
                        profesional_id,
                        nombre,
                        descripcion,
                        precio,
                        duracion_min,
                        estado
                    )
                    VALUES
                    (
                        ?, ?, ?, ?, ?, ?
                    )";

            $stmt = $this->conn->prepare($sql);

            $stmt->bind_param(
                "issdis",
                $profesionalId,
                $data['nombre'],
                $data['descripcion'],
                $data['precio'],
                $data['duracion_min'],
                $data['estado']
            );
        }

        if (!$stmt->execute()) {

            error_log(
                "ServicioRepository::upsertService -> " . $stmt->error
            );

            return [
                "success" => false,
                "message" => "No fue posible guardar el servicio."
            ];
        }

        return [
            "success" => true,
            "message" => "Servicio guardado correctamente."
        ];
    }

    /**
     * Obtiene todos los servicios del profesional.
     */
    public function getServicesByProfessionalId(int $profesionalId): array
    {
        $sql = "SELECT
                id,
                nombre,
                descripcion,
                precio,
                duracion_min,
                estado,
                created_at,
                updated_at
            FROM servicios
            WHERE profesional_id = ?
            AND estado <> 'eliminado'
            ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $profesionalId
        );

        $stmt->execute();

        return $stmt
            ->get_result()
            ->fetch_all(MYSQLI_ASSOC);
    }

    public function getServiceById(int $serviceId, int $profesionalId): ?array
    {
        $sql = "SELECT
                id,
                nombre,
                descripcion,
                precio,
                duracion_min,
                estado,
                created_at,
                updated_at
            FROM servicios
            WHERE id = ?
              AND profesional_id = ?
              AND estado <> 'eliminado'
            LIMIT 1";

        $stmt = $this->conn->prepare($sql);

        $stmt->bind_param(
            "ii",
            $serviceId,
            $profesionalId
        );

        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();

        return $result ?: null;
    }

    public function updateServiceStatus(int $serviceId, int $profesionalId, string $estado): bool
    {
        $sql = "UPDATE servicios
            SET estado = ?
            WHERE id = ?
              AND profesional_id = ?
              AND estado <> 'eliminado'";

        $stmt = $this->conn->prepare($sql);

        $stmt->bind_param(
            "sii",
            $estado,
            $serviceId,
            $profesionalId
        );

        return $stmt->execute();
    }

    public function deleteService(int $serviceId, int $profesionalId): bool
    {
        $sql = "UPDATE servicios
            SET estado = 'eliminado'
            WHERE id = ?
              AND profesional_id = ?
              AND estado <> 'eliminado'";

        $stmt = $this->conn->prepare($sql);

        $stmt->bind_param(
            "ii",
            $serviceId,
            $profesionalId
        );

        $stmt->execute();

        // IMPORTANTE: validar si realmente se actualizó algo
        return $stmt->affected_rows > 0;
    }
}
