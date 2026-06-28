<?php

require_once __DIR__ . '/../../controllers/ProfesionalController.php';
require_once __DIR__ . '/../../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error("Método no permitido");
}

$controller = new ProfesionalController($conn);
$controller->getProfile();