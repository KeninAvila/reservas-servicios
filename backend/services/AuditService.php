<?php

require_once __DIR__ . '/../repositories/AuditRepository.php';

class AuditService
{
    private AuditRepository $repo;

    public function __construct($conn)
    {
        $this->repo = new AuditRepository($conn);
    }

    public function log(int $userId, string $accion, string $tabla, ?int $registroId = null, ?string $detalles = null): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $this->repo->insert($userId, $accion, $tabla, $registroId, $detalles, $ip);
    }
}
