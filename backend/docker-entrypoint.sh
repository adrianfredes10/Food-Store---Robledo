#!/bin/sh
set -e
python /app/docker-wait-db.py
alembic upgrade head
# Desarrollo con volumen montado: UVICORN_RELOAD=1 (docker-compose)
if [ "${UVICORN_RELOAD:-}" = "1" ]; then
  # --reload-dir: código montado desde el host (Docker); WATCHFILES_FORCE_POLLING en compose para Windows
  exec uvicorn app.main:app --host 0.0.0.0 --port 8008 --reload --reload-dir /app/app --reload-delay 0.5
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8008
fi
