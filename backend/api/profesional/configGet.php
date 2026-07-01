<?php

require_once __DIR__ . '/../../controllers/ConfiguracionController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Método no permitido', 405);
}

$controller = new ConfiguracionController($conn);
$controller->getConfig();
