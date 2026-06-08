"""Contrato del flujo Groq → prompt → URL Pollinations (sin llamadas de red reales por defecto)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.integrations.producto_imagen_groq import (
    groq_generar_prompt_imagen,
    materializar_imagen_producto,
    pollinations_url_desde_prompt,
)


def test_pollinations_url_encodes_prompt_y_parametros() -> None:
    url = pollinations_url_desde_prompt("  gourmet burger  ")
    assert url.startswith("https://image.pollinations.ai/prompt/")
    assert "width=512" in url
    assert "height=512" in url
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


@patch("app.integrations.producto_imagen_groq.httpx.Client")
def test_materializar_imagen_guarda_y_devuelve_url_local(mock_client_cls: MagicMock, tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("app.integrations.producto_imagen_groq.producto_imagenes_dir", lambda: tmp_path)
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.content = b"x" * 300
    mock_resp.headers = {"content-type": "image/jpeg"}
    mock_inst = MagicMock()
    mock_inst.get.return_value = mock_resp
    mock_inst.__enter__.return_value = mock_inst
    mock_inst.__exit__.return_value = None
    mock_client_cls.return_value = mock_inst

    out = materializar_imagen_producto(
        url_remota="https://image.pollinations.ai/prompt/foo",
        producto_id=7,
        public_base_url="http://api.test",
    )
    assert out == "http://api.test/static/productos/7.jpg"
    assert (tmp_path / "7.jpg").read_bytes() == b"x" * 300


@patch("app.integrations.producto_imagen_groq.httpx.Client")
def test_materializar_imagen_fallback_si_respuesta_corta(mock_client_cls: MagicMock, tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("app.integrations.producto_imagen_groq.producto_imagenes_dir", lambda: tmp_path)
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.content = b"nope"
    mock_resp.headers = {"content-type": "image/jpeg"}
    mock_inst = MagicMock()
    mock_inst.get.return_value = mock_resp
    mock_inst.__enter__.return_value = mock_inst
    mock_inst.__exit__.return_value = None
    mock_client_cls.return_value = mock_inst

    remote = "https://image.pollinations.ai/prompt/abc"
    out = materializar_imagen_producto(url_remota=remote, producto_id=1, public_base_url="http://x.test")
    assert out == remote
    assert not list(tmp_path.iterdir())
