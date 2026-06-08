---
name: openspec-apply-change
description: Implementar un change OpenSpec en FoodStore siguiendo tasks.md y la arquitectura del monorepo.
---

# OpenSpec — aplicar change

## Cuándo usarlo

Cuando exista `openspec/changes/<slug>/` con **`tasks.md`** listo y el usuario pida implementar (`/opsx:apply`).

## Antes de codear

1. Leé **`openspec/changes/<slug>/proposal.md`**, **`design.md`**, **`tasks.md`** y specs del change.
2. Leé **`openspec/project.md`** y **`docs/Integrador.txt`** (capas Router → Service → UoW → Repository → Model; FSD en frontend).
3. Confirmá el change activo con **`openspec status`** si aplica.

## Reglas FoodStore (obligatorias)

- Backend: excepciones de negocio en **service**; router con `response_model`.
- Frontend: imports FSD; TanStack Query para servidor; Zustand solo cliente.
- BD: migraciones Alembic; no alterar tablas a mano.
- No commitear sin pedido; no build automático (ver `AGENTS.md`).

## Ejecución

- Una tarea de `tasks.md` por vez; marcá progreso en el checklist.
- Tests solo si la tarea lo pide o cubre comportamiento real.
- Actualizá **`openspec/project.md`** si cambian contratos globales o env vars (si está en tasks).

## Al terminar

- Dejá tareas hechas marcadas en `tasks.md`.
- Indicá qué falta para `/opsx:archive`.
