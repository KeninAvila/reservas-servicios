<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

require_once __DIR__ . '/../../controllers/ServicioController.php';

try {

    // 1. Validar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error("Método no permitido");
    }

    // 2. Instanciar controller
    $controller = new ServicioController($conn);

    // 3. Ejecutar lógica
    $controller->listServices();

} catch (Throwable $e) {

    error_log("API serviceList: " . $e->getMessage());

    Response::error("Error interno del servidor");

}