<?php

require_once __DIR__ . '/../services/ReservaService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ReservaController
{
    private $service;

    public function __construct($conn)
    {
        $this->service = new ReservaService($conn);
    }

    public function responderByUuid(): void
    {
        $user = AuthMiddleware::check();
        if ($user['id_rol'] != 2) {
            Response::error('Acceso denegado. Solo profesionales pueden responder reservas.');
        }

        $input  = json_decode(file_get_contents('php://input'), true);
        $uuid   = trim($input['uuid']   ?? '');
        $accion = trim($input['accion'] ?? '');

        if (!$uuid || !in_array($accion, ['aceptar', 'rechazar'], true)) {
            Response::error('uuid y accion (aceptar|rechazar) son requeridos.');
        }

        $result = $this->service->responderByUuid($uuid, $accion, $user['id']);

        if ($result['success']) {
            Response::success($result['message'], ['estado' => $result['estado']]);
        } else {
            Response::error($result['message']);
        }
    }

    public function getStats()
    {
        try {
            $user = AuthMiddleware::check();
            if ($user['id_rol'] != 2) {
                Response::error('Acceso denegado');
            }
            $result = $this->service->getStats($user['id']);
            if ($result['success']) {
                return Response::success($result['message'], $result['data']);
            }
            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('ReservaController::getStats: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function listReservas()
    {
        try {
            $user = AuthMiddleware::check();

            if ($user['id_rol'] != 2) {
                Response::error('Acceso denegado');
            }

            $estado = isset($_GET['estado']) ? strtoupper(trim($_GET['estado'])) : null;

            $result = $this->service->listReservas($user['id'], $estado);

            if ($result['success']) {
                return Response::success($result['message'], $result['data']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('ReservaController::listReservas: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function changeStatus()
    {
        try {
            $user = AuthMiddleware::check();

            if ($user['id_rol'] != 2) {
                Response::error('Acceso denegado');
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!is_array($input)) {
                Response::error('JSON inválido');
            }

            $result = $this->service->changeStatus($user['id'], $input);

            if ($result['success']) {
                return Response::success($result['message']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('ReservaController::changeStatus: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }
}
