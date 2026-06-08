import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  COCINA_PEDIDOS_KEY,
  sortCocinaPedidos,
} from "@/features/cocina/hooks/useCocinaPedidos";
import {
  resolveCocinaWsUrl,
  type CocinaPedidoItem,
  type CocinaWsEvent,
} from "@/shared/api/endpoints/cocina";
import { useAuthStore } from "@/shared/store/auth-store";

const SOUND_STORAGE_KEY = "foodstore-cocina-sound";

function readSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
}

function playConfirmBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    void ctx.close();
  } catch {
    /* Web Audio no disponible */
  }
}

function applyWsEvent(items: CocinaPedidoItem[], event: CocinaWsEvent): CocinaPedidoItem[] {
  switch (event.type) {
    case "PEDIDO_CONFIRMADO": {
      if (!event.pedido) return items;
      if (items.some((p) => p.id === event.pedido_id)) return items;
      return sortCocinaPedidos([...items, event.pedido]);
    }
    case "PEDIDO_EN_PREPARACION": {
      if (event.pedido) {
        const next = items.map((p) => (p.id === event.pedido_id ? event.pedido! : p));
        return sortCocinaPedidos(next);
      }
      return sortCocinaPedidos(
        items.map((p) => (p.id === event.pedido_id ? { ...p, estado: "EN_PREP" } : p)),
      );
    }
    case "PEDIDO_EN_CAMINO": {
      if (event.pedido) {
        const next = items.map((p) => (p.id === event.pedido_id ? event.pedido! : p));
        return sortCocinaPedidos(next);
      }
      return sortCocinaPedidos(
        items.map((p) => (p.id === event.pedido_id ? { ...p, estado: "EN_CAMINO" } : p)),
      );
    }
    case "PEDIDO_CANCELADO":
      return items.filter((p) => p.id !== event.pedido_id);
    default:
      return items;
  }
}

export function useCocinaWebSocket() {
  const token = useAuthStore((s) => s.access_token);
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLive, setIsLive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(readSoundEnabled);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  }, []);

  const triggerFlash = useCallback(() => {
    setFlashActive(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashActive(false), 600);
  }, []);

  const patchCache = useCallback(
    (event: CocinaWsEvent) => {
      qc.setQueryData<{ items: CocinaPedidoItem[] }>(COCINA_PEDIDOS_KEY, (old) => {
        const current = old?.items ?? [];
        return { items: applyWsEvent(current, event) };
      });
    },
    [qc],
  );

  const connect = useCallback(() => {
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(resolveCocinaWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      setIsLive(true);
      void qc.invalidateQueries({ queryKey: COCINA_PEDIDOS_KEY });
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(String(ev.data)) as CocinaWsEvent;
        patchCache(event);
        if (event.type === "PEDIDO_CONFIRMADO") {
          if (soundEnabled) playConfirmBeep();
          triggerFlash();
        }
      } catch {
        /* mensaje inválido */
      }
    };

    ws.onclose = () => {
      setIsLive(false);
      wsRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(connect, 5_000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, patchCache, qc, soundEnabled, triggerFlash]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return {
    isLive,
    flashActive,
    soundEnabled,
    setSoundEnabled,
  };
}
