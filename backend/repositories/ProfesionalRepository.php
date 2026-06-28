<?php

class ProfesionalRepository
{

    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function findByUserId($userId)
    {
        $sql = "SELECT pp.*, c.nombre AS categoria
                FROM profesionales_perfil pp
                JOIN categorias c ON pp.categoria_id = c.id
                WHERE pp.user_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        return $stmt->get_result()->fetch_assoc();
    }

    public function upsertProfile($userId, $data)
    {

        // Verificar si existe
        $check = $this->findByUserId($userId);

        var_dump($check); // Depuración: mostrar el resultado de la verificación

        if ($check) {

            $sql = "UPDATE profesionales_perfil 
                    SET categoria_id=?, provincia_id=?, ciudad_id=?, 
                        direccion_1=?, direccion_2=?, google_maps_url=?, descripcion=?
                    WHERE user_id=?";

            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param(
                "iiissssi",
                $data['categoria_id'],
                $data['provincia_id'],
                $data['ciudad_id'],
                $data['direccion_1'],
                $data['direccion_2'],
                $data['google_maps_url'],
                $data['descripcion'],
                $userId
            );
        } else {

            $sql = "INSERT INTO profesionales_perfil 
                    (user_id, categoria_id, provincia_id, ciudad_id, direccion_1, direccion_2, google_maps_url, descripcion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param(
                "iiiissss",
                $userId,
                $data['categoria_id'],
                $data['provincia_id'],
                $data['ciudad_id'],
                $data['direccion_1'],
                $data['direccion_2'],
                $data['google_maps_url'],
                $data['descripcion']
            );
        }

        if (!$stmt->execute()) {
            error_log('ProfesionalRepository upsertProfile error: ' . $stmt->error);
            return false;
        }

        return true;
    }

    public function getServiciosByProfesionalId($profesionalId)
    {

        $sql = "SELECT s.*, 
                (SELECT JSON_ARRAYAGG(si.imagen_url)
                 FROM servicio_imagenes si
                 WHERE si.servicio_id = s.id) AS imagenes
                FROM servicios s
                WHERE s.profesional_id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $profesionalId);
        $stmt->execute();

        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getProfileIdByUserId($userId)
    {
        $sql = "SELECT id
            FROM profesionales_perfil
            WHERE user_id=?";

        $stmt = $this->conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $userId
        );

        $stmt->execute();

        $result = $stmt->get_result()->fetch_assoc();

        return $result['id'] ?? null;
    }
}
