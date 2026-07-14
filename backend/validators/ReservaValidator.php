<?php

class ReservaValidator
{
    const TRANSICIONES_PROFESIONAL = [
        'PENDIENTE' => ['ACEPTADA', 'RECHAZADA'],
        'ACEPTADA'  => ['FINALIZADA'],
    ];

    public static function validateStatus(array $data): array
    {
        if (!isset($data['id']) || !is_numeric($data['id'])) {
            return ['success' => false, 'message' => 'ID de reserva inválido.'];
        }

        $estadosPermitidos = ['ACEPTADA', 'RECHAZADA', 'FINALIZADA'];
        if (!isset($data['estado']) || !in_array($data['estado'], $estadosPermitidos, true)) {
            return ['success' => false, 'message' => 'Estado inválido. Valores permitidos: ACEPTADA, RECHAZADA, FINALIZADA.'];
        }

        return [
            'success' => true,
            'data' => [
                'id'       => (int)$data['id'],
                'estado'   => $data['estado'],
                'respuesta' => isset($data['respuesta']) ? trim($data['respuesta']) : null,
            ]
        ];
    }

    public static function validateCreate(array $data): array
    {
        $required = ['profesional_id', 'servicio_id', 'cliente_nombre', 'cliente_telefono', 'fecha', 'hora'];

        foreach ($required as $field) {
            if (empty($data[$field]) && $data[$field] !== 0) {
                return ['success' => false, 'message' => "El campo $field es requerido."];
            }
        }

        if (!is_numeric($data['profesional_id']) || (int)$data['profesional_id'] <= 0) {
            return ['success' => false, 'message' => 'profesional_id inválido.'];
        }

        if (!is_numeric($data['servicio_id']) || (int)$data['servicio_id'] <= 0) {
            return ['success' => false, 'message' => 'servicio_id inválido.'];
        }

        $nombre = trim($data['cliente_nombre']);
        if (strlen($nombre) < 2 || strlen($nombre) > 150) {
            return ['success' => false, 'message' => 'Nombre del cliente inválido (2–150 caracteres).'];
        }

        $telefono = trim($data['cliente_telefono']);
        if (!preg_match('/^\+?\d{7,20}$/', preg_replace('/[\s\-]/', '', $telefono))) {
            return ['success' => false, 'message' => 'Teléfono inválido.'];
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['fecha'])) {
            return ['success' => false, 'message' => 'Formato de fecha inválido. Use YYYY-MM-DD.'];
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $data['hora'])) {
            return ['success' => false, 'message' => 'Formato de hora inválido. Use HH:MM.'];
        }

        return [
            'success' => true,
            'data' => [
                'profesional_id' => (int)$data['profesional_id'],
                'servicio_id'    => (int)$data['servicio_id'],
                'cliente_nombre' => $nombre,
                'cliente_telefono' => $telefono,
                'cliente_nota'   => isset($data['cliente_nota']) ? trim($data['cliente_nota']) : null,
                'fecha'          => $data['fecha'],
                'hora'           => $data['hora'],
            ]
        ];
    }
}
