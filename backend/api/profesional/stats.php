<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../controllers/ReservaController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Método no permitido');
}

$controller = new ReservaController($conn);
$controller->getStats();
