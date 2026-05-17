# `/opsx:propose`

## Objetivo

Crear un **change OpenSpec** nuevo bajo `openspec/changes/<slug>/` con los artefactos mínimos listos para `/opsx:apply`.

## Antes de escribir nada

1. Leé **`openspec/project.md`** (estado técnico del repo).
2. Leé **`docs/Descripcion.txt`**, **`docs/Historias_de_usuario.txt`** y **`docs/Integrador.txt`** y enlazá cada alcance del change a **US-00x** explícitos.
3. Mirá **`openspec/CHANGES_MAP.md`** para no duplicar un change cerrado y para ordenar dependencias (`Depende de`).

## Qué generar (por change)

Directorio `openspec/changes/<slug>/` (kebab-case, p. ej. `us-008-pedidos-ops`):

| Archivo | Contenido |
|---------|-----------|
| `proposal.md` | Problema, alcance IN/OUT, historias cubiertos, riesgos. |
| `design.md` | Decisiones técnicas, impacto backend/frontend/BD, alternativas descartadas. |
| `tasks.md` | Checklist ejecutable alineada a criterios de aceptación; una tarea debe ser verificable. |
| `specs/<nombre>-spec.md` (opc.) | Contratos API o comportamiento si el cambio lo requiere. |

## Actualizar mapa

- Agregá una fila nueva en **`openspec/CHANGES_MAP.md`** (tabla *Orden de implementación*) con **Historias** y **Depende de**.
- El estado inicial del checklist en *Estado actual* debe ser **`[ ]` hasta archivar**.

## Skill

Para el detalle de redacción y convenciones, seguí **`.cursor/skills/openspec-propose/SKILL.md`**.

## No hacer

- No commitear `.env`.
- No archivar (`/opsx:archive`) en el mismo paso que proponer: primero **`/opsx:apply`**.
