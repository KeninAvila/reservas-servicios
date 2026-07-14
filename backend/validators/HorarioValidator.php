<?php

class HorarioValidator
{
    public static function validateSchedule(array $data): array
    {
        if (!isset($data['horarios']) || !is_array($data['horarios'])) {
            return ['success' => false, 'message' => 'Formato de horarios inválido.'];
        }

        foreach ($data['horarios'] as $h) {
            if (!isset($h['dia_semana']) || !is_numeric($h['dia_semana'])) {
                return ['success' => false, 'message' => 'dia_semana inválido.'];
            }

            $dia = (int)$h['dia_semana'];
            if ($dia < 0 || $dia > 6) {
                return ['success' => false, 'message' => 'dia_semana debe estar entre 0 (domingo) y 6 (sábado).'];
            }

            $activo = !empty($h['activo']);

            if ($activo) {
                if (empty($h['hora_inicio']) || empty($h['hora_fin'])) {
                    return ['success' => false, 'message' => "hora_inicio y hora_fin son requeridos cuando el día $dia está activo."];
                }

                if (!preg_match('/^\d{2}:\d{2}$/', $h['hora_inicio']) || !preg_match('/^\d{2}:\d{2}$/', $h['hora_fin'])) {
                    return ['success' => false, 'message' => 'Formato de hora inválido. Use HH:MM.'];
                }

                if ($h['hora_inicio'] >= $h['hora_fin']) {
                    return ['success' => false, 'message' => 'hora_fin debe ser mayor que hora_inicio.'];
                }
            }
        }

        return ['success' => true, 'data' => $data['horarios']];
    }
}
