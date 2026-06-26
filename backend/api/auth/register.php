<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../controllers/AuthController.php';

header("Content-Type: application/json");

// Permitir JSON input
$data = json_decode(file_get_contents("php://input"), true);

$controller = new AuthController($conn);
$controller->register($data);