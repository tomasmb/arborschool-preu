# End-to-End Test Plan

> Manual E2E test scenarios for the student portal.
> Covers the full timed test feature, progress page, dashboard integration,
> and all features from the implementation gap analysis.
>
> **How to use:** Work through each section. Record PASS/FAIL and notes in
> the Result column. If a test fails, note the observed behavior.

**Created:** March 10, 2026

---

## Prerequisites

- Local DB migrated (`npx drizzle-kit migrate`)
- Dev server running (`npm run dev` in `web/`)
- A test student account logged in at `/portal`
- Student has completed the short diagnostic (16-question flow)
- At least one official test with 60 questions exists in the `tests` table

---

## 1. Full Test — Start Flow

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 1.1 | Pre-test screen loads | Navigate to `/portal/test` | See "Test Completo PAES M1" title, instructions, "Comenzar Test" button | |
| 1.2 | Instructions show correct info | Read the bullet points | Shows "60 preguntas de opción múltiple" and "2 horas 30 minutos" | |
| 1.3 | Start creates attempt | Click "Comenzar Test", check DB | New row in `test_attempts` with `test_id` set, `completed_at` NULL | |
| 1.4 | Questions loaded | After clicking start | Transition to in-progress screen with 60 questions in navigator | |
| 1.5 | Timer starts | After test begins | Timer shows ~02:30:00 and counts down | |
| 1.6 | Start blocked — not eligible | Set `atom_mastery` count < 18 since last test, try to start | 403 error with "Necesitas dominar X conceptos más" message | |
| 1.7 | Start blocked — spacing | Complete a full test, immediately try to start another | 403 error with "Espera X días más entre tests" | |
| 1.8 | Start blocked — monthly cap | Complete 3 full tests within 30 days, try to start 4th | 403 error with "Máximo de tests mensuales alcanzado" | |
| 1.9 | No tests available | Complete all official tests, try to start | 404 error with "No hay tests completos disponibles" | |
| 1.10 | Alternate questions preferred | Verify question IDs in API response | Questions with `source='alternate'` are used when available via `parent_question_id` | |

---

## 2. Full Test — In-Progress

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 2.1 | Question displays correctly | View first question | QTI content renders with MathJax, options A-E visible | |
| 2.2 | Select answer | Click option B | Option B highlighted with primary color, others default | |
| 2.3 | Change answer | Select A then select C | Only C highlighted, A reverts to default | |
| 2.4 | Navigator updates | Answer questions 1, 3, 5 | Those numbers turn green in grid, others stay gray | |
| 2.5 | Current question highlighted | Navigate to question 10 | Number 10 in navigator shows primary ring | |
| 2.6 | Navigate via grid | Click number 30 in grid | Question 30 displays, position reads "Pregunta 30 de 60" | |
| 2.7 | Next/Prev buttons | On Q1 click "Siguiente", on Q60 click "Anterior" | Goes to Q2, goes to Q59. Prev disabled on Q1, Next disabled on Q60 | |
| 2.8 | Answer count | Answer 15 questions | Footer shows "15/60 respondidas" | |
| 2.9 | Answers persist in localStorage | Answer 5 questions, check localStorage | Key `arbor-full-test-{attemptId}` exists with answers Map and currentPosition | |
| 2.10 | Math content renders | Navigate to a question with LaTeX | Fractions, exponents, square roots render correctly via MathJax | |

---

## 3. Full Test — Timer

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 3.1 | Timer format | Start test | Displays as `HH:MM:SS` (e.g. `02:30:00`) | |
| 3.2 | Normal urgency | Timer > 30 min remaining | Timer text in default gray color | |
| 3.3 | Caution urgency | Timer at 29:59 remaining | Timer text turns yellow | |
| 3.4 | Warning urgency | Timer at 9:59 remaining | Timer text turns orange | |
| 3.5 | Critical urgency | Timer at 0:59 remaining | Timer text turns red with pulse animation | |
| 3.6 | Time-up modal | Let timer reach 0:00 | Modal: "Se acabó el tiempo", "Ver resultados" button | |
| 3.7 | Time-up auto-submit | Click "Ver resultados" in modal | Submits answered questions, shows results screen | |

---

## 4. Full Test — Submit & Results

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 4.1 | Submit confirmation | Click "Enviar test" button | Modal: "¿Enviar test?" with answered count, "Volver" and "Enviar" buttons | |
| 4.2 | Unanswered warning | Have 10 unanswered, click "Enviar test" | Modal shows "10 preguntas sin responder" in amber | |
| 4.3 | Submit all answered | Answer all 60, confirm submit | Submitting screen, then results screen | |
| 4.4 | Submit partial | Answer 30 of 60, confirm submit | Submitting screen, then results with 30 unanswered counted as wrong | |
| 4.5 | Results — PAES score | View results | Big number (e.g. 650), band (e.g. 620–680), level badge | |
| 4.6 | Results — correct count | View results | Shows "{X}/60 Respuestas correctas" | |
| 4.7 | Results — axis breakdown | View results | Four axes (ALG, NUM, GEO, PROB) with progress bars and "{X}/{Y} (Z%)" | |
| 4.8 | Results — CTAs | View results | "Ver tu progreso" → `/portal/progress`, "Volver al inicio" → `/portal` | |
| 4.9 | DB — attempt completed | Check `test_attempts` row after submit | `completed_at` set, `correct_answers`, `score_percentage`, `paes_score_min`, `paes_score_max` all populated | |
| 4.10 | DB — user scores updated | Check `users` row after submit | `paes_score_min` and `paes_score_max` updated to full-test values | |
| 4.11 | DB — responses saved | Check `student_responses` for this attempt | 60 rows (one per question), each with `selected_answer`, `is_correct`, `question_index` | |
| 4.12 | localStorage cleared | Check localStorage after submit | Key `arbor-full-test-{attemptId}` removed | |

---

## 5. Full Test — Crash Recovery

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 5.1 | Resume after page refresh | Start test, answer 10 questions, hard-refresh browser, click "Comenzar Test" | Resumes same attempt (same attemptId), 10 answers restored from localStorage, timer shows remaining time (not full 150 min) | |
| 5.2 | Resume after tab close | Start test, answer 20 questions, close tab, open `/portal/test`, click start | Same behavior as 5.1 — answers and position restored | |
| 5.3 | Expired while away | Start test, wait for time to expire (or set `started_at` to >150 min ago in DB), reopen page, click start | Time-up modal appears immediately, can submit with whatever was answered | |
| 5.4 | No duplicate attempts | Start test, refresh, click start | Only ONE `test_attempts` row in DB for this test (not two) | |
| 5.5 | Clean start after completion | Complete a full test, navigate to `/portal/test`, click start | Creates a new attempt (no in-progress attempt to resume), starts fresh | |

---

## 6. Full Test — Score Recalibration

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 6.1 | PAES score accuracy | Answer 42/60 correctly, check score | `getPaesScore(42)` matches the PAES score table value | |
| 6.2 | Confidence band ±2 | Check min/max on results | `paesScoreMin = getPaesScore(40)`, `paesScoreMax = getPaesScore(44)` (±2) | |
| 6.3 | Band narrower than diagnostic | Compare full test band vs diagnostic | Full test uses ±2 questions; diagnostic uses ±5 (wider band) | |
| 6.4 | Level assignment | Check level badge | Matches `getLevel(paesScore)` from config | |
| 6.5 | Atom mastery upserted | Answer Q1 correctly (where Q1's primary atom = atom_X), check `atom_mastery` | atom_X: `is_mastered=true`, `mastery_source='practice_test'`, `status='mastered'` | |
| 6.6 | Existing mastery preserved | If atom_X was already mastered via study, answer correctly | `mastery_source` stays `'study'` (not overwritten), `first_mastered_at` unchanged | |
| 6.7 | Wrong answers don't upsert | Answer Q2 incorrectly, check its primary atoms | No new mastery rows created for those atoms | |
| 6.8 | Zero correct edge case | Answer 0/60, submit | PAES score = `getPaesScore(0)` = 100, band 100–`getPaesScore(2)` | |
| 6.9 | Perfect score edge case | Answer 60/60, submit | PAES score = `getPaesScore(60)` = 1000, band `getPaesScore(58)`–1000 | |

---

## 7. Progress Page

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 7.1 | Page loads | Navigate to `/portal/progress` | See "Tu progreso" title, history chart, projection, retest CTA, history table | |
| 7.2 | Score history — single point | Only diagnostic completed | Chart shows one amber circle point, centered, with error bars (min–max) | |
| 7.3 | Score history — multiple points | Diagnostic + 1 full test | Chart shows amber circle + emerald diamond, connected by line | |
| 7.4 | Score history — error bars | Check data points | Vertical lines from paesScoreMin to paesScoreMax for each point | |
| 7.5 | Chart legend | View below chart | "Diagnóstico corto" (amber circle), "Test completo" (emerald diamond) | |
| 7.6 | Target line | Student has a goal set | Horizontal dashed green line with "Meta" label | |
| 7.7 | Projection — default | Page loads | Projection chart visible with 10 atoms/week selected, shows "= 200 minutos por semana" | |
| 7.8 | Projection — slider | Click "5" button | Chart updates (after 400ms debounce), shows "= 100 minutos por semana" | |
| 7.9 | Projection — all steps | Click each step [2, 5, 10, 15, 20] | Each updates the chart and minutes text correctly | |
| 7.10 | Projection — governance cap | Check projection line | Never exceeds current `paesScoreMax` (diagnostic ceiling) | |
| 7.11 | Projection — weeks to target | If projection reaches target | Green vertical line at intersection, text "Alcanzas tu meta en ~X semanas" | |
| 7.12 | Projection — governance note | View below chart | Small text: "Proyección limitada por tu último test. Un test completo puede subir el techo." | |
| 7.13 | Retest CTA — eligible + recommended | >= 30 atoms mastered since last test | Green banner: "Te recomendamos hacer un test completo", CTA button to `/portal/test` | |
| 7.14 | Retest CTA — eligible only | 18-29 atoms mastered | Soft banner: "Ya puedes tomar un test completo", link to `/portal/test` | |
| 7.15 | Retest CTA — not eligible | < 18 atoms mastered | Progress bar: "X/18 conceptos para desbloquear", blocked reason text if applicable | |
| 7.16 | Test history table | Multiple tests completed | Table with Fecha, Tipo (badges), Puntaje, Correctas columns, most recent first | |
| 7.17 | Type badges | View table | "Diagnóstico" in amber, "Test completo" in emerald | |
| 7.18 | Empty state | No completed tests with PAES scores | "Aún no tienes tests completados" message in history section | |

---

## 8. Dashboard Integration

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 8.1 | Source banner — short diagnostic | Student only has diagnostic | Banner: "Estimado desde diagnóstico corto" (amber) | |
| 8.2 | Source banner — full test | Student completed a full test | Banner: "Basado en test completo" (emerald) | |
| 8.3 | Source banner — eligible + recommended | >= 30 study-mastered atoms | Banner links to `/portal/test`: "Te recomendamos un test completo" | |
| 8.4 | Source banner — eligible only | 18-29 study-mastered atoms | Banner links to `/portal/test`: "Ya puedes tomar un test completo" | |
| 8.5 | Source banner — not eligible | < 18 study-mastered atoms | Banner shows "X/18 conceptos para desbloquear test completo" | |
| 8.6 | Progress link card | View dashboard | "Proyección y progreso" card visible, links to `/portal/progress` | |
| 8.7 | Effort slider removed | View dashboard | No "Esfuerzo semanal" slider or projected score section | |
| 8.8 | Details section removed | View dashboard | No "Ver detalle y escenarios" expandable section | |
| 8.9 | Score updates after full test | Complete full test, return to dashboard | PAES score range reflects the narrower full-test band | |

---

## 9. Navigation

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 9.1 | Progreso nav item | View bottom nav bar | "Progreso" tab visible with bar-chart icon between "Estudiar" and "Metas" | |
| 9.2 | Progreso active state | Navigate to `/portal/progress` | "Progreso" tab highlighted/active | |
| 9.3 | Nav items order | View all tabs | Inicio, Estudiar, Progreso, Metas (in that order) | |
| 9.4 | Progreso link from dashboard | Click "Proyección y progreso" card | Navigates to `/portal/progress` | |
| 9.5 | Progress link from results | Complete full test, click "Ver tu progreso" | Navigates to `/portal/progress` | |
| 9.6 | Test link from progress CTA | On progress page, click retest CTA | Navigates to `/portal/test` | |
| 9.7 | Test link from dashboard banner | Dashboard banner shows eligible CTA | Click navigates to `/portal/test` | |

---

## 10. Retest Gating — Edge Cases

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 10.1 | First-time student | Student never did diagnostic | Cannot access full test (must have diagnostic first) | |
| 10.2 | Immediately after diagnostic | Complete diagnostic, check eligibility | Not eligible: 0/18 atoms mastered via study | |
| 10.3 | Threshold boundary — 17 atoms | Master 17 atoms via study | Not eligible, shows "Necesitas dominar 1 conceptos más" | |
| 10.4 | Threshold boundary — 18 atoms | Master 18th atom via study | Eligible, not recommended | |
| 10.5 | Threshold boundary — 30 atoms | Master 30th atom via study | Eligible AND recommended | |
| 10.6 | Spacing — day 6 | Complete full test, wait 6 days | Not eligible: "Espera 1 días más entre tests" | |
| 10.7 | Spacing — day 7 | Complete full test, wait 7 days | Eligible (spacing cleared) | |
| 10.8 | Monthly cap — 3rd test | Complete 3 tests in 30 days | Not eligible: "Máximo de tests mensuales alcanzado" | |
| 10.9 | Monthly cap — after 30 days | Complete 3 tests, wait 31 days | Cap resets, can take another test | |
| 10.10 | Study mastery only | Master atoms via `practice_test` source | Does NOT count toward 18-atom threshold (only `study` counts) | |
| 10.11 | Atoms reset after full test | Complete full test, check count | `atomsMasteredSinceLastTest` resets — only counts atoms mastered AFTER the test date | |

---

## 11. Score History & Projection — Edge Cases

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 11.1 | No score data | New student, no tests | History: empty state. Projection: "No hay datos suficientes" | |
| 11.2 | Diagnostic only | One short diagnostic | History: single amber point. Projection: works with diagnostic ceiling | |
| 11.3 | Governance cap in effect | Check projection | All projection points capped at `paesScoreMax` from users table | |
| 11.4 | Governance cap lifts | Complete full test with higher max → check progress page | New projection ceiling = new `paesScoreMax`, projection extends higher | |
| 11.5 | Zero atoms remaining | Student mastered all relevant atoms | Projection curve flattens (no more improvement possible) | |
| 11.6 | Atoms per week = 2 | Select "2" on slider | Projection extends further (slower pace), more weeks to target | |
| 11.7 | Atoms per week = 20 | Select "20" on slider | Projection rises faster, fewer weeks to target | |
| 11.8 | Multiple diagnostics + tests | Complete 2 diagnostics + 2 full tests | History chart shows 4 points in chronological order, correct shapes | |
| 11.9 | Score regression | Full test score lower than diagnostic | Chart shows decline (this is valid — honest assessment) | |

---

## 12. Diagnostic Complete — PAES Score Backfill

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 12.1 | Diagnostic saves PAES scores | Complete short diagnostic | `test_attempts` row has `paes_score_min` and `paes_score_max` set | |
| 12.2 | Diagnostic appears in history | Complete diagnostic, visit `/portal/progress` | Score history shows the diagnostic data point with correct min/max/mid | |
| 12.3 | Old diagnostic without scores | If old attempt has NULL paes_scores | That attempt does NOT appear in score history (filtered by `paes_score_min IS NOT NULL`) | |

---

## 13. Axis Performance

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 13.1 | All axes represented | Complete full test | Results show ALG, NUM, GEO, PROB breakdown (axes with 0 questions skipped) | |
| 13.2 | Axis accuracy | Get 10/15 ALG correct | ALG shows "10/15 (67%)" with proportional bar | |
| 13.3 | Zero in one axis | Get 0/10 in GEO | GEO shows "0/10 (0%)" with empty bar | |
| 13.4 | Perfect axis | Get 20/20 in NUM | NUM shows "20/20 (100%)" with full bar | |

---

## 14. Cross-Feature Integration

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 14.1 | Diagnostic → study → full test → dashboard | Complete diagnostic, master 18+ atoms, take full test | Dashboard updates: source banner shows "Basado en test completo", score band narrows | |
| 14.2 | Full test mastery → next action | Complete full test (atoms mastered via practice_test) | `nextAction` does NOT recommend reviewing those atoms as "newly mastered via study" | |
| 14.3 | Full test mastery ≠ retest gating | Master atoms ONLY via full test | Retest gating still shows 0/18 (only `study` source counts) | |
| 14.4 | Score governance after full test | Complete full test with higher ceiling, check projection | Projection curve can now reach higher scores | |
| 14.5 | Multiple full tests | Complete 2 full tests over time | Both appear in progress history, dashboard uses latest score | |
| 14.6 | Retest CTA disappears after test | Take full test from progress page CTA | After completion, retest CTA resets (0/18 atoms needed again) | |
| 14.7 | questionsUnlocked updates | Master atoms via study, check dashboard | "Preguntas PAES desbloqueadas" metric increases | |
| 14.8 | Mastery percentage scoped | Master non-PAES atoms | Mastery % on dashboard doesn't change (scoped to ~205 relevant atoms) | |

---

## 15. Error Handling

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 15.1 | Unauthenticated — start | Call POST `/api/student/full-test/start` without auth | 401 response | |
| 15.2 | Unauthenticated — answer | Call POST `/api/student/full-test/answer` without auth | 401 response | |
| 15.3 | Unauthenticated — complete | Call POST `/api/student/full-test/complete` without auth | 401 response | |
| 15.4 | Unauthenticated — progress | Call GET `/api/student/progress` without auth | 401 response | |
| 15.5 | Wrong attempt owner | Call complete with another user's attemptId | 404 "Test attempt not found" | |
| 15.6 | Missing fields — answer | POST answer without `questionId` | 400 "Missing required fields" | |
| 15.7 | Missing fields — complete | POST complete without `attemptId` | 400 "Missing required fields" | |
| 15.8 | Server error display | Simulate API failure | Error message shown on pre-test screen in red | |
| 15.9 | Submit failure recovery | Complete API fails during submit | Returns to in-progress screen with error, answers preserved | |

---

## 16. Previously Implemented Features (Regression)

These features were built in earlier sprints. Verify they still work after
the full test + dashboard changes.

| # | Scenario | Steps | Expected | Result |
|---|----------|-------|----------|--------|
| 16.1 | Short diagnostic flow | Navigate to `/diagnostico`, complete 16 questions | Score calculated, results shown, profile saved | |
| 16.2 | Study flow — mini-clase | Go to `/portal/study?atom=...`, study an atom | Lesson, questions, mastery tracked | |
| 16.3 | SR review flow | `/portal/study?mode=review` when due | Review questions for mastered atoms | |
| 16.4 | Prereq scan flow | `/portal/study?scan=...` | Scan prerequisite atoms for mastery | |
| 16.5 | Daily streak badge | Study something, check dashboard | Streak badge shows current day count | |
| 16.6 | Weekly mission | Complete atom masteries, check dashboard | Mission progress increments (incl. mastery credit) | |
| 16.7 | Milestone banners | Master enough atoms for a milestone | Banner animation shown | |
| 16.8 | Goals page | Navigate to `/portal/goals` | Set target universities, see required scores | |
| 16.9 | Cooldown after failure | Fail an atom, try again | 30-min cooldown enforced, timer shown | |
| 16.10 | Learning path display | Check dashboard learning path section | Shows next atoms to study, competitive fork if applicable | |
| 16.11 | Habit quality guard | Study >6 atoms in a session | Diminishing returns warning shown | |

---

## Test Environment Notes

- **Reset student state:** To test specific scenarios, you can modify
  `atom_mastery`, `test_attempts`, and `users` rows directly in the database.
  Just remember: schema changes must go through drizzle, but test DATA
  manipulation for testing is fine with `psql`.

- **Time-sensitive tests:** For timer tests (3.2–3.6), you may need to
  adjust `started_at` in `test_attempts` to simulate elapsed time.

- **Monthly cap test (10.8):** Requires 3 full tests in 30 days. You can
  insert `test_attempts` rows with `test_id` set and recent `completed_at`
  dates to simulate this without running 3 full tests.

- **Retest gating shortcuts:** Insert rows into `atom_mastery` with
  `mastery_source='study'` and recent `updated_at` to quickly reach the
  18-atom or 30-atom thresholds.

---

## Summary

| Section | Tests | Critical? |
|---------|-------|-----------|
| 1. Start Flow | 10 | Yes |
| 2. In-Progress | 10 | Yes |
| 3. Timer | 7 | Yes |
| 4. Submit & Results | 12 | Yes |
| 5. Crash Recovery | 5 | Yes |
| 6. Score Recalibration | 9 | Yes |
| 7. Progress Page | 18 | Yes |
| 8. Dashboard Integration | 9 | Yes |
| 9. Navigation | 7 | Medium |
| 10. Retest Gating | 11 | Yes |
| 11. Score History Edge Cases | 9 | Medium |
| 12. Diagnostic Backfill | 3 | Medium |
| 13. Axis Performance | 4 | Medium |
| 14. Cross-Feature Integration | 8 | Yes |
| 15. Error Handling | 9 | Medium |
| 16. Regression | 11 | Yes |
| **Total** | **142** | |
