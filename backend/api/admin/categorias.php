<?php

require_once __DIR__ . '/../../controllers/AdminController.php';

$controller = new AdminController($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $controller->listCategorias();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->createCategoria();
} else {
    Response::error('Método no permitido');
}
