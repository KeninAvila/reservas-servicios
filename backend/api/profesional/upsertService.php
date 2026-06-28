<?php

require_once __DIR__ . '/../../controllers/servicioController.php';
require_once __DIR__ . '/../../helpers/Response.php';

try {

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::error("Método no permitido");
    }

    $controller = new ServicioController($conn);
    $controller->createOrUpdateService();

} catch (Throwable $e) {

    error_log($e->getMessage());

    Response::error("Error interno del servidor");
}