---
name: openspec-explore
description: Explorar el repo y el estado OpenSpec antes de proponer o implementar un change en FoodStore.
---

# OpenSpec — explorar

## Cuándo usarlo

Antes de `/opsx:propose` o cuando el alcance sea incierto: entender qué existe en código y qué changes hay en `openspec/`.

## Fuentes (orden)

1. **`openspec/project.md`** — mapa técnico canónico.
2. **`openspec/CHANGES_MAP.md`** — changes planificados, dependencias, estado.
3. **`openspec list`** / **`openspec status`** (CLI) — changes activos y tareas.
4. **`docs/Integrador.txt`** y **`docs/Historias_de_usuario.txt`** — si la exploración es de dominio.
5. Código en `backend/app/modules/` y `frontend/src/` según el tema.

## Salida esperada

- Resumen breve del estado actual (sin implementar).
- Change candidato o confirmación de que hay que crear uno nuevo.
- Riesgos, dependencias y archivos clave a leer en `/opsx:propose` o `/opsx:apply`.

## No hacer

- No escribir código de producto en modo explore.
- No archivar ni proponer en el mismo paso sin pedido explícito.
