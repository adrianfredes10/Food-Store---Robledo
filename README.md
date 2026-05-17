# FoodStore

Monorepo **backend/** (FastAPI, SQLModel, Alembic) + **frontend/** (React, Vite, TypeScript).

| Documento | Uso |
|-----------|-----|
| [openspec/project.md](openspec/project.md) | Contexto canónico (API, dominio, env, tests) |
| [AGENTS.md](AGENTS.md) | Convenciones y flujo OpenSpec para agentes |
| [DOCKER.md](DOCKER.md) | Levantar Postgres + API + Vite con Docker |
| [docs/Integrador.txt](docs/Integrador.txt) | Especificación técnica SDD (resumen) |
| [docs/Historias_de_usuario.txt](docs/Historias_de_usuario.txt) | Historias y criterios |
| [docs/Descripcion.txt](docs/Descripcion.txt) | Descripción corta del sistema |

## Inicio con Docker (recomendado)

En la raíz del repositorio:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- API: http://127.0.0.1:8008 — Swagger: http://127.0.0.1:8008/docs  
- Postgres (host): `localhost:5433` (usuario/clave/db: `foodstore`)

Más detalle en [DOCKER.md](DOCKER.md).

## Sin Docker

Instalación manual: sección **§3** de [openspec/project.md](openspec/project.md) (`uvicorn` en `backend/`, `npm run dev` en `frontend/`).

Usuario seed (si aplica): `admin@foodstore.com` / `Admin1234!`
