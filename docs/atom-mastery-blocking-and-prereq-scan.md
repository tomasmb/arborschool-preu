# Bloqueos de estudio: prerequisitos sin contenido y átomos base

Este documento describe la lógica añadida para **evitar frustración** y **dejar trazabilidad** cuando:

1. No se pueden verificar prerequisitos porque **faltan preguntas generadas** en la plataforma.
2. Un alumno **no completa la mini-clase** en un **átomo raíz** (sin prerequisitos en el grafo), y no queremos que siga reintentando el mismo tema en bucle.

---

## Conceptos

### Átomo base (raíz en el grafo)

Un **átomo base** aquí significa: el registro en `atoms` tiene **`prerequisite_ids` vacío o nulo** (no hay prerequisitos declarados en contenido). No confundir con “nivel EB” u otra taxonomía curricular salvo que el grafo lo refleje así.

Helper: `getAtomPrerequisiteIds()` en `web/lib/student/prerequisiteScan.ts`.

### Escaneo de prerequisitos (prereq scan)

Tras **fallar una mini-clase** en un átomo que **sí tiene** prerequisitos, el sistema puede abrir una sesión `prereq_scan`: una pregunta medium/high por prerequisito para localizar un “vacío”. Las preguntas salen de `generated_questions` (no del pool PAES alterno en ese flujo).

Implementación principal: `web/lib/student/prerequisiteScan.ts`.

---

## Estados nuevos en `atom_mastery.status`

Definidos en `web/db/schema/enums.ts` y en PostgreSQL (`mastery_status`).

| Valor | Cuándo se usa |
|--------|----------------|
| `blocked_prereq_no_questions` | El escaneo **no puede** comprobar uno o más prerequisitos porque **no existen** ítems generados **medium** o **high** para ese átomo prerequisito. Es un **hueco de contenido**, no un juicio sobre el alumno. |
| `blocked_cannot_pass_base` | Mini-clase **mastery** terminada en **fallo** sobre un **átomo raíz** (sin prerequisitos). Se evita cooldown + reintentos sobre el mismo concepto. |

Otros estados (`in_progress`, `mastered`, `frozen`, etc.) siguen el modelo general del producto; ver `docs/data-model-specification.md` si hace falta contexto amplio.

---

## 1. `blocked_prereq_no_questions` (contenido faltante)

### Detección

- Se usa `filterAtomIdsWithoutMediumOrHighGeneratedQuestions()` en `web/lib/student/questionQueries.ts`: devuelve IDs de átomos que **no tienen ninguna** fila en `generated_questions` con dificultad `medium` o `high`.
- Si **todos** los prerequisitos del átomo fallido están en esa situación **antes** de abrir sesión de escaneo, no se crea `prereq_scan`; se aplica bloqueo directamente.
- Si el escaneo **termina** sin poder servir preguntas para prerequisitos que siguen sin pool válido, también se bloquea en lugar de aplicar cooldown como si “las bases estuvieran bien”.

### Efectos

- `atom_mastery` del **átomo objetivo** (el que el alumno intentaba dominar): `blocked_prereq_no_questions`, `cooldown_until_mastery_count = 0`.
- Tabla de eventos para analítica / piloto: `prereq_question_gap_events` (`web/db/schema/metrics.ts`). Una fila por par **(usuario, átomo objetivo, átomo base prerequisito sin ítems)**, con unicidad para no duplicar.

### Script de agregación (piloto)

`web/scripts/reportPrereqQuestionGaps.ts` — cuenta alumnos distintos bloqueados por cada `base_atom_id`.

### Migración

`web/db/migrations/0028_prereq_question_gap_events.sql`.

---

## 2. `blocked_cannot_pass_base` (raíz, fallo en mini-clase)

### Cuándo

- Sesión de estudio con `session_type === "mastery"` (mini-clase).
- Estado de sesión pasa a **`failed`**.
- El átomo es **raíz**: `getAtomPrerequisiteIds(atomId)` devuelve lista vacía.

### Qué **no** ocurre

- No se llama a `startPrereqScan` (no hay prerequisitos que escanear).
- No se aplica el camino **`no_prereqs`** que antes ponía **cooldown** (“domina N conceptos y vuelve”), que empujaba a reintentar el mismo átomo base.

### Qué sí ocurre

- `applyBlockedCannotPassBase()` en `prerequisiteScan.ts` deja el mastery en `blocked_cannot_pass_base`.
- `createAtomSession` rechaza nuevas sesiones para ese átomo con un mensaje explícito (`atomMasteryEngine.ts`).
- `getNextStudyAtom` en `masteryLifecycle.ts` **excluye** átomos con este estado (junto con `blocked_prereq_no_questions`).

### Migración

`web/db/migrations/0029_blocked_cannot_pass_base.sql`.

---

## Puntos de entrada en código (referencia rápida)

| Área | Archivo |
|------|---------|
| Enum y tabla métrica | `web/db/schema/enums.ts`, `web/db/schema/metrics.ts` |
| Escaneo, bloqueos, `getAtomPrerequisiteIds` | `web/lib/student/prerequisiteScan.ts` |
| Filtro “sin preguntas medium/high” | `web/lib/student/questionQueries.ts` |
| Fallo mini-clase, ramas mastery vs prereq scan | `web/lib/student/atomMasteryEngine.ts` (`submitAnswer`, `createAtomSession`) |
| Siguiente átomo sugerido | `web/lib/student/masteryLifecycle.ts` |
| UI resultado / mensajes | `web/app/portal/study/AtomResultPanel.tsx`, `PrereqScanView.tsx`, `usePrereqScanController.ts` |

---

## Operativa para nuevos entornos

Aplicar migraciones en orden (incluidas `0028` y `0029`). Ver `docs/local-db-migration-runbook.md` si el equipo usa un runbook concreto.

---

## Extensiones futuras posibles

- Desbloqueo manual o por contenido (nuevas `generated_questions`) — hoy el estado es persistente hasta que se cambie contenido o se añada una herramienta admin que actualice `atom_mastery`.
- Criterio distinto de “átomo base” (p. ej. flag en contenido): habría que sustituir o complementar `prereqIds.length === 0` en `atomMasteryEngine.ts` y documentar la nueva regla aquí.
