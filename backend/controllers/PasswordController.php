<?php

require_once __DIR__ . '/../services/PasswordService.php';
require_once __DIR__ . '/../helpers/Response.php';

if (!class_exists('PasswordService')) {
    throw new RuntimeException('No se pudo cargar PasswordService');
}

class PasswordController
{
    private $passwordService;

    public function __construct($conn)
    {
        $this->passwordService = new PasswordService($conn);
    }

    public function forgotPassword($data)
    {
        $result = $this->passwordService->forgotPassword($data);

        if (!$result['success']) {
            Response::error($result['message']);
        }

        Response::success($result['message']);
    }

    public function resetPassword($data)
    {
        $result = $this->passwordService->resetPassword($data);

        if (!$result['success']) {
            Response::error($result['message']);
        }

        Response::success($result['message']);
    }
}
