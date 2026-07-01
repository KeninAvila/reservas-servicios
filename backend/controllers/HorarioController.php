<?php

require_once __DIR__ . '/../services/HorarioService.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class HorarioController
{
    private $service;

    public function __construct($conn)
    {
        $this->service = new HorarioService($conn);
    }

    public function getSchedule()
    {
        try {
            $user = AuthMiddleware::check();

            if ($user['id_rol'] != 2) {
                Response::error('Acceso denegado');
            }

            $result = $this->service->getSchedule($user['id']);

            if ($result['success']) {
                return Response::success($result['message'], $result['data']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('HorarioController::getSchedule: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function saveSchedule()
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

            $result = $this->service->saveSchedule($user['id'], $input);

            if ($result['success']) {
                return Response::success($result['message']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('HorarioController::saveSchedule: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }
}
