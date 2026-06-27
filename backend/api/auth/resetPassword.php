<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../controllers/PasswordController.php';

header("Content-Type: application/json");

// JSON body
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    $data = [];
}

// Priorizar el token que llega por la URL y, si no existe, usar el body
$queryToken = $_GET['token'] ?? ($_POST['token'] ?? null);
if (is_string($queryToken)) {
    $queryToken = trim($queryToken);
}

if (!empty($queryToken)) {
    $data['token'] = $queryToken;
} elseif (!isset($data['token']) || trim((string)($data['token'] ?? '')) === '') {
    $data['token'] = null;
}

$controller = new PasswordController($conn);
$controller->resetPassword($data);