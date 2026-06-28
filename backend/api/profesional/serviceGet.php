<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

require_once __DIR__ . '/../../controllers/ServicioController.php';

try {

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error("Método no permitido");
    }

    $controller = new ServicioController($conn);

    $controller->getServiceById();

} catch (Throwable $e) {

    error_log("API serviceGet: " . $e->getMessage());

    Response::error("Error interno del servidor");

}