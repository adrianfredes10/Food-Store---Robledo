"""Contrato del flujo Groq → prompt → URL Pollinations (sin llamadas de red reales por defecto)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.integrations.producto_imagen_groq import (
    groq_generar_prompt_imagen,
    pollinations_url_desde_prompt,
)


def test_pollinations_url_encodes_prompt_y_parametros() -> None:
    url = pollinations_url_desde_prompt("  gourmet burger  ")
    assert url.startswith("https://image.pollinations.ai/prompt/")
    assert "width=768" in url
    assert "nologo=true" in url


def test_groq_generar_prompt_imagen_sin_api_key() -> None:
    assert groq_generar_prompt_imagen(api_key="", model="x", nombre="Pizza", descripcion="Tomate") is None


@patch("app.integrations.producto_imagen_groq.httpx.Client")
def test_groq_generar_prompt_imagen_parsea_choice(mock_client_cls: MagicMock) -> None:
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "A wood-fired margherita pizza, dark slate, soft light"}}],
    }
    mock_inst = MagicMock()
    mock_inst.post.return_value = mock_resp
    mock_inst.__enter__.return_value = mock_inst
    mock_inst.__exit__.return_value = None
    mock_client_cls.return_value = mock_inst

    out = groq_generar_prompt_imagen(
        api_key="gsk_test",
        model="llama-3.3-70b-versatile",
        nombre="Pizza napolitana",
        descripcion="Mozzarella y albahaca",
    )
    assert out is not None
    assert "pizza" in out.lower()
    mock_inst.post.assert_called_once()
    call_kw = mock_inst.post.call_args
    assert call_kw[0][0] == "https://api.groq.com/openai/v1/chat/completions"
    payload = call_kw[1]["json"]
    assert payload["model"] == "llama-3.3-70b-versatile"
    assert "Pizza napolitana" in payload["messages"][1]["content"]
