<?php

class AdminValidator
{
    private const ESTADOS_VALIDOS = ['ACTIVO', 'SUSPENDIDO'];

    public function validateStatus(array $data): array
    {
        $errors = [];

        if (empty($data['user_id']) || !(int)$data['user_id'] > 0) {
            $errors[] = 'user_id es requerido';
        }

        if (empty($data['estado']) || !in_array($data['estado'], self::ESTADOS_VALIDOS)) {
            $errors[] = 'estado debe ser ACTIVO o SUSPENDIDO';
        }

        return $errors;
    }
}
