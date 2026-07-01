<?php

require_once __DIR__ . '/../../controllers/ExcepcionController.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Método no permitido');
}

$controller = new ExcepcionController($conn);
$controller->listExcepciones();
