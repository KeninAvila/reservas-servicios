<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

header("Content-Type: application/json");

// 🔐 Validar sesión antes de continuar
AuthMiddleware::check();

$controller = new AuthController($conn);
$controller->me();