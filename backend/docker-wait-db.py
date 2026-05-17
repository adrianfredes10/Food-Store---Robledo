"""Espera a que Postgres acepte conexiones (uso en contenedor)."""
import os
import sys
import time

import psycopg2

url = os.environ["DATABASE_URL"].replace("postgresql+psycopg2://", "postgresql://")
for i in range(60):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("Postgres listo.")
        sys.exit(0)
    except Exception:
        time.sleep(1)
        if i % 10 == 0:
            print(f"Esperando Postgres... ({i + 1}s)")
print("Timeout esperando Postgres.", file=sys.stderr)
sys.exit(1)
