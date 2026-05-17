---
name: openspec-propose
description: Proponer un change OpenSpec completo (proposal, design, tasks) alineado a docs/ SDD y CHANGES_MAP.
---

# OpenSpec — proponer un change

## Cuándo usarlo

Al definir un trabajo **nuevo** que toque API, dominio, frontend o BD: generá la carpeta del change y enlazalo a **historias de usuario** y a **`openspec/CHANGES_MAP.md`**.

## Fuentes obligatorias (orden)

1. **`docs/Descripcion.txt`** — visión y módulos.
2. **`docs/Historias_de_usuario.txt`** — criterios de aceptación (US-001 … US-009): el `tasks.md` debe poder trazarse a esos criterios o documentar una excepción explícita.
3. **`docs/Integrador.txt`** — stack, capas, prefijo `/api/v1`, OpenAPI de referencia si aplica.
4. **`openspec/project.md`** — inventario real del repo (endpoints, env, tests); si la spec de usuario y el código difieren, **dejalo escrito** en `proposal.md` como decisión o deuda.
5. **`openspec/CHANGES_MAP.md`** — dependencias entre changes; no solapes un change ya cerrado sin justificar un *follow-up*.

## Estructura del change

Crear `openspec/changes/<slug>/` con:

- **`proposal.md`**: contexto, problema, alcance IN/OUT, historias (US-xxx), fuera de alcance, riesgos.
- **`design.md`**: decisión técnica por capa (Router → Service → UoW → Repository → Model`; frontend FSD); migraciones Alembic si toca BD.
- **`tasks.md`**: checklist pequeña y verificable; incluir “Actualizar `openspec/project.md`” si cambian contratos globales o env vars.
- **`specs/…-spec.md`** (opcional): detalle de endpoints o reglas de dominio nuevas.

## Checklist de calidad antes de dar por terminada la propuesta

- [ ] Cada **US** citado tiene al menos una **tarea** o una nota de exclusión.
- [ ] `CHANGES_MAP.md` tiene fila nueva + dependencia correcta.
- [ ] No contradice `project.md` sin mencionarlo en `proposal.md` o `design.md`.

## Relación con otros comandos

| Comando / skill | Siguiente paso |
|-----------------|----------------|
| `/opsx:apply` + `openspec-apply-change` | Implementar `tasks.md` |
| `/opsx:archive` + `openspec-archive-change` | Cerrar change y marcar `[x]` en `CHANGES_MAP.md` |

## Idioma

Mismo idioma que el repositorio (`AGENTS.md`): **español** en los markdown del change salvo nombres técnicos en inglés donde el código ya los use.
