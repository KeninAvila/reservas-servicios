<?php

require_once __DIR__ . '/../repositories/PublicRepository.php';
require_once __DIR__ . '/../validators/ReservaValidator.php';

class PublicService
{
    private $repo;

    public function __construct($conn)
    {
        $this->repo = new PublicRepository($conn);
    }

    public function listProfesionales(): array
    {
        $profesionales = $this->repo->listProfesionales();
        return ['success' => true, 'message' => 'Profesionales obtenidos.', 'data' => $profesionales];
    }

    public function getServicios(int $profesionalId): array
    {
        $servicios = $this->repo->getServiciosByProfesionalId($profesionalId);
        return ['success' => true, 'message' => 'Servicios obtenidos.', 'data' => $servicios];
    }

    public function getDisponibilidad(int $profesionalId, string $fecha, int $servicioId): array
    {
        // Validar formato de fecha
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
            return ['success' => false, 'message' => 'Formato de fecha inválido.'];
        }

        $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
        $hoy      = new DateTime('today');

        if ($fechaObj < $hoy) {
            return ['success' => false, 'message' => 'La fecha no puede ser en el pasado.'];
        }

        // Obtener configuración del profesional
        $config = $this->repo->getConfiguracion($profesionalId);
        $maxDias = (int)$config['max_reserva_dias'];
        $anticipacionHoras = (int)$config['anticipacion_horas'];
        $intervalo = (int)$config['intervalo_agenda'];

        $limiteMax = new DateTime("today +$maxDias days");
        if ($fechaObj > $limiteMax) {
            return ['success' => false, 'message' => "Solo se puede reservar con hasta $maxDias días de anticipación."];
        }

        // Verificar si hay excepción de horario para esa fecha
        if ($this->repo->checkExcepcion($profesionalId, $fecha)) {
            return ['success' => true, 'message' => 'El profesional no atiende ese día.', 'data' => []];
        }

        // Obtener horario del profesional para ese día de la semana
        $diaSemana = (int)$fechaObj->format('w'); // 0=domingo, 6=sábado
        $horario = $this->repo->getHorarioByDia($profesionalId, $diaSemana);

        if (!$horario) {
            return ['success' => true, 'message' => 'No hay horario disponible ese día.', 'data' => []];
        }

        // Obtener servicio para saber duración
        $servicio = $this->repo->getServicioById($servicioId, $profesionalId);
        if (!$servicio) {
            return ['success' => false, 'message' => 'Servicio no encontrado.'];
        }

        $duracion = (int)$servicio['duracion_min'];

        // Obtener reservas ya ocupadas ese día
        $ocupadas = $this->repo->getReservasOcupadas($profesionalId, $fecha);

        // Generar todos los slots posibles
        $ahora = new DateTime();
        $minHoraReserva = (clone $ahora)->modify("+$anticipacionHoras hours");

        $slots = [];
        $inicio = new DateTime("$fecha {$horario['hora_inicio']}");
        $fin    = new DateTime("$fecha {$horario['hora_fin']}");

        $cursor = clone $inicio;
        while (true) {
            $slotFin = (clone $cursor)->modify("+$duracion minutes");
            if ($slotFin > $fin) break;

            $horaStr = $cursor->format('H:i');

            // Verificar anticipación mínima
            if ($cursor <= $minHoraReserva) {
                $cursor->modify("+$intervalo minutes");
                continue;
            }

            // Verificar superposición con reservas existentes
            $ocupado = false;
            foreach ($ocupadas as $r) {
                $rInicio = new DateTime("$fecha {$r['hora']}");
                $rFin    = (clone $rInicio)->modify("+{$r['duracion_min']} minutes");

                // Hay superposición si: cursor < rFin AND slotFin > rInicio
                if ($cursor < $rFin && $slotFin > $rInicio) {
                    $ocupado = true;
                    break;
                }
            }

            if (!$ocupado) {
                $slots[] = $horaStr;
            }

            $cursor->modify("+$intervalo minutes");
        }

        return ['success' => true, 'message' => 'Disponibilidad calculada.', 'data' => $slots];
    }

    public function getReservaByUuid(string $uuid): ?array
    {
        return $this->repo->findByUuid($uuid);
    }

    public function createReserva(array $input): array
    {
        $validation = ReservaValidator::validateCreate($input);

        if (!$validation['success']) {
            return $validation;
        }

        $data = $validation['data'];

        // Verificar que el servicio existe y pertenece al profesional
        $servicio = $this->repo->getServicioById($data['servicio_id'], $data['profesional_id']);
        if (!$servicio) {
            return ['success' => false, 'message' => 'Servicio no disponible.'];
        }

        // Verificar disponibilidad del slot
        $disponibilidad = $this->getDisponibilidad($data['profesional_id'], $data['fecha'], $data['servicio_id']);

        if (!$disponibilidad['success']) {
            return ['success' => false, 'message' => $disponibilidad['message']];
        }

        if (!in_array($data['hora'], $disponibilidad['data'], true)) {
            return ['success' => false, 'message' => 'El horario seleccionado ya no está disponible. Por favor elige otro.'];
        }

        $estadoId = $this->repo->getEstadoId('PENDIENTE');
        if (!$estadoId) {
            return ['success' => false, 'message' => 'Error interno al obtener estado.'];
        }

        $uuid = $this->repo->createReserva([
            'profesional_id'   => $data['profesional_id'],
            'servicio_id'      => $data['servicio_id'],
            'estado_id'        => $estadoId,
            'cliente_nombre'   => $data['cliente_nombre'],
            'cliente_telefono' => $data['cliente_telefono'],
            'cliente_nota'     => $data['cliente_nota'],
            'fecha'            => $data['fecha'],
            'hora'             => $data['hora'],
            'duracion_min'     => $servicio['duracion_min'],
            'precio'           => $servicio['precio'],
        ]);

        if (!$uuid) {
            return ['success' => false, 'message' => 'Error al crear la reserva.'];
        }

        return [
            'success' => true,
            'message' => 'Reserva creada correctamente. El profesional confirmará tu cita.',
            'data'    => ['uuid' => $uuid],
        ];
    }
}
