"""Gestor singleton de conexiones WebSocket del KDS."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from starlette.websockets import WebSocket

logger = logging.getLogger(__name__)


class CocinaWSManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        message = json.dumps(payload, default=str)
        async with self._lock:
            targets = list(self._connections)
        dead: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)

    async def broadcast_many(self, payloads: list[dict[str, Any]]) -> None:
        for payload in payloads:
            await self.broadcast(payload)


cocina_ws_manager = CocinaWSManager()
