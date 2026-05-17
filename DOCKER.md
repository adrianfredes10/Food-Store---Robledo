# FoodStore con Docker

## Requisitos

- Docker Desktop (o Docker Engine + Compose v2)

## Levantar todo

En la raíz del monorepo:

```bash
docker compose up --build
```

## Desarrollo día a día (cambios en vivo)

No hace falta **`docker compose up --build`** cada vez que tocás código.

1. **Primera vez** (o si cambiaste `Dockerfile`, `package-lock.json` o dependencias pip):  
   `docker compose up --build`
2. **Uso normal**:  
   `docker compose up`  
3. Editás archivos en `frontend/src` o `backend/app` en tu PC → **Vite recarga el front** y **uvicorn reinicia la API** solos (volúmenes montados + *watch* con *polling* para Docker en Windows).

**Importante:** el script de arranque de la API vive **en la imagen** (`/entrypoint.sh`). Si solo cambiás `backend/docker-entrypoint.sh`, hace falta **una** reconstrucción del servicio `api`:  
`docker compose build api && docker compose up -d api`

### Si no ves cambios en el navegador

- Recarga fuerte: `Ctrl+Shift+R`.
- Confirmá que los contenedores usan **este** `docker-compose.yml` (volúmenes `./frontend` y `./backend`).

- **Frontend (Vite):** http://localhost:5173  
- **API (FastAPI):** http://127.0.0.1:8008 — documentación: http://127.0.0.1:8008/docs  
- **Health:** http://127.0.0.1:8008/health  
- **Postgres** (desde el host, herramientas externas): `localhost:5433` (usuario/clave/db: `foodstore` / `foodstore` / `foodstore`)

El contenedor `api` ejecuta `alembic upgrade head` al iniciar y luego `uvicorn` (con recarga si `UVICORN_RELOAD=1`, como en el `docker-compose` actual).

Si agregás o cambiás paquetes npm, dentro del contenedor web podés refrescar dependencias con:

```bash
docker compose exec web npm ci
```

(o borrá el volumen `foodstore_web_nm` y volvé a levantar para forzar `npm ci` al arranque).

## Parar

`Ctrl+C` o:

```bash
docker compose down
```

Para borrar también el volumen de datos de Postgres:

```bash
docker compose down -v
```

## Notas

- `VITE_API_BASE_URL` apunta al host `127.0.0.1:8008` para que el navegador llame a la API publicada en el puerto del host (CORS ya incluye orígenes típicos de Vite).
- Cambiá `JWT_SECRET_KEY` y credenciales en `docker-compose.yml` antes de cualquier despliegue real.
