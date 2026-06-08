---
name: openspec-archive-change
description: Archivar un change OpenSpec completado en FoodStore y actualizar CHANGES_MAP.
---

# OpenSpec — archivar change

## Cuándo usarlo

Cuando **`tasks.md`** del change esté implementado y verificado; el usuario pide cerrar el change (`/opsx:archive`).

## Checklist

1. Confirmá que no queden tareas abiertas en `openspec/changes/<slug>/tasks.md`.
2. Ejecutá verificación acordada (tests manuales o `pytest` si el usuario lo pidió).
3. Mové o archivá el change según convención del repo (`openspec/changes/archive/`).
4. En **`openspec/CHANGES_MAP.md`**: marcá el change como **`[x]`** en *Estado actual* (columna Skills si aplica).
5. En **`openspec/SKILLS_REGISTRY.md`**: registrá las skills Cursor usadas en el change.
6. Consolidá deltas de specs al catálogo si el flujo OPSX del CLI lo requiere (`openspec archive`).

## No hacer

- No archivar con tareas pendientes sin acuerdo explícito.
- No commitear sin pedido del usuario.
