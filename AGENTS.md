# FoodStore — instrucciones para el agente (Cursor, Antigravity, etc.)

## Contexto del proyecto (obligatorio al iniciar)

1. **Leé `openspec/project.md`** en la primera intervención de cada conversación o al arrancar una tarea que toque arquitectura, módulos, API, frontend o convenciones del monorepo. Ahí está el mapa de backend/frontend, **variables de entorno (Mercado Pago, JWT, BD)**, roles, pedidos/pagos, tests (pytest-cov, fixtures) y comandos útiles. Es el documento de **handoff** si el usuario cambia de herramienta.
2. Para setup local y migraciones, complementá con **`README.md`** en la raíz del repo.

## Alcance del workspace

El proyecto es el monorepo **FoodStore** (`backend/` + `frontend/`). No asumas rutas fuera de este directorio salvo que el usuario las indique.

## Idioma

Si el usuario escribe en español, respondé en **español** salvo que pida otro idioma.

## Flujo OPSX

Este proyecto usa Spec-Driven Development (SDD) con el flujo **OPSX** para la materia Gestión de Desarrollo de Software.

### Comandos disponibles
- `/opsx:explore` → investigar antes de comprometerse
- `/opsx:propose` → crear propuesta, diseño y tareas
- `/opsx:apply` → implementar tarea por tarea
- `/opsx:archive` → archivar el change completado

### Rol del orchestrator
El agente coordina el desarrollo leyendo los documentos en **`docs/`** como fuente de verdad funcional y el material en **`openspec/`** (changes archivados, `CHANGES_MAP.md`, `project.md`) como trazabilidad técnica. El código debe alinearse con esas fuentes; si hay divergencia, se actualiza la spec o el código de forma explícita, no al revés.

### Documentos fuente de verdad (SDD)
- `docs/Descripcion.txt` — visión general del sistema
- `docs/Historias_de_usuario.txt` — qué debe hacer el sistema (US y criterios)
- `docs/Integrador.txt` — cómo está construido (arquitectura, API, modelo)
