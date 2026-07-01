<?php

require_once __DIR__ . '/../repositories/ProfesionalRepository.php';
require_once __DIR__ . '/../validators/ProfesionalValidator.php';

class ProfesionalService
{

    private $repo;

    public function __construct($conn)
    {
        $this->repo = new ProfesionalRepository($conn);
    }

    public function getProfileByUserId($userId)
    {
        return $this->repo->findByUserId($userId);
    }

    public function getFullProfile(int $userId)
    {
        $profile = $this->repo->findByUserId($userId);

        if (!$profile) {
            throw new Exception("El profesional aún no ha creado su perfil.");
        }

        return $profile;
    }

    public function createOrUpdateProfile($userId, $data)
    {
        $validation = ProfesionalValidator::validate($data);

        if (!$validation['success']) {
            return $validation;
        }

        $normalizedData = $validation['data'];

        $saved = $this->repo->upsertProfile($userId, $normalizedData);

        if ($saved === false) {
            return [
                'success' => false,
                'message' => 'Error al guardar el perfil'
            ];
        }

        return [
            'success' => true,
            'message' => 'Perfil guardado correctamente'
        ];
    }
}
