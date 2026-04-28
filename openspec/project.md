# Contexto del proyecto — FoodStore (referencia completa)

Documento **canónico** de contexto para humanos, agentes (Cursor, Antigravity, etc.) y flujos OpenSpec. Resume **arquitectura, dominio, API, frontend, entorno, tests y convenciones** del estado actual del repo. Para una tarea puntual seguí leyendo el código en las rutas indicadas.

---

## 1. Qué es y qué incluye hoy

**FoodStore** es un e-commerce gourmet **full stack**:

| Capa | Tecnología |
|------|------------|
| API | **FastAPI** + **SQLModel** (SQLAlchemy), **Alembic**, **Pydantic Settings** |
| Auth | **JWT** (access + refresh en BD), **bcrypt** / passlib, **slowapi** (rate limit en login) |
| Cliente web | **React 18** + **Vite 5** + **TypeScript** + **Tailwind CSS** |
| Datos servidor | **TanStack Query (React Query)** |
| Estado local | **Zustand** (auth, carrito, pagos/UI) |
| Pagos | **Mercado Pago**: Checkout Pro (preferencias), brick de tarjeta (SDK React), **webhooks** e **idempotencia** en backend |

**Roles de negocio** (tabla `roles` / `usuario_rol`): **ADMIN**, **STOCK**, **PEDIDOS**, **CLIENT**. El registro público asigna **CLIENT**.

---

## 2. Estructura del monorepo

| Ruta | Contenido |
|------|-----------|
| `backend/` | Código Python `app/`, Alembic, `pyproject.toml`, tests `tests/`, `.env` local (no commitear) |
| `frontend/` | SPA: `src/` (páginas, features, shared), `vite.config.ts`, `package.json`, `.env` local |
| `openspec/project.md` | **Este archivo** |
| `README.md` | Setup: Postgres vs SQLite, uvicorn, npm, Alembic |
| `AGENTS.md` | Regla: leer este `project.md` al iniciar tareas del repo |
| `PROJECT_CONTEXT.md` | Puntero corto a `openspec/project.md` |
| `.cursor/commands/` | Comandos tipo opsx (propose, apply, …) |
| `.cursor/skills/openspec-*` | Skills OpenSpec (CLI `openspec` si aplica) |

Cambios OpenSpec (si usás el CLI): suelen vivir en `openspec/changes/<nombre>/`.

---

## 3. Cómo levantar el proyecto (desarrollo)

### 3.1 Puertos y URLs

| Servicio | Puerto típico | URL |
|----------|---------------|-----|
| Frontend (Vite) | **5173** | `http://localhost:5173/` |
| Backend (documentación README) | **8008** | `http://127.0.0.1:8008` |
| Health (sin prefijo `/api/v1`) | — | `GET http://127.0.0.1:8008/health` |

El **prefijo global de la API** es **`/api/v1`** (ver `app/main.py`).

### 3.2 Backend

Desde `backend/`:

```bash
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8008
```

- Config: `app/core/config.py` lee **`backend/.env`** (ruta fija respecto al paquete).
- **SQLite**: al arrancar, `lifespan` → `bootstrap_database()` crea tablas (`create_all` si aplica) y ejecuta **seed** (`app/db/seed.py`).
- **PostgreSQL**: el esquema puede venir de **Alembic** (`alembic upgrade head`); el bootstrap igual corre semillas según lógica en `bootstrap.py`.

Si en `.env` tenés **Postgres** y el servidor no está levantado, la API falla al conectar. En sesiones locales se puede forzar solo para esa terminal:

```powershell
$env:DATABASE_URL = "sqlite:///./foodstore.dev.db"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8008
```

### 3.3 Frontend

Desde `frontend/`:

```bash
npm install
npm run dev
```

- **`vite.config.ts`**: proxy `/api` → `http://127.0.0.1:8008` con rewrite **`/api` → `/api/v1`** (el cliente axios usa base `/api` por defecto).
- Tras editar **`frontend/.env`**, reiniciar Vite (las variables `VITE_*` se inyectan en build/dev al arrancar).

### 3.4 Usuario administrador (seed)

Tras seed inicial (si no existía):

- **Email:** `admin@foodstore.com`
- **Contraseña:** `Admin1234!`

---

## 4. Variables de entorno

### 4.1 Backend — `backend/.env` (gitignored; plantilla `backend/.env.example`)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena SQLAlchemy: Postgres `postgresql+psycopg2://...` o SQLite `sqlite:///./archivo.db` |
| `JWT_SECRET_KEY` | Secreto firma JWT (obligatorio en app) |
| `JWT_ALGORITHM` | Por defecto `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Sesión |
| `CORS_ORIGINS` | Lista separada por comas (orígenes del navegador, p. ej. `http://127.0.0.1:5173`) |
| `DEBUG` | Si `true`, `/health` puede exponer flags extra |
| `MERCADOPAGO_ACCESS_TOKEN` | Token OAuth de la aplicación MP (mismo ambiente que la Public Key del front). Alias: **`MP_ACCESS_TOKEN`** |
| `MERCADOPAGO_MOCK` | `true`: no llama APIs reales de MP (desarrollo). `false`: requiere token válido |
| `PUBLIC_APP_URL` | URL pública de esta API (notificaciones MP, `back_urls`). Debe coincidir con cómo el navegador/backend resuelve el host en prod |
| `GROQ_API_KEY`, `GROQ_MODEL`, `PRODUCTO_IMAGEN_AUTO` | Imagen opcional de producto vía Groq (`app/integrations/producto_imagen_groq.py`) |
| `PYTEST_DISABLE_RATE_LIMIT` | En tests: `1` / `true` / `yes` desactiva el límite agresivo de `POST /auth/login` (ver `auth/router.py`) |

### 4.2 Frontend — `frontend/.env` (gitignored; plantilla `frontend/.env.example`)

| Variable | Descripción |
|----------|-------------|
| `VITE_MP_PUBLIC_KEY` | Clave **pública** MP para `@mercadopago/sdk-react` (brick de tarjeta: `CardPaymentBrick.tsx`) |
| `VITE_API_BASE_URL` o `VITE_API_URL` | Opcional. Vacío → axios usa `/api` y Vite proxifica. Si es absoluta, `client.ts` normaliza a `.../api/v1` |

**Coherencia:** Access Token (backend) + Public Key (front) deben ser del **mismo ambiente** (prueba vs producción).

---

## 5. Backend — arquitectura

### 5.1 Punto de entrada y ciclo de vida

- **`app/main.py`**: `create_app()` registra middleware CORS, **slowapi**, routers bajo **`/api/v1`**, y **`GET /health`** fuera del prefijo v1.
- **`lifespan`**: `bootstrap_database()` (creación de esquema en SQLite / semillas), luego `SELECT 1`, al apagar `engine.dispose()`.

### 5.2 Configuración

- **`app/core/config.py`**: `Settings` (Pydantic Settings) con `get_settings()` cacheado; lee `.env` en `backend/.env`.

### 5.3 Persistencia y transacciones

- **`app/core/db/session.py`**: `get_engine()`, `new_session()`.
- **`app/deps/uow.py`**: **`get_uow()`** abre sesión, construye **`UnitOfWork`**, hace **`commit`** si el handler termina bien, **`rollback`** si hay excepción.
- **`app/core/uow/unit_of_work.py`**: agrega repositorios por dominio (`pedidos`, `productos`, `pagos`, etc.). Los **servicios no hacen commit** explícito.

### 5.4 Autenticación y autorización

- **`app/deps/auth.py`**: `get_current_user` (Bearer JWT), `get_current_user_optional` (logout con solo refresh).
- **`app/deps/roles.py`**: `require_admin`, `require_stock_o_admin`, `require_pedidos_o_admin`.
- JWT access: claims típicos **`sub`** (id usuario), **`type`: `access`**. Los **roles** no van en el token; se listan en **`GET /api/v1/auth/me`**.
- **`app/modules/auth/service.py`**: refresh rota refresh token; comparación **`expires_at`** tolera datetimes **naive** leídos de SQLite (`_dt_utc`).

### 5.5 Módulos de dominio (`app/modules/*`)

Cada módulo suele tener: `router.py`, `service.py`, `schemas.py`, `repository.py` / repos, `model.py` o modelos en `productos/model.py`, `exceptions.py` según corresponda.

---

## 6. API REST — inventario (base `http://<host>/api/v1`)

> Métodos y paths tal como están en los routers; detalle de cuerpos en `schemas.py` de cada módulo.

### 6.1 Auth — prefijo `/auth`

| Método | Path | Notas |
|--------|------|--------|
| POST | `/auth/register` | Registro; asigna rol CLIENT si existe el rol en BD |
| POST | `/auth/login` | Rate limit (desactivable con `PYTEST_DISABLE_RATE_LIMIT`) |
| POST | `/auth/refresh` | Nuevo par access + refresh; invalida el refresh usado |
| POST | `/auth/logout` | Revoca refresh (body y/o usuario desde access) |
| GET | `/auth/me` | Perfil + lista de roles |

### 6.2 Productos — `/productos`

| Método | Path | Auth |
|--------|------|------|
| GET | `/productos` | Público; query: `page`, `size`, `categoria_id`, `incluir_subcategorias`, `disponible`, `search` |
| GET | `/productos/{id}` | Público |
| POST | `/productos` | **ADMIN** |
| PATCH | `/productos/{id}` | **ADMIN** |
| DELETE | `/productos/{id}` | **ADMIN** (soft delete) |
| GET | `/productos/{id}/ingredientes` | Público |
| PATCH | `/productos/{id}/stock` | **STOCK o ADMIN** |

Opcional: **imagen automática** post-creación si `PRODUCTO_IMAGEN_AUTO` y Groq configurado (`router` + `BackgroundTasks`).

### 6.3 Categorías — `/categorias`

| Método | Path | Auth |
|--------|------|------|
| GET | `/categorias` | Público; filtros de jerarquía/paginación |
| GET | `/categorias/{id}` | Público |
| POST, PATCH, DELETE | … | **ADMIN** |

Errores de negocio: duplicado de nombre, categoría con productos/hijos → a menudo **409**; ciclo jerárquico → **400** (ver excepciones en `categorias/router.py`).

### 6.4 Ingredientes — `/ingredientes`

| Método | Path | Auth |
|--------|------|------|
| GET | `/ingredientes` | Público; `es_alergeno`, `search` |
| GET | `/ingredientes/{id}` | Público |
| POST, PATCH, DELETE | … | **STOCK o ADMIN** |

### 6.5 Direcciones — `/direcciones`

| Método | Path | Notas |
|--------|------|--------|
| GET | `/direcciones` | Usuario autenticado; solo sus filas |
| POST | `/direcciones` | Crea; **primera dirección del usuario → `es_principal=true`** aunque el body mande `false`** (`DireccionEntregaService`) |
| PATCH | `/direcciones/{id}/principal` | Marca principal y limpia las demás |
| GET/PATCH/DELETE | `/direcciones/{id}` | Solo del dueño |

Persistencia: **`linea1`** compuesta en servidor desde calle, número, ciudad, CP (ver `direcciones_entrega/service.py` y `schemas.DireccionEntregaRead` para lectura).

### 6.6 Pedidos — `/pedidos`

| Método | Path | Notas |
|--------|------|--------|
| GET | `/pedidos` | Listado del **usuario** autenticado (paginado, filtro `estado`) |
| POST | `/pedidos` | Crea pedido **PENDIENTE**; valida stock, dirección, forma de pago |
| GET | `/pedidos/{id}` | Detalle con **snapshot** de precios en líneas |
| GET | `/pedidos/{id}/historial` | Historial; **ADMIN o PEDIDOS** ven cualquier pedido |
| DELETE | `/pedidos/{id}` | Cancelación cliente (**solo PENDIENTE**); body `motivo` |
| POST | `/pedidos/{id}/cancelar` | Alias compatible de cancelación |

**Reglas de negocio clave** (`PedidoService`):

- **Costo de envío fijo v1:** `COSTO_ENVIO_FIJO_V1 = 50.00` (misma moneda que el pedido).
- **Total** = suma subtotems + envío.
- **Stock:** no se descuenta al crear; se descuenta al pasar a **CONFIRMADO** (pago aprobado o transición admin).
- **FSM** (`EstadoPedido`): PENDIENTE → CONFIRMADO | CANCELADO; CONFIRMADO → EN_PREP | CANCELADO; … hasta ENTREGADO; estados terminales sin salida.
- **Cancelación cliente:** solo **PENDIENTE**.

### 6.7 Pagos — `/pagos`

| Método | Path | Notas |
|--------|------|--------|
| POST | `/pagos/checkout/pedidos/{pedido_id}` | Crea/regresa checkout Mercado Pago; header opcional `Idempotency-Key` |
| POST | `/pagos/tarjeta` y `/pagos/crear` | Pago con token SDK (usuario autenticado) |
| POST | `/pagos/webhook` y `/pagos/webhooks/mercadopago` | IPN Mercado Pago; procesa estado y puede **confirmar pedido** |
| GET | `/pagos/{pedido_id}` | Pago reciente asociado al pedido (según implementación y rol) |

**Mock MP** (`mercadopago_gateway.py`, `MERCADOPAGO_MOCK=true`): respuestas sintéticas sin red.

**Servicio** (`PagoService`): idempotencia de webhooks y de checkout; confirmación de pedido al **approved** coherente con montos.

### 6.8 Admin — `/admin`

| Método | Path | Auth |
|--------|------|------|
| GET | `/admin/dashboard` | **ADMIN** |
| GET | `/admin/pedidos` | **ADMIN** |
| GET | `/admin/pedidos/{id}` | **ADMIN** |
| POST | `/admin/pedidos/{id}/transicion` | **ADMIN**; body `estado` = valor `EstadoPedido` |

---

## 7. Frontend — rutas y capas

### 7.1 Rutas (`src/app/router/index.tsx`)

Layout público con nav + footer:

| Ruta | Página |
|------|--------|
| `/` | Catálogo |
| `/guia` | Guía |
| `/carrito` | Carrito |
| `/checkout` | Checkout |
| `/direcciones` | Direcciones |
| `/mis-pedidos` | Mis pedidos |
| `/pedido/:id` | Detalle pedido |
| `/login` | Login / registro |

**Admin** (rol ADMIN), anidado bajo `/admin`:

| Ruta | Uso |
|------|-----|
| `/admin` | Dashboard |
| `/admin/productos` | ABM productos |
| `/admin/categorias` | Categorías |
| `/admin/ingredientes` | Ingredientes |
| `/admin/pedidos` | Listado pedidos |
| `/admin/pedidos/:id` | Detalle / transiciones |

### 7.2 API cliente

- **`src/shared/api/client.ts`**: axios, interceptor Bearer, resolución de `baseURL`.
- **`src/shared/api/endpoints/*.ts`**: llamadas por dominio.

### 7.3 Estado

- **Zustand:** `auth-store`, `cart-store`, `payment-store`, etc.
- **TanStack Query:** hooks en `features/*/hooks`.

### 7.4 Pagos en UI

- **`src/features/pagos/ui/CardPaymentBrick.tsx`**: requiere **`VITE_MP_PUBLIC_KEY`**.

---

## 8. Tests backend (`backend/tests/`)

- **pytest** + **pytest-cov**; `pyproject.toml` → `addopts`: `--cov=app --cov-report=term-missing --cov-fail-under=60`.
- **`conftest.py`**: SQLite en memoria, override de `get_uow`, `TestClient`, fixtures (`admin_token`, `client_token`, `headers_*`, `producto_seed`, `direccion_seed`, `db_session`). Usuarios de prueba: emails **`@example.com`** (evitar `@pytest.local`, lo rechaza `email-validator`).
- Variables útiles en tests: `PYTEST_DISABLE_RATE_LIMIT`, `MERCADOPAGO_MOCK`, `PRODUCTO_IMAGEN_AUTO`, etc.

Archivos de test (nombre orientativo):

| Archivo | Enfoque |
|---------|---------|
| `test_health.py` | Health |
| `test_domain_enums.py` | Enums de dominio |
| `test_auth.py` | Registro/login básico (legado) |
| `test_auth_completo.py` | Registro, login, refresh, logout, JWT/me |
| `test_productos.py` | CRUD/listado/stock/delete productos |
| `test_categorias.py` | Jerarquía, duplicados, delete |
| `test_ingredientes.py` | CRUD, filtros, uso en producto |
| `test_direcciones.py` | Principal, aislamiento entre usuarios |
| `test_pedidos_fsm.py` | FSM en servicio + **integración HTTP** pedidos/historial/cancelación/transiciones |
| `test_pedidos_cliente_api.py` | Flujos API cliente de pedidos |
| `test_pagos.py` | Idempotencia checkout + webhooks |

Integración: preferir **HTTP** contra la app; no mockear UoW/servicios salvo decisión explícita.

---

## 9. Dominio — reglas que suelen romperse si se ignoran

1. **Envío:** fijo **50.00** en la versión actual del servicio de pedidos.
2. **Snapshot:** `precio_unitario_snapshot` en detalle de pedido no cambia si el producto sube de precio después.
3. **Stock:** baja al **confirmar** (pago o admin), no al crear el pedido.
4. **Webhooks:** diseñados para ser **idempotentes** (mismo pago notificado dos veces).
5. **Categorías:** restricciones de nombre único por padre; no borrar con productos activos (conflict).
6. **Emails de test:** usar dominios válidos para Pydantic (`example.com`).

---

## 10. OpenSpec / agentes — checklist rápido

1. Leer **`openspec/project.md`** (este archivo) y **`AGENTS.md`**.
2. Para instalación: **`README.md`**.
3. No commitear **`.env`** ni claves.
4. Tras cambiar **`frontend/.env`**, reiniciar **`npm run dev`**.
5. Mantener este documento al día cuando cambien contratos globales, env vars o flujos críticos.

---

*Última ampliación orientada a handoff completo (API, front, env, dominio, tests, operación local).*
