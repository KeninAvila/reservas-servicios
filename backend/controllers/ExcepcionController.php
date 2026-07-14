<?php

require_once __DIR__ . '/../services/ExcepcionService.php';
require_once __DIR__ . '/../helpers/Response.php';

class ExcepcionController
{
    private ExcepcionService $service;

    public function __construct($conn)
    {
        $this->service = new ExcepcionService($conn);
    }

    private function requireProfesional(): int
    {
        $user = $GLOBALS['auth_user'];
        if ((int)$user['id_rol'] !== 2) {
            Response::error('Acceso denegado');
        }
        return (int)$user['id'];
    }

    public function listExcepciones(): void
    {
        $userId = $this->requireProfesional();
        $result = $this->service->listExcepciones($userId);

        if (!$result['ok']) {
            Response::error(implode(', ', $result['errors']));
        }

        Response::success('Excepciones obtenidas', $result['data']);
    }

    public function addExcepcion(): void
    {
        $userId = $this->requireProfesional();
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->service->addExcepcion($userId, $input);

        if (!$result['ok']) {
            Response::error(implode(', ', $result['errors']));
        }

        Response::success('Excepción registrada');
    }

    public function removeExcepcion(): void
    {
        $userId = $this->requireProfesional();
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->service->removeExcepcion($userId, $input);

        if (!$result['ok']) {
            Response::error(implode(', ', $result['errors']));
        }

        Response::success('Excepción eliminada');
    }
}
