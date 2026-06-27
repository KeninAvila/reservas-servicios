<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../controllers/PasswordController.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$controller = new PasswordController($conn);
$controller->forgotPassword($data);