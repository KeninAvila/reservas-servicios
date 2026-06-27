<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../controllers/AuthController.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    $data = [];
}

$controller = new AuthController($conn);
$controller->resendVerification($data);
