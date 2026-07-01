<?php

require_once __DIR__ . '/../repositories/ServicioRepository.php';
require_once __DIR__ . '/../validators/ServicioValidator.php';

class ServicioService
{
    private $repository;

    public function __construct($conn)
    {
        $this->repository = new ServicioRepository($conn);
    }

    /**
     * Crear o actualizar un servicio.
     */
    public function createOrUpdateService(int $userId, array $data): array
    {
        // ===========================
        // Verificar perfil profesional
        // ===========================

        $profesionalId = $this->repository->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return [
                "success" => false,
                "message" => "Debe completar su perfil antes de crear servicios."
            ];
        }

        // ===========================
        // Validar datos del servicio
        // ===========================

        $validation = ServicioValidator::validate($data);

        if (!$validation['success']) {
            return $validation;
        }

        $normalizedData = $validation['data'];

        return $this->repository->upsertService(
            $profesionalId,
            $normalizedData
        );
    }

    public function listServices(int $userId): array
    {
        // 1. Obtener profesional_id desde user_id
        $profesionalId = $this->repository->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return [
                "success" => false,
                "message" => "Debe completar su perfil profesional.",
                "data" => []
            ];
        }

        // 2. Obtener servicios
        $services = $this->repository->getServicesByProfessionalId($profesionalId);

        // 3. Respuesta de negocio
        return [
            "success" => true,
            "message" => "Servicios obtenidos correctamente.",
            "data" => $services
        ];
    }

    public function getServiceById(int $userId, int $serviceId): array
    {
        // 1. obtener profesional
        $profesionalId = $this->repository->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return [
                "success" => false,
                "message" => "Debe completar su perfil profesional.",
                "data" => null
            ];
        }

        // 2. obtener servicio
        $service = $this->repository->getServiceById($serviceId, $profesionalId);

        if (!$service) {
            return [
                "success" => false,
                "message" => "Servicio no encontrado.",
                "data" => null
            ];
        }

        // 3. respuesta
        return [
            "success" => true,
            "message" => "Servicio obtenido correctamente.",
            "data" => $service
        ];
    }

    public function changeStatus(int $userId, int $serviceId, string $estado): array
    {
        // 1. obtener profesional
        $profesionalId = $this->repository->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return [
                "success" => false,
                "message" => "Debe completar su perfil profesional."
            ];
        }

        // 2. validar estado
        if (!in_array($estado, ['activo', 'inactivo'])) {
            return [
                "success" => false,
                "message" => "Estado inválido."
            ];
        }

        // 3. actualizar
        $updated = $this->repository->updateServiceStatus(
            $serviceId,
            $profesionalId,
            $estado
        );

        if (!$updated) {
            return [
                "success" => false,
                "message" => "No fue posible actualizar el estado."
            ];
        }

        return [
            "success" => true,
            "message" => "Estado actualizado correctamente."
        ];
    }

    public function deleteService(int $userId, int $serviceId): array
    {
        // 1. obtener profesional
        $profesionalId = $this->repository->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return [
                "success" => false,
                "message" => "Debe completar su perfil profesional."
            ];
        }

        // 2. eliminar (soft delete)
        $deleted = $this->repository->deleteService($serviceId, $profesionalId);

        // 3. si no afectó filas → no existe o no es suyo
        if (!$deleted) {
            return [
                "success" => false,
                "message" => "Servicio no encontrado o no pertenece al profesional."
            ];
        }

        return [
            "success" => true,
            "message" => "Servicio eliminado correctamente."
        ];
    }
}
