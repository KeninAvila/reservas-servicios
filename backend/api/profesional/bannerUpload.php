<?php

require_once __DIR__ . '/../../helpers/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Método no permitido', 405);
}

$user = AuthMiddleware::check();

if (!isset($_FILES['banner']) || $_FILES['banner']['error'] !== UPLOAD_ERR_OK) {
    Response::error('No se recibió ningún archivo válido.');
}

$file     = $_FILES['banner'];
$maxBytes = 5 * 1024 * 1024; // 5 MB
$allowed  = ['image/jpeg', 'image/png', 'image/webp'];

if ($file['size'] > $maxBytes) {
    Response::error('La imagen no puede superar 5 MB.');
}

$mime = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed)) {
    Response::error('Solo se aceptan imágenes JPG, PNG o WebP.');
}

$ext      = $mime === 'image/png' ? 'png' : ($mime === 'image/webp' ? 'webp' : 'jpg');
$filename = 'banner_' . $user['id'] . '.' . $ext;
$destDir  = __DIR__ . '/../../uploads/banners/';
$destPath = $destDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    Response::error('Error al guardar la imagen.');
}

$bannerUrl = '/appweb/backend/uploads/banners/' . $filename;

$stmt = $conn->prepare("UPDATE profesionales_perfil SET banner = ? WHERE user_id = ?");
$stmt->bind_param("si", $bannerUrl, $user['id']);

if (!$stmt->execute() || $stmt->affected_rows < 1) {
    Response::error('No se pudo actualizar el perfil. ¿Tienes un perfil creado?');
}

Response::success('Banner actualizado.', ['banner' => $bannerUrl]);
