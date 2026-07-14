<?php

class ConfiguracionValidator
{
    private const INTERVALOS_VALIDOS = [5, 10, 15, 20, 30, 45, 60];

    public function validate(array $data): array
    {
        $errors = [];

        if (!isset($data['intervalo_agenda']) || !in_array((int)$data['intervalo_agenda'], self::INTERVALOS_VALIDOS)) {
            $errors[] = 'intervalo_agenda debe ser uno de: ' . implode(', ', self::INTERVALOS_VALIDOS);
        }

        if (!isset($data['anticipacion_horas'])) {
            $errors[] = 'anticipacion_horas es requerido';
        } elseif ((int)$data['anticipacion_horas'] < 1 || (int)$data['anticipacion_horas'] > 48) {
            $errors[] = 'anticipacion_horas debe estar entre 1 y 48';
        }

        if (!isset($data['max_reserva_dias'])) {
            $errors[] = 'max_reserva_dias es requerido';
        } elseif ((int)$data['max_reserva_dias'] < 1 || (int)$data['max_reserva_dias'] > 365) {
            $errors[] = 'max_reserva_dias debe estar entre 1 y 365';
        }

        return $errors;
    }
}
