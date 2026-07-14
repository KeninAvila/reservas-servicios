<?php

require_once __DIR__ . '/../repositories/HorarioRepository.php';
require_once __DIR__ . '/../validators/HorarioValidator.php';

class HorarioService
{
    private $repo;

    public function __construct($conn)
    {
        $this->repo = new HorarioRepository($conn);
    }

    public function getSchedule(int $userId): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return ['success' => false, 'message' => 'Debe completar su perfil profesional.', 'data' => []];
        }

        $horarios = $this->repo->findByProfesionalId($profesionalId);

        return ['success' => true, 'message' => 'Horarios obtenidos.', 'data' => $horarios];
    }

    public function saveSchedule(int $userId, array $input): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return ['success' => false, 'message' => 'Debe completar su perfil profesional.'];
        }

        $validation = HorarioValidator::validateSchedule($input);

        if (!$validation['success']) {
            return $validation;
        }

        foreach ($validation['data'] as $h) {
            $activo = !empty($h['activo']) ? 1 : 0;
            $horaInicio = $activo ? $h['hora_inicio'] : '00:00';
            $horaFin    = $activo ? $h['hora_fin']    : '00:00';

            $ok = $this->repo->upsertDay(
                $profesionalId,
                (int)$h['dia_semana'],
                $horaInicio,
                $horaFin,
                $activo
            );

            if (!$ok) {
                return ['success' => false, 'message' => 'Error al guardar el horario del día ' . $h['dia_semana'] . '.'];
            }
        }

        return ['success' => true, 'message' => 'Horarios guardados correctamente.'];
    }
}
