<?php

require_once __DIR__ . '/../services/AdminService.php';
require_once __DIR__ . '/../helpers/Response.php';

class AdminController
{
    private AdminService $service;

    public function __construct($conn)
    {
        $this->service = new AdminService($conn);
    }

    private function requireAdmin(): void
    {
        $user = $GLOBALS['auth_user'];
        if ((int)$user['id_rol'] !== 1) {
            Response::error('Acceso denegado');
        }
    }

    public function getStats(): void
    {
        $this->requireAdmin();
        Response::success('Estadísticas obtenidas', $this->service->getStats());
    }

    public function listProfesionales(): void
    {
        $this->requireAdmin();
        $estado = $_GET['estado'] ?? null;
        Response::success('Profesionales obtenidos', $this->service->listProfesionales($estado));
    }

    public function changeUserStatus(): void
    {
        $this->requireAdmin();
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->service->changeUserStatus($input);

        if (!$result['ok']) {
            Response::error(implode(', ', $result['errors']));
        }

        Response::success('Estado actualizado');
    }

    public function listReservas(): void
    {
        $this->requireAdmin();
        $estado = $_GET['estado'] ?? null;
        Response::success('Reservas obtenidas', $this->service->listReservas($estado));
    }

    public function listCategorias(): void
    {
        $this->requireAdmin();
        Response::success('Categorías obtenidas', $this->service->listCategorias());
    }

    public function createCategoria(): void
    {
        $this->requireAdmin();
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $result = $this->service->createCategoria($input);
        if (!$result['ok']) {
            Response::error($result['message']);
        }
        Response::success('Categoría creada correctamente');
    }

    public function deleteCategoria(): void
    {
        $this->requireAdmin();
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $id     = (int)($input['id'] ?? 0);
        if (!$id) {
            Response::error('ID requerido');
        }
        $result = $this->service->deleteCategoria($id);
        if (!$result['ok']) {
            Response::error($result['message']);
        }
        Response::success('Categoría eliminada');
    }

    public function listCategoriasActivas(): void
    {
        Response::success('Categorías obtenidas', $this->service->listCategoriasActivas());
    }
}
