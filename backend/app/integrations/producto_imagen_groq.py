"""Groq genera un prompt de imagen; Pollinations renderiza una vez y el servidor cachea el archivo.

Groq no expone generación de píxeles: solo LLM. Tras obtener la URL de Pollinations, el backend
descarga los bytes **una sola vez** (BackgroundTasks) y guarda en `data/producto_imagenes/`, servido
vía `/static/productos/...`. Así el catálogo no vuelve a golpear Pollinations en cada visita; si la
descarga falla, se guarda la URL remota como antes (fallback).
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"

# Resolución moderada: menos peso que 768² y suficiente para cards del catálogo.
_POLLINATIONS_W = 512
_POLLINATIONS_H = 512


def _backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def producto_imagenes_dir() -> Path:
    return _backend_root() / "data" / "producto_imagenes"

_SYSTEM_PROMPT = (
    "You output exactly one English line: a concise text-to-image prompt for ONE gourmet dish. "
    "Match this visual style: dark slate or charcoal backdrop, single hero dish, soft studio "
    "key light, subtle steam or sheen, luxury restaurant e-commerce, high detail, photorealistic. "
    "No text, logos, watermarks, or people. Max 45 words."
)


def _sanitize_one_line(content: str) -> str:
    t = content.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\s*", "", t)
        t = re.sub(r"\s*```$", "", t).strip()
    t = " ".join(t.split())
    return t[:480] if len(t) > 480 else t


def _normalizar_contenido_mensaje(raw: Any) -> str | None:
    """Groq suele devolver `content` como string; algunos modelos/flujos usan lista de partes (estilo OpenAI)."""
    if raw is None:
        return None
    if isinstance(raw, str):
        s = raw.strip()
        return s if s else None
    if isinstance(raw, list):
        partes: list[str] = []
        for item in raw:
            if isinstance(item, str) and item.strip():
                partes.append(item.strip())
            elif isinstance(item, dict):
                texto = item.get("text")
                if isinstance(texto, str) and texto.strip():
                    partes.append(texto.strip())
                else:
                    nested = item.get("content")
                    nested_txt = _normalizar_contenido_mensaje(nested)
                    if nested_txt:
                        partes.append(nested_txt)
        unido = " ".join(partes)
        return unido if unido else None
    return None


def groq_generar_prompt_imagen(*, api_key: str, model: str, nombre: str, descripcion: str | None) -> str | None:
    if not api_key.strip():
        return None
    user = f"Dish name: {nombre}\nChef notes: {descripcion or 'N/A'}"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        "temperature": 0.65,
        "max_tokens": 180,
    }
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=45.0) as client:
        r = client.post(GROQ_CHAT_URL, json=payload, headers=headers)
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError:
            logger.warning(
                "Groq chat/completions HTTP %s (model=%s): %s",
                r.status_code,
                model,
                (r.text or "")[:600],
            )
            return None
        data = r.json()
    choices = data.get("choices") or []
    if not choices:
        logger.warning(
            "Groq chat/completions: respuesta sin choices (model=%s). Claves: %s",
            model,
            list(data.keys()),
        )
        return None
    msg = choices[0].get("message") or {}
    raw_content = msg.get("content")
    texto = _normalizar_contenido_mensaje(raw_content)
    if not texto:
        finish = choices[0].get("finish_reason")
        logger.warning(
            "Groq chat/completions: message.content vacío o no textual (model=%s, finish_reason=%s, tipo=%s)",
            model,
            finish,
            type(raw_content).__name__,
        )
        return None
    line = _sanitize_one_line(texto)
    return line or None


def pollinations_url_desde_prompt(prompt: str) -> str:
    """URL de Pollinations para **una** descarga en servidor (luego se sirve local)."""
    p = " ".join(prompt.split())
    if len(p) > 900:
        p = p[:900]
    # Parámetros fijos mejoran caché y compatibilidad; nologo evita marca en la imagen.
    q = f"width={_POLLINATIONS_W}&height={_POLLINATIONS_H}&nologo=true"
    return f"{POLLINATIONS_BASE}/{quote(p, safe='')}?{q}"


def materializar_imagen_producto(*, url_remota: str, producto_id: int, public_base_url: str) -> str:
    """Descarga la imagen una vez y devuelve URL bajo esta API; si falla, `url_remota`."""
    base = public_base_url.strip().rstrip("/")
    if not base:
        return url_remota
    dest_dir = producto_imagenes_dir()
    try:
        dest_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        logger.warning("imagen materialize: no se pudo crear %s", dest_dir)
        return url_remota

    timeout = httpx.Timeout(120.0, connect=20.0)
    last_error: str | None = None
    for attempt in range(2):
        try:
            with httpx.Client(timeout=timeout) as client:
                r = client.get(url_remota, follow_redirects=True)
                r.raise_for_status()
                data = r.content
            if len(data) < 256:
                last_error = f"cuerpo demasiado corto ({len(data)} bytes)"
                continue
            ct = (r.headers.get("content-type") or "").split(";")[0].strip().lower()
            if "png" in ct:
                ext = ".png"
            elif "webp" in ct:
                ext = ".webp"
            elif "jpeg" in ct or "jpg" in ct:
                ext = ".jpg"
            else:
                ext = ".jpg"
            fname = f"{producto_id}{ext}"
            path = dest_dir / fname
            for old in dest_dir.glob(f"{producto_id}.*"):
                try:
                    if old != path:
                        old.unlink()
                except OSError:
                    pass
            path.write_bytes(data)
            return f"{base}/static/productos/{fname}"
        except Exception as e:
            last_error = str(e)
            logger.warning(
                "imagen materialize intento %s/%s producto_id=%s: %s",
                attempt + 1,
                2,
                producto_id,
                last_error,
            )
    logger.warning("imagen materialize: usando URL remota (fallback) producto_id=%s", producto_id)
    return url_remota


def construir_imagen_url_opcional(
    *,
    api_key: str,
    model: str,
    nombre: str,
    descripcion: str | None,
) -> str | None:
    try:
        prompt = groq_generar_prompt_imagen(
            api_key=api_key,
            model=model,
            nombre=nombre,
            descripcion=descripcion,
        )
        if not prompt:
            return None
        return pollinations_url_desde_prompt(prompt)
    except Exception:
        logger.exception("Fallo al generar imagen automática del producto (Groq/Pollinations)")
        return None


def aplicar_imagen_groq_post_creacion(producto_id: int, nombre: str, descripcion: str | None) -> None:
    """Usar con FastAPI BackgroundTasks: no bloquea el POST; completa `imagen_url` si sigue vacía."""
    from app.core.config import settings

    if not settings.producto_imagen_auto or not settings.groq_api_key.strip():
        return
    url_remota = construir_imagen_url_opcional(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        nombre=nombre,
        descripcion=descripcion,
    )
    if not url_remota:
        return
    url = materializar_imagen_producto(
        url_remota=url_remota,
        producto_id=producto_id,
        public_base_url=settings.public_app_url,
    )
    from app.core.db import get_engine
    from sqlmodel import Session

    from app.modules.productos.model import Producto

    engine = get_engine()
    try:
        with Session(engine) as session:
            p = session.get(Producto, producto_id)
            if p is None or p.deleted_at is not None:
                logger.warning("imagen auto: producto %s no encontrado o dado de baja", producto_id)
                return
            if p.imagen_url and str(p.imagen_url).strip():
                return
            p.imagen_url = url
            session.add(p)
            session.commit()
            logger.info("imagen auto guardada para producto_id=%s", producto_id)
    except Exception:
        logger.exception("imagen auto: fallo al guardar en DB producto_id=%s", producto_id)
