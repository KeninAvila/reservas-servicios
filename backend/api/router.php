<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
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
    'auth/resetPassword',
    'auth/google',
    'public/profesionales',
    'public/servicios',
    'public/disponibilidad',
    'public/reserva',
    'public/reserva/cancel',
    'public/tracking',
    'public/categorias',
    'public/profesional',
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

    case 'auth/logout':
        require_once __DIR__ . '/auth/logout.php';
        break;

    case 'auth/me':
        require_once __DIR__ . '/auth/me.php';
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

    case 'auth/google':
        require_once __DIR__ . '/auth/google.php';
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
    // PROFESSIONAL 
    // --------------------------

    case 'professional/profile/create':
        require_once __DIR__ . '/profesional/upsertProfile.php';
        break;

    case 'professional/service/upsert':
        require_once __DIR__ . '/profesional/upsertService.php';
        break;

    case 'professional/profile':
        require_once __DIR__ . '/profesional/profile.php';
        break;

    case 'professional/service/list':
        require_once __DIR__ . '/profesional/serviceList.php';
        break;

    case 'professional/service':
        require_once __DIR__ . '/profesional/serviceGet.php';
        break;

    case 'professional/service/status':
        require_once __DIR__ . '/profesional/serviceStatus.php';
        break;

    case 'professional/service/delete':
        require_once __DIR__ . '/profesional/serviceDelete.php';
        break;

    case 'professional/schedule':
        require_once __DIR__ . '/profesional/scheduleGet.php';
        break;

    case 'professional/schedule/save':
        require_once __DIR__ . '/profesional/scheduleUpsert.php';
        break;

    case 'professional/reservas':
        require_once __DIR__ . '/profesional/reservaList.php';
        break;

    case 'professional/reservas/status':
        require_once __DIR__ . '/profesional/reservaStatus.php';
        break;

    case 'professional/config':
        require_once __DIR__ . '/profesional/configGet.php';
        break;

    case 'professional/config/save':
        require_once __DIR__ . '/profesional/configUpsert.php';
        break;

    case 'professional/excepciones':
        require_once __DIR__ . '/profesional/excepcionList.php';
        break;

    case 'professional/excepciones/create':
        require_once __DIR__ . '/profesional/excepcionCreate.php';
        break;

    case 'professional/excepciones/delete':
        require_once __DIR__ . '/profesional/excepcionDelete.php';
        break;

    case 'professional/stats':
        require_once __DIR__ . '/profesional/stats.php';
        break;

    case 'professional/reserva/responder':
        require_once __DIR__ . '/profesional/reservaResponderUuid.php';
        break;

    case 'professional/banner/upload':
        require_once __DIR__ . '/profesional/bannerUpload.php';
        break;

    // --------------------------
    // ADMIN (requiere id_rol=1)
    // --------------------------
    case 'admin/stats':
        require_once __DIR__ . '/admin/stats.php';
        break;

    case 'admin/profesionales':
        require_once __DIR__ . '/admin/profesionales.php';
        break;

    case 'admin/user/status':
        require_once __DIR__ . '/admin/userStatus.php';
        break;

    case 'admin/reservas':
        require_once __DIR__ . '/admin/reservas.php';
        break;

    case 'admin/categorias':
        require_once __DIR__ . '/admin/categorias.php';
        break;

    case 'admin/categorias/delete':
        require_once __DIR__ . '/admin/categoriaDelete.php';
        break;

    // --------------------------
    // PUBLIC (sin auth)
    // --------------------------
    case 'public/profesionales':
        require_once __DIR__ . '/public/profesionales.php';
        break;

    case 'public/servicios':
        require_once __DIR__ . '/public/servicios.php';
        break;

    case 'public/disponibilidad':
        require_once __DIR__ . '/public/disponibilidad.php';
        break;

    case 'public/reserva':
        require_once __DIR__ . '/public/reserva.php';
        break;

    case 'public/tracking':
        require_once __DIR__ . '/public/tracking.php';
        break;

    case 'public/categorias':
        require_once __DIR__ . '/public/categorias.php';
        break;

    case 'public/profesional':
        require_once __DIR__ . '/public/profesional.php';
        break;

    case 'public/reserva/cancel':
        require_once __DIR__ . '/public/reservaCancel.php';
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
