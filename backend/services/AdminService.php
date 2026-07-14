<?php

require_once __DIR__ . '/../repositories/AdminRepository.php';
require_once __DIR__ . '/../validators/AdminValidator.php';

class AdminService
{
    private AdminRepository $repo;
    private AdminValidator  $validator;

    public function __construct($conn)
    {
        $this->repo      = new AdminRepository($conn);
        $this->validator = new AdminValidator();
    }

    public function getStats(): array
    {
        return $this->repo->getStats();
    }

    public function listProfesionales(?string $estado = null): array
    {
        $estadoNorm = $estado ? strtoupper($estado) : null;
        return $this->repo->listProfesionales($estadoNorm);
    }

    public function changeUserStatus(array $input): array
    {
        $errors = $this->validator->validateStatus($input);
        if ($errors) {
            return ['ok' => false, 'errors' => $errors];
        }

        $ok = $this->repo->updateUserStatus((int)$input['user_id'], strtoupper($input['estado']));
        if (!$ok) {
            return ['ok' => false, 'errors' => ['Profesional no encontrado']];
        }

        return ['ok' => true];
    }

    public function listReservas(?string $estado = null): array
    {
        $estadoNorm = $estado ? strtoupper($estado) : null;
        return $this->repo->listReservas($estadoNorm);
    }

    public function listCategorias(): array
    {
        return $this->repo->listCategorias();
    }

    public function createCategoria(array $input): array
    {
        $nombre = trim($input['nombre'] ?? '');
        if ($nombre === '') {
            return ['ok' => false, 'message' => 'El nombre de la categoría es obligatorio.'];
        }
        if (strlen($nombre) > 100) {
            return ['ok' => false, 'message' => 'El nombre no puede superar los 100 caracteres.'];
        }
        $descripcion = trim($input['descripcion'] ?? '');

        if (!$this->repo->createCategoria($nombre, $descripcion)) {
            return ['ok' => false, 'message' => 'Ya existe una categoría con ese nombre.'];
        }
        return ['ok' => true];
    }

    public function deleteCategoria(int $id): array
    {
        return $this->repo->deleteCategoria($id);
    }

    public function listCategoriasActivas(): array
    {
        return $this->repo->listCategoriasActivas();
    }
}
