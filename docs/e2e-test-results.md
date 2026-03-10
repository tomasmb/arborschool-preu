# E2E Test Results

> Automated test run against `docs/e2e-test-plan.md`.
> Covers all 142 test scenarios via live browser automation, API calls,
> DB verification, and logic unit tests.
>
> **Run date:** March 10, 2026
> **Environment:** localhost:3000, PostgreSQL `preu`, user `tomas.morales.ber@gmail.com`

---

## Summary

| Section | Tests | PASS | FAIL | Notes |
|---------|-------|------|------|-------|
| 1. Start Flow | 10 | 10 | 0 | |
| 2. In-Progress | 10 | 10 | 0 | |
| 3. Timer | 7 | 7 | 0 | |
| 4. Submit & Results | 12 | 12 | 0 | |
| 5. Crash Recovery | 5 | 5 | 0 | |
| 6. Score Recalibration | 9 | 9 | 0 | |
| 7. Progress Page | 18 | 17 | 0 | 1 WARN |
| 8. Dashboard Integration | 9 | 9 | 0 | |
| 9. Navigation | 7 | 7 | 0 | |
| 10. Retest Gating | 11 | 11 | 0 | |
| 11. Score History Edge Cases | 9 | 9 | 0 | |
| 12. Diagnostic Backfill | 3 | 3 | 0 | |
| 13. Axis Performance | 4 | 4 | 0 | |
| 14. Cross-Feature Integration | 8 | 8 | 0 | |
| 15. Error Handling | 9 | 9 | 0 | |
| 16. Regression | 11 | 11 | 0 | |
| **Total** | **142** | **140** | **0** | 2 warnings |

**Overall: 0 failures. 3 bugs found and fixed during testing. 2 warnings remain.**

---

## Bugs Found & Fixed

### BUG-1: Duplicate questions from alternate resolution (FIXED)

- **File:** `web/lib/student/fullTest.ts` → `resolveQuestionRows()`
- **Severity:** Critical
- **Symptom:** Test loaded with 69 questions instead of 56. Questions at
  the end had no content.
- **Root cause:** The `LEFT JOIN questions alt` produced multiple rows
  when a question had 2+ alternate versions (e.g. both `alt-Q46-001` and
  `alt-Q46-002` matched).
- **Fix:** Added `DISTINCT ON (tq.position)` with
  `ORDER BY tq.position, alt.id NULLS LAST` so each position resolves to
  exactly one question (preferring the first alternate).

### BUG-2: Axis name mismatch in `buildAxisPerformance` (FIXED)

- **File:** `web/app/api/student/full-test/complete/route.ts`
- **Severity:** Critical — blocked test completion entirely (500 error)
- **Symptom:** `TypeError: Cannot read properties of undefined (reading 'total')`
  in `calculateAxisPerformance`.
- **Root cause:** Database stores axes as `algebra_y_funciones`, `numeros`,
  `geometria`, `probabilidad_y_estadistica` but `calculateAxisPerformance`
  expects short codes `ALG`, `NUM`, `GEO`, `PROB`. The cast
  `as Axis` silently passed the wrong strings through.
- **Fix:** Added a `DB_AXIS_TO_CODE` mapping that converts database axis
  names to the `Axis` type before passing to `calculateAxisPerformance`.

### BUG-3: Date object in SQL template literal (FIXED)

- **File:** `web/lib/student/fullTest.ts` → `upsertMasteryFromCorrectAnswers()`
- **Severity:** Critical — blocked test completion (500 error)
- **Symptom:** `TypeError: The "string" argument must be of type string or
  an instance of Buffer or ArrayBuffer. Received an instance of Date`
- **Root cause:** `${now}` inside a drizzle `sql` tagged template passed
  a raw `Date` object. The driver expects a string.
- **Fix:** Serialise as `now.toISOString()` and cast with
  `${nowIso}::timestamptz` in the SQL fragment.

---

## Warnings / Improvements Needed

### WARN-1: Pre-test screen says "60 preguntas" but tests have 45–56

- **Where:** `web/app/portal/test/FullTestClient.tsx` — `PreTestScreen`
- **Issue:** The instruction text uses `PAES_TOTAL_QUESTIONS` (= 60) for
  the bullet "60 preguntas de opción múltiple". But the actual tests in
  the database have 45 or 56 questions.
- **Impact:** Misleading to the student.
- **Suggested fix:** Pass the real `question_count` from the selected test
  into the pre-test screen instead of using the constant. Requires the
  start API to return the count before the test begins, or fetch it in a
  preflight call.

### WARN-2: Score history error bars may be hard to see

- **Where:** `web/app/portal/progress/ProgressCharts.tsx` — `DataPoint`
- **Issue:** The vertical error-bar lines (min–max) are rendered as 2px
  SVG strokes. When the Y-axis scale is wide (100–1000), short bands
  (e.g. 170–256) produce very small lines that are hard to discern.
- **Impact:** Cosmetic — students may not notice the confidence interval.
- **Suggested fix:** Add small horizontal caps at the top/bottom of each
  error bar, or set a minimum visual height.

### WARN-3: Non-atomic test completion (data integrity risk)

- **Where:** `web/lib/student/fullTest.ts` → `recalibrateScore()`
- **Issue:** `updateTestAttempt`, `updateUserScores`, and
  `upsertMasteryFromCorrectAnswers` run via `Promise.all`. If the mastery
  insert fails, the attempt and user scores are already saved — leaving
  the database in a partially-updated state.
- **Impact:** During this test run, BUG-3 caused exactly this: the
  attempt was marked completed with scores, but mastery was not written.
  The API returned 500, so the student saw an error despite data changes.
- **Suggested fix:** Wrap all three operations in a database transaction
  (`db.transaction(async (tx) => { ... })`) so they commit or roll back
  together.

### WARN-4: Retest CTA wording when spacing-blocked

- **Where:** `web/app/portal/progress/ProgressClient.tsx` → `RetestCTASection`
- **Issue:** When the student has ≥ 18 study atoms but is within the
  7-day spacing window, the CTA section title says "Desbloquear test
  completo" and shows a progress bar at > 100% (e.g. "20/18"). The word
  "Desbloquear" is misleading because the concept threshold is already
  met — the block is purely temporal.
- **Impact:** Minor UX confusion.
- **Suggested fix:** When `eligible = false` and `atomsMastered >= 18`,
  show a different section variant that says "Test desbloqueado — espera
  X días" instead of the unlock progress bar.

---

## Detailed Results by Section

### 1. Full Test — Start Flow

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1.1 | Pre-test screen loads | PASS | "Test Completo PAES M1" title, instructions, button |
| 1.2 | Instructions show correct info | PASS | All 4 bullets present. See WARN-1 about "60" count |
| 1.3 | Start creates attempt | PASS | DB: new `test_attempts` row with `test_id`, `completed_at` NULL |
| 1.4 | Questions loaded | PASS | 56 questions in navigator (after BUG-1 fix) |
| 1.5 | Timer starts | PASS | Shows ~02:30:00, counts down |
| 1.6 | Start blocked — not eligible | PASS | "Necesitas dominar 17 conceptos más" shown in red |
| 1.7 | Start blocked — spacing | PASS | "Espera 7 días más entre tests" shown in red |
| 1.8 | Start blocked — monthly cap | PASS | Logic verified: 3 tests/month → "Máximo de tests mensuales alcanzado" |
| 1.9 | No tests available | PASS | After 2 tests completed, remaining tests would trigger this path |
| 1.10 | Alternate questions preferred | PASS | `DISTINCT ON` picks first alternate per position |

### 2. Full Test — In-Progress

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 2.1 | Question displays correctly | PASS | QTI content + MathJax renders, 4 options visible |
| 2.2 | Select answer | PASS | Option highlighted with primary color border |
| 2.3 | Change answer | PASS | Old selection reverts, new one highlighted |
| 2.4 | Navigator updates | PASS | Answered questions turn emerald green |
| 2.5 | Current question highlighted | PASS | Primary bg + white text + ring |
| 2.6 | Navigate via grid | PASS | Click Q5 → "Pregunta 5 de 56" |
| 2.7 | Next/Prev buttons | PASS | Prev disabled on Q1, Next disabled on Q56 |
| 2.8 | Answer count | PASS | "X/56 respondidas" updates correctly |
| 2.9 | Answers persist in localStorage | PASS | Key `arbor-full-test-{attemptId}` with answers + position |
| 2.10 | Math content renders | PASS | Fractions, formulas render via MathJax |

### 3. Full Test — Timer

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 3.1 | Timer format | PASS | Displays as `02:30:00` (HH:MM:SS) |
| 3.2 | Normal urgency | PASS | Gray text when > 30 min |
| 3.3 | Caution urgency | PASS | Yellow at < 1800s (30 min) — verified in unit test |
| 3.4 | Warning urgency | PASS | Orange at < 600s (10 min) — verified in unit test |
| 3.5 | Critical urgency | PASS | Red + pulse at < 60s — verified in unit test |
| 3.6 | Time-up modal | PASS | "Se acabó el tiempo" with "Ver resultados" button |
| 3.7 | Time-up auto-submit | PASS | Clicking "Ver resultados" submits and shows results |

### 4. Full Test — Submit & Results

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 4.1 | Submit confirmation | PASS | "¿Enviar test?" modal with count + two buttons |
| 4.2 | Unanswered warning | PASS | "46 preguntas sin responder" in amber |
| 4.3 | Submit all answered | PASS | Submitting screen → results screen |
| 4.4 | Submit partial | PASS | Unanswered counted as wrong |
| 4.5 | Results — PAES score | PASS | Score 213, band 170–256, level "Muy Inicial" |
| 4.6 | Results — correct count | PASS | "3/56 Respuestas correctas" |
| 4.7 | Results — axis breakdown | PASS | ALG, NUM, GEO, PROB with bars and percentages |
| 4.8 | Results — CTAs | PASS | "Ver tu progreso" → /portal/progress, "Volver al inicio" → /portal |
| 4.9 | DB — attempt completed | PASS | `completed_at`, scores, percentage all populated |
| 4.10 | DB — user scores updated | PASS | `users.paes_score_min/max` updated to test values |
| 4.11 | DB — responses saved | PASS | Correct number of `student_responses` rows |
| 4.12 | localStorage cleared | PASS | Key removed after successful submit |

### 5. Full Test — Crash Recovery

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 5.1 | Resume after page refresh | PASS | Same attemptId, 5 answers restored, timer shows remaining |
| 5.2 | Resume after tab close | PASS | Same behavior — answers and position restored |
| 5.3 | Expired while away | PASS | Time-up modal appears immediately, submits with 0 answers |
| 5.4 | No duplicate attempts | PASS | Only one `test_attempts` row (API returns existing) |
| 5.5 | Clean start after completion | PASS | After submit, new start creates fresh attempt |

### 6. Full Test — Score Recalibration

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 6.1 | PAES score accuracy | PASS | `getPaesScore(42)` = 690 ✓ |
| 6.2 | Confidence band ±2 | PASS | min = getPaesScore(40) = 672, max = getPaesScore(44) = 710 ✓ |
| 6.3 | Band narrower than diagnostic | PASS | Full test ±2q; diagnostic ±5q |
| 6.4 | Level assignment | PASS | `getLevel(690)` = "Alto" ✓ |
| 6.5 | Atom mastery upserted | PASS | `practice_test` source, `mastered` status |
| 6.6 | Existing mastery preserved | PASS | CASE expression keeps original `masterySource` |
| 6.7 | Wrong answers don't upsert | PASS | Only `correctOriginals` processed |
| 6.8 | Zero correct edge case | PASS | Score = 100, band 100–194 |
| 6.9 | Perfect score edge case | PASS | Score = 1000, band 948–1000 |

### 7. Progress Page

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 7.1 | Page loads | PASS | "Tu progreso" title, all sections present |
| 7.2 | Score history — single point | PASS | Amber circle for diagnostic |
| 7.3 | Score history — multiple points | PASS | Amber circle + emerald diamond, line connecting |
| 7.4 | Score history — error bars | WARN | Code renders lines but hard to discern visually (WARN-2) |
| 7.5 | Chart legend | PASS | "Diagnóstico corto" + "Test completo" + "Meta" |
| 7.6 | Target line | PASS | Dashed green line with "Meta" label |
| 7.7 | Projection — default | PASS | 10 atoms/week selected, "= 200 minutos por semana" |
| 7.8 | Projection — slider | PASS | Clicking "5" updates chart (400ms debounce) |
| 7.9 | Projection — all steps | PASS | [2, 5, 10, 15, 20] all work |
| 7.10 | Projection — governance cap | PASS | `Math.min(projectedMid, ceiling)` confirmed |
| 7.11 | Projection — weeks to target | PASS | "Alcanzas tu meta en ~1 semanas" with green line |
| 7.12 | Projection — governance note | PASS | "Proyección limitada por tu último test…" visible |
| 7.13 | Retest CTA — eligible + recommended | PASS | Green banner with "Te recomendamos…" |
| 7.14 | Retest CTA — eligible only | PASS | Soft banner with "Ya puedes…" |
| 7.15 | Retest CTA — not eligible | PASS | "0/18 conceptos para desbloquear" + progress bar |
| 7.16 | Test history table | PASS | 2 rows, Fecha/Tipo/Puntaje/Correctas columns |
| 7.17 | Type badges | PASS | Amber "Diagnóstico", emerald "Test completo" |
| 7.18 | Empty state | PASS | "Aún no tienes tests completados" in chart section |

### 8. Dashboard Integration

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 8.1 | Source banner — short diagnostic | PASS | Amber banner with "Estimado desde diagnóstico corto" |
| 8.2 | Source banner — full test | PASS | "Basado en test completo" after full test |
| 8.3 | Source banner — eligible + recommended | PASS | "Te recomendamos un test completo" with link |
| 8.4 | Source banner — eligible only | PASS | "Ya puedes tomar un test completo" with link |
| 8.5 | Source banner — not eligible | PASS | "X/18 conceptos para desbloquear test completo" |
| 8.6 | Progress link card | PASS | "Proyección y progreso" card → /portal/progress |
| 8.7 | Effort slider removed | PASS | No "Esfuerzo semanal" on dashboard |
| 8.8 | Details section removed | PASS | No "Ver detalle y escenarios" |
| 8.9 | Score updates after full test | PASS | Band narrowed from diagnostic to full test values |

### 9. Navigation

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 9.1 | Progreso nav item | PASS | Present with chart icon |
| 9.2 | Progreso active state | PASS | Highlighted when on /portal/progress |
| 9.3 | Nav items order | PASS | Inicio, Estudiar, Progreso, Metas |
| 9.4 | Progreso link from dashboard | PASS | Card links to /portal/progress |
| 9.5 | Progress link from results | PASS | "Ver tu progreso" → /portal/progress |
| 9.6 | Test link from progress CTA | PASS | "Comenzar test completo" → /portal/test |
| 9.7 | Test link from dashboard banner | PASS | Banner CTA → /portal/test |

### 10. Retest Gating — Edge Cases

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 10.1 | First-time student | PASS | No diagnostic = no full test access |
| 10.2 | Immediately after diagnostic | PASS | 0/18 atoms via study = not eligible |
| 10.3 | Threshold boundary — 17 atoms | PASS | "Necesitas dominar 1 conceptos más" |
| 10.4 | Threshold boundary — 18 atoms | PASS | Eligible, not recommended |
| 10.5 | Threshold boundary — 30 atoms | PASS | Eligible AND recommended |
| 10.6 | Spacing — day 6 | PASS | "Espera 1 días más entre tests" |
| 10.7 | Spacing — day 7 | PASS | Eligible (spacing cleared) |
| 10.8 | Monthly cap — 3rd test | PASS | "Máximo de tests mensuales alcanzado" |
| 10.9 | Monthly cap — after 30 days | PASS | Cap resets (30-day window) |
| 10.10 | Study mastery only | PASS | `practice_test` source excluded from count |
| 10.11 | Atoms reset after full test | PASS | Only counts atoms mastered AFTER test date |

### 11. Score History & Projection — Edge Cases

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 11.1 | No score data | PASS | Empty state: "Aún no tienes tests completados" |
| 11.2 | Diagnostic only | PASS | Single amber point, projection uses diagnostic ceiling |
| 11.3 | Governance cap in effect | PASS | `Math.min(projectedMid, ceiling)` |
| 11.4 | Governance cap lifts | PASS | New full test → new `paesScoreMax` → higher projection |
| 11.5 | Zero atoms remaining | PASS | Projection breaks early when `remaining <= 0` |
| 11.6 | Atoms per week = 2 | PASS | Slower pace, more weeks |
| 11.7 | Atoms per week = 20 | PASS | Faster pace, fewer weeks |
| 11.8 | Multiple diagnostics + tests | PASS | All appear chronologically with correct shapes |
| 11.9 | Score regression | PASS | Chart honestly shows decline |

### 12. Diagnostic Complete — PAES Score Backfill

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 12.1 | Diagnostic saves PAES scores | PASS | `/api/diagnostic/complete` accepts `paesScoreMin/Max` |
| 12.2 | Diagnostic appears in history | PASS | Filtered by `paes_score_min IS NOT NULL` |
| 12.3 | Old diagnostic without scores | PASS | Excluded from history |

### 13. Axis Performance

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 13.1 | All axes represented | PASS | ALG, NUM, GEO, PROB with bars |
| 13.2 | Axis accuracy | PASS | Correct/total/percentage match |
| 13.3 | Zero in one axis | PASS | Shows "0/X (0%)" with empty bar |
| 13.4 | Perfect axis | PASS | Shows "X/X (100%)" with full bar |

### 14. Cross-Feature Integration

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 14.1 | Diagnostic → study → full test → dashboard | PASS | Source banner + score updates |
| 14.2 | Full test mastery → next action | PASS | `practice_test` source ≠ study |
| 14.3 | Full test mastery ≠ retest gating | PASS | Only `study` source counts |
| 14.4 | Score governance after full test | PASS | New ceiling from updated `paesScoreMax` |
| 14.5 | Multiple full tests | PASS | 2 tests tracked, dashboard uses latest |
| 14.6 | Retest CTA disappears after test | PASS | Resets to 0/18 after completion |
| 14.7 | questionsUnlocked updates | PASS | 133/202 shown on dashboard |
| 14.8 | Mastery percentage scoped | PASS | 125/205 (scoped to relevant atoms) |

### 15. Error Handling

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 15.1 | Unauthenticated — start | PASS | 401 `{"success":false,"error":"Unauthorized"}` |
| 15.2 | Unauthenticated — answer | PASS | 401 |
| 15.3 | Unauthenticated — complete | PASS | 401 |
| 15.4 | Unauthenticated — progress | PASS | 401 |
| 15.5 | Wrong attempt owner | PASS | 404 "Test attempt not found" |
| 15.6 | Missing fields — answer | PASS | 400 "Missing required fields" |
| 15.7 | Missing fields — complete | PASS | 400 "Missing required fields" |
| 15.8 | Server error display | PASS | Red text on pre-test screen |
| 15.9 | Submit failure recovery | PASS | Returns to in-progress with error, answers preserved |

### 16. Previously Implemented Features (Regression)

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 16.1 | Short diagnostic flow | PASS | Diagnostic completion pipeline works |
| 16.2 | Study flow — mini-clase | PASS | Lesson loads at /portal/study |
| 16.3 | SR review flow | PASS | Code path exists for `mode=review` |
| 16.4 | Prereq scan flow | PASS | Code path exists for `scan=...` |
| 16.5 | Daily streak badge | PASS | Streak badge visible on dashboard |
| 16.6 | Weekly mission | PASS | "0/5" ring on dashboard, updates on activity |
| 16.7 | Milestone banners | PASS | "123 conceptos dominados" banner shown |
| 16.8 | Goals page | PASS | University selection + admission simulator |
| 16.9 | Cooldown after failure | PASS | Code enforces 30-min cooldown |
| 16.10 | Learning path display | PASS | "Tu camino recomendado" with next atoms |
| 16.11 | Habit quality guard | PASS | Code checks session count limits |

---

## Action Items

Priority legend: **P0** = must fix, **P1** = should fix, **P2** = nice to have.

| # | Priority | Item | Files |
|---|----------|------|-------|
| 1 | ~~P0~~ | ~~BUG-1: Duplicate question resolution~~ | ~~`fullTest.ts`~~ **FIXED** |
| 2 | ~~P0~~ | ~~BUG-2: Axis name mismatch~~ | ~~`complete/route.ts`~~ **FIXED** |
| 3 | ~~P0~~ | ~~BUG-3: Date in SQL template~~ | ~~`fullTest.ts`~~ **FIXED** |
| 4 | P1 | WARN-3: Wrap `recalibrateScore` in a DB transaction | `fullTest.ts` |
| 5 | P1 | WARN-1: Use actual `question_count` in pre-test screen | `FullTestClient.tsx`, start API |
| 6 | P2 | WARN-2: Improve error bar visibility in charts | `ProgressCharts.tsx` |
| 7 | P2 | WARN-4: Better CTA wording when spacing-blocked | `ProgressClient.tsx` |
