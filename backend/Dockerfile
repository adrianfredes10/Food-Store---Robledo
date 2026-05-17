FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY pyproject.toml README.md alembic.ini ./
COPY app ./app
COPY alembic ./alembic
COPY docker-wait-db.py ./
COPY docker-entrypoint.sh /entrypoint.sh

# Normalizar CRLF (checkout en Windows). El entrypoint vive fuera de /app para no ser
# sobrescrito por el volumen de desarrollo en docker-compose.
RUN sed -i 's/\r$//' /entrypoint.sh \
    && chmod +x /entrypoint.sh \
    && pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -e .

EXPOSE 8008

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
