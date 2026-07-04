<?php

require_once __DIR__ . '/../../controllers/ReservaController.php';
require_once __DIR__ . '/../../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Método no permitido', 405);
}

$controller = new ReservaController($conn);
$controller->responderByUuid();
