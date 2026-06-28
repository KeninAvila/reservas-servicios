<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../controllers/ProfesionalController.php';

header("Content-Type: application/json");

$controller = new ProfesionalController($conn);

echo $controller->createOrUpdateProfile();