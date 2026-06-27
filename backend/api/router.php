<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

header("Content-Type: application/json");

// ==========================
// 1. OBTENER RUTA
// ==========================
$route = $_GET['route'] ?? null;

if (!$route) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Ruta no especificada"
    ]);
    exit;
}

// ==========================
// 2. RUTAS PÚBLICAS
// ==========================
$publicRoutes = [
    'auth/login',
    'auth/register',
    'auth/verify',
    'auth/resendVerification',
    'auth/forgotPassword',
    'auth/resetPassword'
];

// ==========================
// 3. MIDDLEWARE GLOBAL
// ==========================
if (!in_array($route, $publicRoutes)) {

    $middleware = new AuthMiddleware($conn);
    $user = $middleware->check();

    // opcional: exponer usuario global
    $GLOBALS['auth_user'] = $user;
}

// ==========================
// 4. ROUTER PRINCIPAL
// ==========================
switch ($route) {

    // --------------------------
    // AUTH
    // --------------------------
    case 'auth/login':
        require_once __DIR__ . '/auth/login.php';
        break;

    case 'auth/register':
        require_once __DIR__ . '/auth/register.php';
        break;

    case 'auth/verify':
        require_once __DIR__ . '/auth/verify.php';
        break;

    case 'auth/resendVerification':
        require_once __DIR__ . '/auth/resendVerification.php';
        break;

    case 'auth/forgotPassword':
        require_once __DIR__ . '/auth/forgotPassword.php';
        break;

    case 'auth/resetPassword':
        require_once __DIR__ . '/auth/resetPassword.php';
        break;

    // --------------------------
    // USER (PROTEGIDO)
    // --------------------------
    case 'user/profile':
        require_once __DIR__ . '/user/profile.php';
        break;

    case 'user/update':
        require_once __DIR__ . '/user/update.php';
        break;

    // --------------------------
    // DEFAULT
    // --------------------------
    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Ruta no encontrada"
        ]);
        break;
}
