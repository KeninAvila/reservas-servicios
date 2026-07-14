<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../repositories/UsuarioRepository.php';

class Verify
{
    public function verify($token)
    {
        $repo = new UsuarioRepository($GLOBALS['conn']);

        $user = $repo->findByToken($token);

        if (!$user) {
            return [
                "success" => false,
                "message" => "Token inválido"
            ];
        }

        if (strtotime($user['verification_expires']) < time()) {
            return [
                "success" => false,
                "message" => "Token expirado"
            ];
        }

        $repo->verifyEmail($user['id']);

        return [
            "success" => true,
            "message" => "Cuenta verificada correctamente"
        ];
    }
}

$token = $_GET['token'] ?? null;

$verify = new Verify();

echo json_encode($verify->verify($token));
