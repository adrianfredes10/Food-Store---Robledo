# Metodología SDD — FoodStore

**Spec-Driven Development (SDD) v5.0** · flujo **OPSX** (OpenSpec) · tooling **JR Stack Lite** en Cursor.

Este documento deja **visible** cómo se desarrolla el proyecto: primero la especificación, después el código, con trazabilidad en `openspec/` y `docs/`.

---

## 1. Principio

> Ningún incremento relevante se implementa “a ojo”. Cada feature nace como **change** documentado, se implementa contra **tasks** verificables y se **archiva** cuando está probado.

| Capa | Rol |
|------|-----|
| **`docs/`** | Verdad funcional (historias, ERD, reglas de negocio, rúbrica) |
| **`openspec/`** | Trazabilidad técnica (changes, mapa, contexto canónico) |
| **Código** | Debe coincidir con spec **o** la spec se actualiza explícitamente |

Documentos clave:

| Archivo | Contenido |
|---------|-----------|
| [docs/Integrador.txt](../docs/Integrador.txt) | Especificación técnica SDD v5.0 |
| [docs/Historias_de_usuario.txt](../docs/Historias_de_usuario.txt) | US-001..US-009 |
| [openspec/project.md](project.md) | Mapa técnico del repo (API, roles, env, tests) |
| [openspec/CHANGES_MAP.md](CHANGES_MAP.md) | Orden, dependencias y estado de cada change |
| [openspec/SKILLS_REGISTRY.md](SKILLS_REGISTRY.md) | Skills Cursor usadas por change |
| [AGENTS.md](../AGENTS.md) | Reglas para agentes (arquitectura, OPSX, skills) |

---

## 2. Ciclo OPSX

```text
/opsx:explore  →  /opsx:propose  →  /opsx:apply  →  verificar  →  /opsx:archive
```

| Fase | Comando Cursor | Skill | Artefacto |
|------|----------------|-------|-----------|
| Explorar | `/opsx:explore` | `openspec-explore` | Notas en chat; sin código masivo |
| Proponer | `/opsx:propose` | `openspec-propose` | `openspec/changes/<slug>/` → `proposal.md`, `design.md`, `tasks.md` |
| Implementar | `/opsx:apply` | `openspec-apply-change` | Código + tests alineados a `tasks.md` |
| Cerrar | `/opsx:archive` | `openspec-archive-change` | Move a `openspec/changes/archive/` + fila en `CHANGES_MAP.md` |

Comandos en [`.cursor/commands/`](../.cursor/commands/). Skills en [`.cursor/skills/`](../.cursor/skills/) — índice en [`.cursor/skills/README.md`](../.cursor/skills/README.md).

---

## 3. Estructura de un change

```text
openspec/changes/<slug>/
├── proposal.md    # Problema, alcance IN/OUT, historias, riesgos
├── design.md      # Decisiones técnicas backend/frontend/BD
├── tasks.md       # Checklist ejecutable (una tarea = verificable)
└── specs/         # (opcional) contratos API o comportamiento
```

Al **archivar**, la carpeta pasa a `openspec/changes/archive/<slug>/` y el checklist en `CHANGES_MAP.md` queda `[x]`.

---

## 4. Tooling JR Stack (Cursor)

Instalado en el entorno de desarrollo (**Lite**), no dentro del código de la app:

| Pieza | Función en SDD |
|-------|----------------|
| **OpenSpec CLI** (`openspec list`, …) | Estado de changes desde terminal |
| **OpenSpec MCP** | Herramientas del agente sobre changes |
| **Context7 MCP** | Documentación actualizada de librerías al implementar |
| **Engram MCP** | Memoria entre sesiones del agente |

Skills y comandos **del proyecto** viven en `.cursor/` y están registrados en [SKILLS_REGISTRY.md](SKILLS_REGISTRY.md).

---

## 5. Arquitectura que respeta la spec

### Backend

```text
Router → Service → UoW → Repository → Model
```

El **service** lanza `HTTPException`; el router no contiene lógica de negocio.

### Frontend (FSD)

```text
Pages → Features → Shared
```

Estado servidor: **TanStack Query**. Estado cliente: **Zustand**.

---

## 6. Verificación antes de archivar

| Check | Comando |
|-------|---------|
| Backend | `cd backend` · `$env:PYTEST_DISABLE_RATE_LIMIT=1` · `pytest` |
| Frontend | `cd frontend` · `npm run build` |
| Trazabilidad | `tasks.md` todo `[x]` · fila en `CHANGES_MAP.md` |

---

## 7. Cómo empezar un feature nuevo (ejemplo)

1. Leer `docs/` + `openspec/project.md` + `CHANGES_MAP.md`.
2. `/opsx:explore` — “¿Qué hay hoy para X?”
3. `/opsx:propose` — slug kebab-case, p. ej. `us-stock-admin-productos`.
4. Revisar `proposal.md` / `design.md` / `tasks.md`.
5. `/opsx:apply` — implementar tarea por tarea.
6. Probar (pytest, build, UI).
7. `/opsx:archive` — cerrar change y actualizar mapa + [SKILLS_REGISTRY.md](SKILLS_REGISTRY.md).

---

*FoodStore · SDD v5.0 · OPSX · última revisión alineada a changes archivados en `CHANGES_MAP.md`.*
