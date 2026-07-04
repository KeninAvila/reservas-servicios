# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de reservas de servicios profesionales. Arquitectura separada: backend PHP en XAMPP y frontend React con Vite.

## Environment Setup

**Backend:** Served by Apache (XAMPP). Must be copied to `C:\xampp\htdocs\appweb\backend` to work.
**Frontend:** Vite dev server with proxy to Apache.
**Database:** MariaDB 10.4 via XAMPP on port 3306, database name: `reservas_servicios`.

## Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
```

### Backend (no commands — served by Apache)
- Test DB connection: `http://localhost/appweb/backend/test.php`
- API entry point: `http://localhost/appweb/backend/api/router.php?route=<ruta>`

### Database (from terminal)
```bash
"C:\xampp\mysql\bin\mysql.exe" -u root -e "USE reservas_servicios; <query>;"
```

## Architecture

### Backend (PHP — no framework)
```
backend/
  api/router.php          # Single entry point — routes via ?route= query param
  api/auth/               # Public routes (login, register, verify, etc.)
  api/profesional/        # Protected professional routes
  config/db.php           # mysqli connection using $_ENV from .env
  config/session.php      # PHP session setup (httponly, SameSite=Lax)
  config/app.php          # Constants: APP_URL, LOGIN_MAX_ATTEMPTS, etc.
  middleware/AuthMiddleware.php  # Validates PHP session + user_sessions table
  controllers/            # Business logic (ServicioController, ProfesionalController, etc.)
  repositories/           # Raw SQL queries per entity
  helpers/Response.php    # Response::success() / Response::error() — always exits
```

**Request flow:** `router.php` → middleware check → `require_once` the matching file → controller → repository → `Response::success/error`

**Auth mechanism:** PHP sessions + `user_sessions` table. After login, `$_SESSION['usuario_id']` and `$_SESSION['session_id']` are set. Protected routes call `AuthMiddleware::check()` which returns the user array and sets `$GLOBALS['auth_user']`.

**Roles:** `id_rol = 1` = ADMIN, `id_rol = 2` = PROFESIONAL. Stored in `usuarios.id_rol`.

### Frontend (React + Vite + Tailwind v4)
```
frontend/
  src/services/api.js           # Axios instance — baseURL: "/appweb/backend/api"
  src/App.jsx                   # Role router: 'client' | 'professional' | 'admin'
  src/components/LoginModal.jsx # Single login form — role detected from id_rol
  src/components/ProfessionalPanel.jsx
  src/components/AdminPanel.jsx
  src/components/ClientPanel.jsx
  src/data.js                   # Mock data for categories, professionals, bookings
  vite.config.js                # Proxy: /appweb → http://localhost (solves CORS)
```

**State:** `loggedInUser` in App.jsx holds the normalized backend user. `normalizarUsuario()` in LoginModal maps backend fields (`nombre`, `estado`) to frontend fields (`name`, `status`).

**Data sources:** Login/register use the real backend API. Everything else (services, hours, bookings, categories) still uses localStorage mock data — not yet connected to backend.

## Available API Routes

All routes go through `router.php?route=<path>`. Protected routes require an active PHP session cookie.

| Route | Method | Auth | Description |
|---|---|---|---|
| `auth/login` | POST | ❌ | `{email, password}` → session cookie |
| `auth/register` | POST | ❌ | `{nombre, email, password}` |
| `auth/me` | GET | ✅ | Current user data |
| `auth/logout` | POST | ✅ | Destroys session |
| `professional/profile` | GET | ✅ | Get own profile |
| `professional/profile/create` | POST | ✅ | Create/update profile |
| `professional/service/list` | GET | ✅ | List own services |
| `professional/service` | GET | ✅ | Get service by `?id=` |
| `professional/service/upsert` | POST | ✅ | Create or update service |
| `professional/service/status` | PATCH | ✅ | `{id, estado}` → activo/inactivo |
| `professional/service/delete` | DELETE | ✅ | Soft delete `{id}` |

## Key Constraints

- **Backend is not modified without explicit authorization** from the user.
- **CORS is solved via Vite proxy** (`vite.config.js`) — do not add CORS headers to the backend.
- **No JWT** — auth uses PHP session cookies. Axios requests automatically send cookies (same origin via proxy).
- **Session cookie** is set with `domain=localhost`, `httponly=true`, `SameSite=Lax`.
- **`Response::success/error` always calls `exit`** — nothing should be echoed after calling it.
- When deploying backend, update `APP_URL` in `backend/config/app.php` and `baseURL` in `frontend/src/services/api.js`.

## Database

Key tables: `usuarios`, `roles`, `user_sessions`, `profesionales_perfil`, `servicios`, `reservas`.

Admin user: `admin@servi.com` (id_rol=1). Must have `email_verificado=1` to log in.
SMTP not configured — email verification/recovery won't send emails until `.env` SMTP values are set.
