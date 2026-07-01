<?php

require_once __DIR__ . '/../services/ProfesionalService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ProfesionalController
{

    private $service;

    public function __construct($conn)
    {
        $this->service = new ProfesionalService($conn);
    }

    // Obtener perfil propio
    public function getProfile()
    {
        $user = AuthMiddleware::check();

        if ($user['id_rol'] != 2) {
            return Response::error("Acceso denegado");
        }

        $data = $this->service->getProfileByUserId($user['id']);

        return Response::success(
            "Perfil obtenido correctamente",
            $data
        );
    }
    // Crear o actualizar perfil
    public function createOrUpdateProfile()
    {
        $user = AuthMiddleware::check();

        if ($user['id_rol'] != 2) {
            return Response::error("Acceso denegado");
        }

        $input = json_decode(file_get_contents("php://input"), true);

        $result = $this->service->createOrUpdateProfile($user['id'], $input);

        if (isset($result['success']) && $result['success'] === true) {
            return Response::success($result['message']);
        }

        return Response::error($result['message'] ?? 'Error desconocido');
    }
}
