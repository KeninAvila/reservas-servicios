<?php

require_once __DIR__ . '/../repositories/ExcepcionRepository.php';
require_once __DIR__ . '/../validators/ExcepcionValidator.php';

class ExcepcionService
{
    private ExcepcionRepository $repo;
    private ExcepcionValidator  $validator;

    public function __construct($conn)
    {
        $this->repo      = new ExcepcionRepository($conn);
        $this->validator = new ExcepcionValidator();
    }

    public function listExcepciones(int $userId): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);
        if (!$profesionalId) {
            return ['ok' => false, 'errors' => ['Perfil profesional no encontrado']];
        }

        return ['ok' => true, 'data' => $this->repo->findByProfesionalId($profesionalId)];
    }

    public function addExcepcion(int $userId, array $input): array
    {
        $errors = $this->validator->validateCreate($input);
        if ($errors) {
            return ['ok' => false, 'errors' => $errors];
        }

        $profesionalId = $this->repo->getProfileIdByUserId($userId);
        if (!$profesionalId) {
            return ['ok' => false, 'errors' => ['Perfil profesional no encontrado']];
        }

        if ($this->repo->existsForDate($profesionalId, $input['fecha'])) {
            return ['ok' => false, 'errors' => ['Ya existe una excepción para esa fecha']];
        }

        $ok = $this->repo->create($profesionalId, $input['fecha'], $input['motivo'] ?? null);
        return ['ok' => $ok];
    }

    public function removeExcepcion(int $userId, array $input): array
    {
        $errors = $this->validator->validateDelete($input);
        if ($errors) {
            return ['ok' => false, 'errors' => $errors];
        }

        $profesionalId = $this->repo->getProfileIdByUserId($userId);
        if (!$profesionalId) {
            return ['ok' => false, 'errors' => ['Perfil profesional no encontrado']];
        }

        $ok = $this->repo->delete((int)$input['id'], $profesionalId);
        if (!$ok) {
            return ['ok' => false, 'errors' => ['Excepción no encontrada']];
        }

        return ['ok' => true];
    }
}
