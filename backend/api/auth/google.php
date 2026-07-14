<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../services/GoogleAuthService.php';
require_once __DIR__ . '/../../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    Response::error('Método no permitido');
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$service = new GoogleAuthService($conn);
$result = $service->authenticate(trim((string)($input['credential'] ?? '')), isset($input['password']) ? (string)$input['password'] : null);

if (!$result['success']) Response::error($result['message'], ['requires_link' => !empty($result['requires_link'])]);

$data = $result['data'];
$user = $data['user'];
session_regenerate_id(true);
$_SESSION['usuario_id'] = $user['id'];
$_SESSION['rol'] = $user['id_rol'];
$_SESSION['session_id'] = $data['session_id'];
Response::success($result['message'], $user);
