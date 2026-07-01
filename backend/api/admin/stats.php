<?php

require_once __DIR__ . '/../../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Método no permitido', 405);
}

$controller = new AdminController($conn);
$controller->getStats();
