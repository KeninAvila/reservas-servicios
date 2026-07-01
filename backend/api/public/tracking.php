<?php

require_once __DIR__ . '/../../controllers/PublicController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Método no permitido', 405);
}

$controller = new PublicController($conn);
$controller->getReservaByUuid();
