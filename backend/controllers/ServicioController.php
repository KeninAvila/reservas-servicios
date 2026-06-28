<?php

require_once __DIR__ . '/../services/ServicioService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ServicioController
{
    private $service;

    public function __construct($conn)
    {
        $this->service = new ServicioService($conn);
    }

    /**
     * Crear o actualizar un servicio.
     */
    public function createOrUpdateService()
    {
        // Usuario autenticado
        $user = AuthMiddleware::check();

        // Solo profesionales
        if ($user['id_rol'] != 2) {
            Response::error("Acceso denegado");
        }

        // Solo POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error("Método no permitido");
        }

        // Leer JSON
        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            Response::error("JSON inválido.");
        }

        // Llamar al Service
        $result = $this->service->createOrUpdateService(
            $user['id'],
            $input
        );

        // Respuesta
        if ($result['success']) {
            Response::success(
                $result['message']
            );
        }

        Response::error(
            $result['message']
        );
    }

    public function listServices()
    {
        try {

            // 1. Verificar sesión
            $user = AuthMiddleware::check();

            // 2. Verificar rol profesional
            if ($user['id_rol'] != 2) {
                return Response::error("Acceso denegado");
            }

            // 3. Llamar al Service
            $result = $this->service->listServices($user['id']);

            // 4. Responder según resultado
            if ($result['success']) {
                return Response::success(
                    $result['message'],
                    $result['data']
                );
            }

            return Response::error(
                $result['message'],
                $result['data'] ?? []
            );
        } catch (Throwable $e) {

            error_log("ServicioController listServices: " . $e->getMessage());

            return Response::error("Error interno del servidor");
        }
    }

    public function getServiceById()
    {
        try {

            // 1. sesión
            $user = AuthMiddleware::check();

            // 2. rol profesional
            if ($user['id_rol'] != 2) {
                return Response::error("Acceso denegado");
            }

            // 3. validar id
            if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
                return Response::error("ID inválido");
            }

            $serviceId = (int) $_GET['id'];

            // 4. service
            $result = $this->service->getServiceById($user['id'], $serviceId);

            // 5. response
            if ($result['success']) {
                return Response::success(
                    $result['message'],
                    $result['data']
                );
            }

            return Response::error(
                $result['message'],
                $result['data'] ?? []
            );
        } catch (Throwable $e) {

            error_log("getServiceById: " . $e->getMessage());

            return Response::error("Error interno del servidor");
        }
    }

    public function changeStatus()
    {
        try {

            // 1. sesión
            $user = AuthMiddleware::check();

            // 2. rol profesional
            if ($user['id_rol'] != 2) {
                return Response::error("Acceso denegado");
            }

            // 3. input JSON
            $input = json_decode(file_get_contents("php://input"), true);

            if (!isset($input['id'], $input['estado'])) {
                return Response::error("Datos incompletos");
            }

            $serviceId = (int) $input['id'];
            $estado = $input['estado'];

            // 4. service
            $result = $this->service->changeStatus(
                $user['id'],
                $serviceId,
                $estado
            );

            // 5. response
            if ($result['success']) {
                return Response::success($result['message']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {

            error_log("changeStatus: " . $e->getMessage());

            return Response::error("Error interno del servidor");
        }
    }

    public function deleteService()
    {
        try {

            $user = AuthMiddleware::check();

            if ($user['id_rol'] != 2) {
                return Response::error("Acceso denegado");
            }

            $input = json_decode(file_get_contents("php://input"), true);

            if (!isset($input['id'])) {
                return Response::error("ID requerido");
            }

            $serviceId = (int) $input['id'];

            $result = $this->service->deleteService(
                $user['id'],
                $serviceId
            );

            if ($result['success']) {
                return Response::success($result['message']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {

            error_log("deleteService: " . $e->getMessage());

            return Response::error("Error interno del servidor");
        }
    }
}
