"""Groq genera un prompt de imagen; la URL apunta a un servicio text-to-image público.

Groq no expone generación de píxeles: solo LLM. El flujo alinea el estilo con el catálogo demo
(fotografía gastronómica oscura / premium) y devuelve una URL usable en `imagen_url`.
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"

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
    """URL que el navegador puede usar como `src` de `<img>` (generación on-the-fly)."""
    p = " ".join(prompt.split())
    if len(p) > 900:
        p = p[:900]
    # Parámetros fijos mejoran caché y compatibilidad; nologo evita marca en la imagen.
    q = "width=768&height=768&nologo=true"
    return f"{POLLINATIONS_BASE}/{quote(p, safe='')}?{q}"


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
    url = construir_imagen_url_opcional(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        nombre=nombre,
        descripcion=descripcion,
    )
    if not url:
        return
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
