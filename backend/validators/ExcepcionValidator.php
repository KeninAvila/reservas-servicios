<?php

class ExcepcionValidator
{
    public function validateCreate(array $data): array
    {
        $errors = [];

        if (empty($data['fecha'])) {
            $errors[] = 'fecha es requerida';
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha'])) {
            $errors[] = 'formato de fecha inválido (YYYY-MM-DD)';
        } else {
            $fechaObj = DateTime::createFromFormat('Y-m-d', $data['fecha']);
            if ($fechaObj < new DateTime('today')) {
                $errors[] = 'la fecha no puede ser en el pasado';
            }
        }

        return $errors;
    }

    public function validateDelete(array $data): array
    {
        $errors = [];
        if (empty($data['id']) || !(int)$data['id'] > 0) {
            $errors[] = 'id es requerido';
        }
        return $errors;
    }
}
