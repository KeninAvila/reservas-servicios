<?php

require_once __DIR__ . '/../services/ConfiguracionService.php';
require_once __DIR__ . '/../helpers/Response.php';

class ConfiguracionController
{
    private ConfiguracionService $service;

    public function __construct($conn)
    {
        $this->service = new ConfiguracionService($conn);
    }

    public function getConfig(): void
    {
        $user = $GLOBALS['auth_user'];
        if ((int)$user['id_rol'] !== 2) {
            Response::error('Acceso denegado');
        }

        $data = $this->service->getConfig((int)$user['id']);
        Response::success('Configuración obtenida', $data);
    }

    public function saveConfig(): void
    {
        $user = $GLOBALS['auth_user'];
        if ((int)$user['id_rol'] !== 2) {
            Response::error('Acceso denegado');
        }

        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->service->saveConfig((int)$user['id'], $input);

        if (!$result['ok']) {
            Response::error(implode(', ', $result['errors'] ?? ['Error al guardar']));
        }

        Response::success('Configuración guardada');
    }
}
