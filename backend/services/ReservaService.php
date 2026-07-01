<?php

require_once __DIR__ . '/../repositories/ReservaRepository.php';
require_once __DIR__ . '/../validators/ReservaValidator.php';
require_once __DIR__ . '/../services/AuditService.php';

class ReservaService
{
    private $repo;
    private AuditService $audit;

    public function __construct($conn)
    {
        $this->repo  = new ReservaRepository($conn);
        $this->audit = new AuditService($conn);
    }

    public function listReservas(int $userId, ?string $estado = null): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return ['success' => false, 'message' => 'Perfil profesional no encontrado.', 'data' => []];
        }

        $reservas = $this->repo->listByProfesionalId($profesionalId, $estado);

        return ['success' => true, 'message' => 'Reservas obtenidas.', 'data' => $reservas];
    }

    public function changeStatus(int $userId, array $input): array
    {
        $profesionalId = $this->repo->getProfileIdByUserId($userId);

        if (!$profesionalId) {
            return ['success' => false, 'message' => 'Perfil profesional no encontrado.'];
        }

        $validation = ReservaValidator::validateStatus($input);

        if (!$validation['success']) {
            return $validation;
        }

        $data = $validation['data'];

        $reserva = $this->repo->findById($data['id'], $profesionalId);

        if (!$reserva) {
            return ['success' => false, 'message' => 'Reserva no encontrada o no pertenece al profesional.'];
        }

        $estadoActual = $reserva['estado'];
        $nuevoEstado  = $data['estado'];

        $transiciones = ReservaValidator::TRANSICIONES_PROFESIONAL;

        if (!isset($transiciones[$estadoActual]) || !in_array($nuevoEstado, $transiciones[$estadoActual], true)) {
            return ['success' => false, 'message' => "No se puede cambiar de $estadoActual a $nuevoEstado."];
        }

        $estadoId = $this->repo->getEstadoId($nuevoEstado);

        if (!$estadoId) {
            return ['success' => false, 'message' => 'Estado no encontrado en la base de datos.'];
        }

        $updated = $this->repo->updateStatus($data['id'], $profesionalId, $estadoId, $data['respuesta']);

        if (!$updated) {
            return ['success' => false, 'message' => 'No se pudo actualizar la reserva.'];
        }

        $this->audit->log($userId, 'CAMBIO_ESTADO_RESERVA', 'reservas', $data['id'],
            "De: $estadoActual → A: $nuevoEstado");

        return ['success' => true, 'message' => 'Estado actualizado correctamente.'];
    }
}
