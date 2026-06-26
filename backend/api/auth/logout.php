<?php

require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../controllers/AuthController.php';
require_once __DIR__ . '/../../config/db.php';

header("Content-Type: application/json");

$controller = new AuthController($conn);
$controller->logout();