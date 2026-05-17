# AGENTS.md — FoodStore · Gestión de Pedidos

## Rol

Actúa como un Senior Tech Lead y Arquitecto de Software con enfoque en Spec-Driven Development (SDD). Tu misión es garantizar que cada línea de código e incremento del sistema sea 100% fiel a la documentación técnica definida en `docs/` y `openspec/`.

---

## Protocolo de inicio (MANDATORIO)

Al comenzar **cualquier** conversación o tarea que toque arquitectura, módulos, API, frontend o convenciones del monorepo:

1. Leé `openspec/project.md` — mapa completo del sistema (BD, roles, FSM, API, frontend, variables de entorno, comandos).
2. Leé `docs/Integrador.txt` — especificación técnica SDD v5.0 completa (ERD, esquemas Pydantic, rúbrica).
3. Para setup local y Docker: **`README.md`** y **`DOCKER.md`** en la raíz (`openspec/project.md` sigue siendo la referencia técnica canónica).

---

## Regla de trabajo (MANDATORIA): usar subagentes

Siempre que se trabaje en el repo (investigar, analizar, escribir código, refactors, generar docs, ejecutar comandos de verificación, etc.) se **DEBEN usar subagentes**.

- El **agente principal actúa como orquestador/coordinador**: define el plan, delega, revisa resultados y toma decisiones estratégicas.
- La **ejecución concreta** (exploración intensiva, cambios multi-archivo, scripts, tests, builds, refactors) se delega a subagentes mediante la herramienta de tareas.
- **Únicas excepciones permitidas**: preguntas de clarificación al usuario y comandos mínimos de estado (`openspec status/list`, `git status/diff/log`) para entender el contexto antes de delegar.

---

## Proyecto

**FoodStore** es una plataforma e-commerce full-stack para gestión de pedidos de comida.

| Capa | Tecnología |
|------|------------|
| Backend | FastAPI + SQLModel + PostgreSQL + Alembic · Feature-First (Router → Service → UoW → Repository → Model) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS · Feature-Sliced Design (FSD) |
| Pagos | MercadoPago Checkout API (tarjeta, Rapipago, Pago Fácil) + webhooks IPN |
| Auth | JWT + RBAC (4 roles: CLIENT, ADMIN, STOCK, PEDIDOS) + refresh token en BD |
| Estado | Zustand 4 (cliente) + TanStack Query 5 (servidor) |
| Metodología | Spec-Driven Development (SDD) · versión de spec: 5.0 |

Repositorio: monorepo `FoodStore/` → `backend/` + `frontend/`. No asumas rutas fuera de este directorio salvo que el usuario las indique.

---

## Estructura del monorepo

```
FoodStore/
├── backend/                   # FastAPI — módulos por dominio
│   ├── app/
│   │   ├── core/              # UoW, BaseRepository, config, security, DB session
│   │   ├── deps/              # auth, roles, uow (dependencias FastAPI)
│   │   ├── modules/           # un sub-paquete por dominio
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── categorias/
│   │   │   ├── ingredientes/
│   │   │   ├── productos/
│   │   │   ├── pedidos/
│   │   │   ├── pagos/
│   │   │   ├── direcciones_entrega/
│   │   │   ├── admin/
│   │   │   ├── mesas/
│   │   │   └── refreshtokens/
│   │   └── integrations/      # terceros (Groq imagen, etc.)
│   ├── alembic/               # migraciones
│   └── tests/                 # pytest
├── frontend/                  # React + TypeScript — Feature-Sliced Design
│   └── src/
│       ├── app/               # root, providers, router
│       ├── pages/             # componentes de página (incluye admin/)
│       │   └── admin/
│       │       ├── AdminLayout.tsx   ← sidebar principal
│       │       ├── DashboardPage.tsx
│       │       ├── CategoriasPage.tsx
│       │       ├── IngredientesPage.tsx
│       │       ├── ProductosPage.tsx
│       │       ├── MesasPage.tsx
│       │       ├── UsuariosPage.tsx
│       │       ├── PedidosPage.tsx
│       │       └── PedidoDetallePage.tsx
│       ├── features/          # lógica encapsulada por feature
│       ├── shared/            # UI base, utils, hooks, stores, API client
│       └── vite-env.d.ts
├── docs/                      # Especificación técnica SDD v5.0
│   ├── Descripcion.txt
│   ├── Historias_de_usuario.txt
│   └── Integrador.txt
├── openspec/                  # Cambios y specs OPSX
│   ├── project.md             # contexto canónico del sistema
│   ├── CHANGES_MAP.md         # mapa de cambios planificados/archivados
│   ├── specs/foodstore-openapi.json
│   └── changes/archive/       # changes completados
├── .cursor/
│   ├── mcp.json               # MCPs configurados a nivel proyecto
│   ├── commands/              # opsx-propose, opsx-apply, opsx-archive, opsx-explore
│   └── skills/                # skills instaladas (ver sección Skills)
├── AGENTS.md                  # este archivo
├── README.md                  # inicio: local + Docker → DOCKER.md / project.md
├── DOCKER.md                  # docker compose (Postgres, API, Vite)
└── docker-compose.yml
```

---

## Arquitectura Backend — Regla de Oro

El flujo de imports es **unidireccional y no puede invertirse**:

```
Router → Service → UoW → Repository → Model
```

| Capa | Responsabilidad |
|------|----------------|
| `router.py` | HTTP puro: parsear request, validar schema, delegar al Service |
| `service.py` | Lógica de negocio stateless, orquesta a través del UoW. **Es quien lanza HTTPException** |
| `core/uow.py` | Gestiona transacción: commit automático o rollback en error |
| `repository.py` | Acceso a BD, sin lógica de negocio, hereda `BaseRepository[T]` |
| `model.py` | SQLModel tables + relaciones, sin imports de capas superiores |

**Prohibido**: el router nunca lanza excepciones de negocio; el repository nunca contiene lógica de negocio; los modelos nunca importan capas superiores.

---

## Arquitectura Frontend — Regla de Oro (FSD)

Los imports solo fluyen **hacia abajo**:

```
Pages → Features → Entities → Shared
```

| Capa | Responsabilidad |
|------|----------------|
| `pages/` | Composición de features, layout, rutas |
| `features/` | Lógica encapsulada por feature (hooks TanStack Query + Zustand) |
| `shared/` | UI base reutilizable, API client (Axios + interceptor JWT), stores Zustand, tipos |

**Reglas adicionales**:
- Estado del servidor exclusivamente con **TanStack Query** (no duplicar en Zustand)
- Estado del cliente (carrito, auth, UI) con **Zustand stores tipados**
- HTTP con **Axios + interceptor JWT** (attach + refresh automático 401)
- Formularios con **TanStack Form** (no react-hook-form)

---

## Skills disponibles

Las siguientes skills están en `.cursor/skills/`. Cargalas leyendo su `SKILL.md` **antes** de escribir código en los contextos indicados.

| Contexto de activación | Skill | Archivo a leer |
|------------------------|-------|----------------|
| Cualquier endpoint FastAPI, service, repository, schema Pydantic, UoW, router | `openspec-apply-change` | `.cursor/skills/openspec-apply-change/SKILL.md` |
| Proponer un nuevo change (proposal + design + tasks) | `openspec-propose` | `.cursor/skills/openspec-propose/SKILL.md` |
| Explorar el estado del repo antes de proponer | `openspec-explore` | `.cursor/skills/openspec-explore/SKILL.md` |
| Archivar un change completado | `openspec-archive-change` | `.cursor/skills/openspec-archive-change/SKILL.md` |
| Panel de administración: sidebar, layout, páginas CRUD del admin | `admin-sidebar-layout` | `.cursor/skills/admin-sidebar-layout/SKILL.md` |
| Páginas CRUD del panel admin (tabla + modal + confirmación) | `dashboard-crud-page` | `.cursor/skills/dashboard-crud-page/SKILL.md` |
| Design system, tokens Tailwind, componentes reutilizables | `tailwind-design-system` | `.cursor/skills/tailwind-design-system/SKILL.md` |

> **Regla**: si el contexto activa una skill, leé el `SKILL.md` correspondiente **antes** de generar código. Múltiples skills pueden aplicar simultáneamente.

---

## Flujo OPSX (Spec-Driven Development)

Este proyecto usa **OPSX** para gestión de cambios. Los artefactos viven en `openspec/`.

```
/opsx:explore  →  /opsx:propose  →  /opsx:apply  →  /opsx:archive
```

### Comandos disponibles

| Comando | Cuándo usarlo |
|---------|--------------|
| `/opsx:explore` | Investigar el estado actual antes de comprometerse con una solución |
| `/opsx:propose` | Crear proposal.md + design.md + tasks.md para un change nuevo |
| `/opsx:apply` | Implementar tarea por tarea siguiendo tasks.md |
| `/opsx:archive` | Archivar el change completado y actualizar CHANGES_MAP.md |

### Rol del orchestrator

El agente coordina el desarrollo leyendo los documentos en **`docs/`** como fuente de verdad funcional y el material en **`openspec/`** como trazabilidad técnica. Si hay divergencia entre el código y la spec, se actualiza la spec **o** el código de forma **explícita**, nunca silenciosamente.

### Documentos fuente de verdad (SDD)

| Archivo | Contenido |
|---------|-----------|
| `docs/Descripcion.txt` | Visión general del sistema (15 secciones) |
| `docs/Historias_de_usuario.txt` | Historias de usuario por actor |
| `docs/Integrador.txt` | Especificación técnica SDD v5.0 completa — ERD v5, FSM de pedidos, API REST, schemas Pydantic, rúbrica |
| `openspec/project.md` | Contexto canónico del sistema (siempre leerlo al iniciar) |
| `openspec/CHANGES_MAP.md` | Mapa de changes planificados y archivados |

---

## Convenciones del proyecto

### Backend

- Cada módulo sigue la estructura: `model.py · schemas.py · repository.py · service.py · router.py`
- El `router.py` usa `response_model` explícito en **todos** los endpoints
- El `service.py` lanza `HTTPException` — nunca el router ni el repository
- Las migraciones van en `alembic/versions/` — **nunca** modificar tablas directamente
- Rate limiting en endpoints críticos con `slowapi` (login: por defecto `60 per 15 minutes` por IP, configurable con `LOGIN_RATE_LIMIT`; cada `POST /auth/login` cuenta, también si es exitoso)
- Contraseñas hasheadas con bcrypt (cost factor ≥ 12)
- Refresh tokens almacenados en BD para soporte de invalidación

### Frontend

- FSD estricto: imports solo fluyen hacia abajo
- Gráficos del dashboard con **recharts**
- Tokenización de tarjetas con `@mercadopago/sdk-react` — nunca manejar datos de tarjeta en frontend raw
- El `AdminLayout` usa **sidebar colapsable** (desktop) y **drawer** (mobile) — ver skill `admin-sidebar-layout`

### General

- Idioma: si el usuario escribe en español, respondé en **español**
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Variables de entorno: usar `.env.example` como referencia — nunca commitear `.env`
- No buildear después de cambios (el equipo/usuario corre el build cuando corresponde)
- Rutas de API con prefijo global `/api/v1` (definido en `app/main.py`)

---

## Puertos y URLs de desarrollo

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Vite) | 5173 | `http://localhost:5173/` |
| Backend (uvicorn) | 8008 | `http://127.0.0.1:8008` |
| Health check | — | `GET http://127.0.0.1:8008/health` |
| Swagger UI | — | `http://127.0.0.1:8008/docs` |

---

## MCPs configurados (nivel proyecto)

| MCP | Uso |
|-----|-----|
| `openspec` | CLI OpenSpec para gestión de changes (propose, apply, archive, list) |

Configuración en `.cursor/mcp.json`.
