<?php

require_once __DIR__ . '/../services/PublicService.php';
require_once __DIR__ . '/../helpers/Response.php';

class PublicController
{
    private $service;

    public function __construct($conn)
    {
        $this->service = new PublicService($conn);
    }

    public function listProfesionales()
    {
        try {
            $result = $this->service->listProfesionales();
            return Response::success($result['message'], $result['data']);
        } catch (Throwable $e) {
            error_log('PublicController::listProfesionales: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function getServicios()
    {
        try {
            if (!isset($_GET['profesional_id']) || !is_numeric($_GET['profesional_id'])) {
                return Response::error('profesional_id requerido');
            }

            $profesionalId = (int)$_GET['profesional_id'];
            $result = $this->service->getServicios($profesionalId);

            return Response::success($result['message'], $result['data']);
        } catch (Throwable $e) {
            error_log('PublicController::getServicios: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function getDisponibilidad()
    {
        try {
            $profesionalId = isset($_GET['profesional_id']) ? (int)$_GET['profesional_id'] : 0;
            $fecha         = $_GET['fecha'] ?? '';
            $servicioId    = isset($_GET['servicio_id']) ? (int)$_GET['servicio_id'] : 0;

            if (!$profesionalId || !$fecha || !$servicioId) {
                return Response::error('Parámetros requeridos: profesional_id, fecha, servicio_id');
            }

            $result = $this->service->getDisponibilidad($profesionalId, $fecha, $servicioId);

            if ($result['success']) {
                return Response::success($result['message'], $result['data']);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('PublicController::getDisponibilidad: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }

    public function getReservaByUuid(): void
    {
        $uuid = trim($_GET['uuid'] ?? '');
        if (!$uuid) {
            Response::error('uuid es requerido');
        }

        $data = $this->service->getReservaByUuid($uuid);
        if (!$data) {
            Response::error('Reserva no encontrada');
        }

        Response::success('Reserva encontrada', $data);
    }

    public function createReserva()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!is_array($input)) {
                return Response::error('JSON inválido');
            }

            $result = $this->service->createReserva($input);

            if ($result['success']) {
                return Response::success($result['message'], $result['data'] ?? null);
            }

            return Response::error($result['message']);
        } catch (Throwable $e) {
            error_log('PublicController::createReserva: ' . $e->getMessage());
            return Response::error('Error interno del servidor');
        }
    }
}
