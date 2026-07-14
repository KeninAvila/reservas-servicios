<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../controllers/PasswordController.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$controller = new PasswordController($conn);
$controller->forgotPassword($data);
