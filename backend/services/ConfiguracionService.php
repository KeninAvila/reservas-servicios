<?php

require_once __DIR__ . '/../repositories/ConfiguracionRepository.php';
require_once __DIR__ . '/../validators/ConfiguracionValidator.php';

class ConfiguracionService
{
    private ConfiguracionRepository $repo;
    private ConfiguracionValidator  $validator;

    private const DEFAULTS = [
        'intervalo_agenda'  => 15,
        'anticipacion_horas' => 2,
        'max_reserva_dias'  => 60,
    ];

    public function __construct($conn)
    {
        $this->repo      = new ConfiguracionRepository($conn);
        $this->validator = new ConfiguracionValidator();
    }

    public function getConfig(int $userId): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);
        if (!$profesionalId) {
            return self::DEFAULTS;
        }
        $data = $this->repo->findByProfesionalId($profesionalId);
        return $data ?: self::DEFAULTS;
    }

    public function saveConfig(int $userId, array $input): array
    {
        $errors = $this->validator->validate($input);
        if ($errors) {
            return ['ok' => false, 'errors' => $errors];
        }

        $profesionalId = $this->repo->getProfileIdByUserId($userId);
        if (!$profesionalId) {
            return ['ok' => false, 'errors' => ['Debe completar su perfil antes de configurar la agenda']];
        }

        $ok = $this->repo->upsert(
            $profesionalId,
            (int)$input['intervalo_agenda'],
            (int)$input['anticipacion_horas'],
            (int)$input['max_reserva_dias']
        );

        return ['ok' => $ok];
    }
}
