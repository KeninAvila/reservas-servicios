<?php

require_once __DIR__ . '/../../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Método no permitido');
}

$controller = new AdminController($conn);
$controller->deleteCategoria();
