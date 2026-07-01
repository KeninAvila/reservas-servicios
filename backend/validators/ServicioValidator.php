<?php

class ServicioValidator
{
    public static function validate(array $data): array
    {
        $nombre = trim($data['nombre'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');
        $precio = $data['precio'] ?? null;
        $duracionMin = $data['duracion_min'] ?? null;
        $estado = isset($data['estado']) ? trim((string)$data['estado']) : 'activo';

        if ($nombre === '') {
            return [
                'success' => false,
                'message' => 'El nombre es obligatorio.'
            ];
        }

        if (strlen($nombre) > 100) {
            return [
                'success' => false,
                'message' => 'El nombre no puede superar los 100 caracteres.'
            ];
        }

        if ($descripcion === '') {
            return [
                'success' => false,
                'message' => 'La descripción es obligatoria.'
            ];
        }

        if ($precio === null || $precio === '' || !is_numeric($precio)) {
            return [
                'success' => false,
                'message' => 'Precio inválido.'
            ];
        }

        $precio = (float)$precio;

        if ($precio <= 0) {
            return [
                'success' => false,
                'message' => 'El precio debe ser mayor a cero.'
            ];
        }

        if ($duracionMin === null || $duracionMin === '' || !is_numeric($duracionMin)) {
            return [
                'success' => false,
                'message' => 'Duración inválida.'
            ];
        }

        $duracion = (int)$duracionMin;

        if ($duracion < 5 || $duracion > 480) {
            return [
                'success' => false,
                'message' => 'La duración debe estar entre 5 y 480 minutos.'
            ];
        }

        if (!in_array($estado, ['activo', 'inactivo'], true)) {
            return [
                'success' => false,
                'message' => 'Estado inválido.'
            ];
        }

        return [
            'success' => true,
            'data' => [
                'id' => $data['id'] ?? null,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'precio' => $precio,
                'duracion_min' => $duracion,
                'estado' => $estado,
            ]
        ];
    }
}
