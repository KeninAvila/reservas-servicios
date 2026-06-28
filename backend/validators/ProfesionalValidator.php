<?php

class ProfesionalValidator
{
    public static function validate(array $data): array
    {
        if (!isset($data['categoria_id']) || $data['categoria_id'] === '') {
            return [
                'success' => false,
                'message' => 'La categoría es obligatoria.'
            ];
        }

        if (!isset($data['provincia_id']) || $data['provincia_id'] === '') {
            return [
                'success' => false,
                'message' => 'La provincia es obligatoria.'
            ];
        }

        if (!isset($data['ciudad_id']) || $data['ciudad_id'] === '') {
            return [
                'success' => false,
                'message' => 'La ciudad es obligatoria.'
            ];
        }

        $googleMapsUrl = trim($data['google_maps_url'] ?? '');
        if ($googleMapsUrl === '') {
            return [
                'success' => false,
                'message' => 'El enlace de Google Maps es obligatorio.'
            ];
        }

        $descripcion = trim($data['descripcion'] ?? '');
        if ($descripcion === '') {
            return [
                'success' => false,
                'message' => 'La descripción es obligatoria.'
            ];
        }

        $direccion1 = trim($data['direccion_1'] ?? '');
        if ($direccion1 === '') {
            return [
                'success' => false,
                'message' => 'La dirección 1 es obligatoria.'
            ];
        }

        $direccion2 = trim($data['direccion_2'] ?? '');

        return [
            'success' => true,
            'data' => [
                'categoria_id' => (int)$data['categoria_id'],
                'provincia_id' => (int)$data['provincia_id'],
                'ciudad_id' => (int)$data['ciudad_id'],
                'google_maps_url' => $googleMapsUrl,
                'descripcion' => $descripcion,
                'direccion_1' => $direccion1,
                'direccion_2' => $direccion2,
            ]
        ];
    }
}
