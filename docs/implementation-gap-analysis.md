# Implementation Gap Analysis

> Audit of what the [Arbor Learning System Spec](./arbor-learning-system-spec.md)
> describes vs. what actually works end-to-end in the student portal.
>
> Use this document to plan and prioritize implementation work.

**Audited:** March 10, 2026 (sixth pass — deep DRY/SOLID cleanup)

---

## Summary

| Feature | Backend | API | Frontend | E2E Status |
|---|---|---|---|---|
| Short diagnostic (16 questions) | Done | Done | Done | **Working** |
| Mini-clase mastery (`?atom=`) | Done | Done | Done | **Working** |
| Mastery algorithm (streaks, difficulty ladder) | Done | — | — | **Working** |
| Score prediction (dynamic recomputation) | Done | Done | Done | **Working** |
| Score prediction governance (diagnostic cap) | Done | — | — | **Working** |
| Diagnostic source banner (honest copy) | Done | Done | Done | **Working** |
| Streak badge (daily streak + max streak) | Done | Done | Done | **Working** |
| Rich feedback (questionsUnlocked, nextAtom) | Done | Done | Done | **Working** |
| Misión semanal (incl. mastery credit) | Done | Done | Done | **Working** |
| Milestone banners | Done | Done | Done | **Working** |
| Habit quality guard (fatigue, diminishing returns) | Done | Done | Done | **Working** |
| 3-hop implicit SR credit | Done | — | — | **Working** |
| SR balance rule (review after N masteries) | Done | Done | Done | **Working** |
| Learning path + competitive route fork | Done | Done | Done | **Working** |
| Goals / planning page | Done | Done | Done | **Working** |
| Auth middleware (portal + API protection) | Done | — | — | **Working** |
| SR review flow (`?mode=review`) | Done | Done | Done | **Working** |
| Prereq scan flow (`?scan=`) | Done | Done | Done | **Working** |
| Cooldown after failure | Done | Done | Done | **Working** |
| Full timed test / retest | **Missing** | **Missing** | **Missing** | **Not built** |
| Real daily streak tracking | Done | Done | Done | **Working** |
| Error handling on 3 API routes | — | Done | — | **Working** |
| Scoped mastery metrics (spec 10.3) | Done | Done | Done | **Working** |
| Dashboard questionsUnlocked (spec 10.2) | Done | Done | Done | **Working** |
| DRY shared modules (SOLID) | Done | — | — | **Working** |
| DRY deep cleanup (formatters, types, dates, skeletons) | Done | — | — | **Working** |

---

## ~~Priority 1 — Runtime Crashes~~ RESOLVED

### 1A. FK Mismatch in Review + Prereq Scan — FIXED (March 10)

Switched both flows to `generated_questions`. Shared `questionQueries.ts`
helper created. **Verify 5D** (below) for data coverage.

---

## ~~Priority 2 — Logic Bugs~~ RESOLVED

### 2A. Cooldown Not Enforced After Failure — FIXED (March 10)

Cooldown enforced at 4 levels: session creation blocked, next-action
filtering, next-study-atom filtering, dynamic UI count. Files:
`atomMasteryEngine`, `nextAction`, `masteryLifecycle`,
`prerequisiteScan`, `AtomResultPanel`, `AtomStudyView`.

---

## Priority 3 — Missing Features (3B resolved, 3A remaining)

### 3A. Full Timed Test (Retest)

**Spec ref:** Section 8 — Retest Gating

**What's built:**
- `retestGating.ts` — complete gating logic: eligibility (18 atoms
  mastered), recommendation (30 atoms), 7-day spacing, 3 tests/month cap
- `retestStatus` payload computed in `dashboardM1.ts`
- `DiagnosticSourceBanner` shows "Pronto podrás tomar un test completo"

**What's missing:**
- No full test page or route (`/diagnostico?mode=full` does nothing)
- No test creation flow — `POST /api/diagnostic/start` never sets
  `testId`; all attempts have `test_id IS NULL`
- No `tests` table row for a full PAES mock test (50+ questions, 2h 30m)
- No score recalibration flow after a full test (updating
  `paesScoreMin`/`paesScoreMax` with higher confidence)
- `retestStatus` is never surfaced as an actionable CTA in the UI

**This is a large feature.** The short diagnostic (16 questions) works and
honestly labels itself. The banner copy says "Pronto podrás..." which is
fine for launch. Build the full test as a follow-up project.

**Work needed (when ready):**
1. Design the full test question set (50+ questions across all axes)
2. Build a timed test UI with progress tracking and auto-submit
3. Add `?mode=full` handling in the diagnostic page
4. Create test sessions with `testId` set for proper gating
5. Score recalibration on completion (higher confidence bounds)
6. Surface `retestStatus` CTA in the dashboard when eligible

---

### 3B. Real Daily Streak Tracking — FIXED (March 10)

Schema columns on `users` + `streakTracker.ts` module + `StreakBadge`
component. Hooked into mastery engine and sprint completion. Streak
freeze (1/week) not implemented — spec marks it as optional.

---

## ~~Priority 4 — API Hardening~~ RESOLVED

### 4A. Missing Error Handling on 3 Routes — FIXED (March 10)

try/catch + `studentApiError()` on goals, me, simulator routes.
Simulator also migrated to `studentApiSuccess`/`studentApiError`.

---

## Priority 5 — Data Verification (Pre-Launch Checklist)

These are not code changes but must be confirmed before production.

### 5A. Generated Questions Coverage

The atom study flow (`?atom=`) queries `generated_questions` filtered by
`atomId` + `difficultyLevel`. If an atom has no generated questions, the
student hits `"No questions available for this atom"`.

**Verify:**
- Every atom suggested by the learning path has rows in
  `generated_questions`
- Minimum 3 questions per difficulty level (easy/medium/hard) = 9+ total
  per atom
- QTI XML is valid and parseable

```sql
SELECT a.id, a.title,
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'easy') AS easy,
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'medium') AS medium,
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'high') AS hard
FROM atoms a
LEFT JOIN generated_questions gq ON gq.atom_id = a.id
GROUP BY a.id, a.title
HAVING COUNT(*) < 9 OR
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'easy') = 0 OR
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'medium') = 0 OR
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'high') = 0
ORDER BY COUNT(*);
```

### 5B. Prerequisite IDs Populated

The learning path, implicit repetition, prereq scan, and cooldown flows
all depend on `atoms.prerequisite_ids` being populated.

**Verify:**
- Atoms that should have prerequisites actually have the array filled
- Referenced prerequisite atom IDs exist in the `atoms` table

```sql
SELECT a.id, a.title, a.prerequisite_ids
FROM atoms a
WHERE a.prerequisite_ids IS NOT NULL
  AND array_length(a.prerequisite_ids, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(a.prerequisite_ids) AS pid
    WHERE pid NOT IN (SELECT id FROM atoms)
  );
```

### 5C. Lessons Coverage

The atom study flow checks for a lesson before questions. Missing lessons
are fine (the flow skips to questions), but important atoms should have
lesson content.

**Verify:**
- Key atoms in the recommended learning path have lesson content
- `lessons.lesson_html` is non-null and non-empty

### 5D. Review/Scan Question Coverage (After FK Fix)

After fixing Priority 1A, review and prereq scan will use
`generated_questions` (if Option A). Verify that atoms reachable via
review or prereq scan have high-difficulty generated questions.

```sql
SELECT a.id, a.title,
  COUNT(*) FILTER (WHERE gq.difficulty_level = 'high') AS hard_questions
FROM atoms a
LEFT JOIN generated_questions gq ON gq.atom_id = a.id
WHERE a.id IN (
  SELECT atom_id FROM atom_mastery WHERE is_mastered = true
)
GROUP BY a.id, a.title
HAVING COUNT(*) FILTER (WHERE gq.difficulty_level = 'high') = 0;
```

---

## ~~Priority 6 — DRY / SOLID Refactor~~ RESOLVED

### 6A. Mission Not Credited on Mastery — FIXED (March 10, 2026)

**Bug:** `incrementMissionProgress()` was only called from
`completeStudySprint()`. Students who mastered atoms via the regular
mini-clase flow (the primary learning path) never received mission
progress credit.

**Resolution:** Added `incrementMissionProgress(userId)` call to the
mastery completion path in `atomMasteryEngine.ts → submitAnswer()`.

**Files changed:**
- `web/lib/student/atomMasteryEngine.ts` — added import + call to
  `incrementMissionProgress` after mastery

---

### 6B. Mastered Atoms Not Scoped to Relevant Set — FIXED (March 10, 2026)

**Spec ref:** Section 10.3 — Scoping Rule

**Bug:** `metricsService.ts` counted ALL mastered atoms for the user,
including atoms outside the relevant set (~205 PAES-linked atoms). The
denominator was correctly scoped but the numerator wasn't, inflating
`masteryPercentage` when students mastered non-PAES-linked atoms.

**Resolution:** Combined the relevant atoms CTE with the mastered count
into a single query that computes both `total` and `mastered` in one pass,
scoped to the relevant atom set.

**Files changed:**
- `web/lib/student/metricsService.ts` — single CTE query for both
  `totalRelevantAtoms` and `masteredAtoms` (scoped)

---

### 6C. Dashboard Missing `questionsUnlocked` Metric — FIXED (March 10, 2026)

**Spec ref:** Section 10.2 — Core Metrics

**Gap:** `metricsService.ts` computed `questionsUnlocked` but it was never
included in `M1DashboardData` or the frontend payload. The progress section
showed "Conceptos dominados" and "% avance" but not "Preguntas PAES
desbloqueadas".

**Resolution:** Added `questionsUnlocked` and `totalOfficialQuestions` to
the `confidence` block of `M1DashboardData`, `DashboardPayload`, and
`DashboardProgressSection`. The progress grid is now 3-column with the
new metric displayed in amber styling.

**Files changed:**
- `web/lib/student/dashboardM1.ts` — added fields to type + both
  dashboard builders
- `web/app/portal/types.ts` — added fields to `DashboardPayload`
- `web/app/portal/DashboardSections.tsx` — new "Preguntas PAES
  desbloqueadas" card in progress section (3-column grid)

---

### 6D. DRY Refactor — Shared Modules — DONE (March 10, 2026)

**Problem:** Several functions were duplicated across multiple files,
violating DRY and SOLID principles.

**Changes:**

1. **`normalizeAnswer()`** — was duplicated in 4 files (atomMasteryEngine,
   spacedRepetition, prerequisiteScan, studySprints). Extracted to
   `questionQueries.ts` and imported everywhere.

2. **`verifyOwnership()`** — was duplicated in atomMasteryEngine and
   prerequisiteScan. Extracted as `verifySessionOwnership()` in new
   `sessionQueries.ts` module.

3. **`getUserDiagnosticSnapshot()` + `getMasteryRows()`** — were duplicated
   across nextAction, dashboardM1, and studySprints (3 files, 5 functions).
   Extracted to new `userQueries.ts` module with a single `MasteryRow`
   type that includes cooldown field (superset used by all callers).

**New shared modules:**
- `web/lib/student/sessionQueries.ts` — `verifySessionOwnership()`
- `web/lib/student/userQueries.ts` — `getUserDiagnosticSnapshot()`,
  `getMasteryRows()`, types `DiagnosticSnapshot`, `MasteryRow`
- `web/lib/student/questionQueries.ts` — added `normalizeAnswer()`

**Files updated (imports consolidated):**
- `web/lib/student/atomMasteryEngine.ts`
- `web/lib/student/spacedRepetition.ts`
- `web/lib/student/prerequisiteScan.ts`
- `web/lib/student/studySprints.ts`
- `web/lib/student/nextAction.ts`
- `web/lib/student/dashboardM1.ts`

---

## ~~Priority 7 — Deep DRY/SOLID Cleanup~~ RESOLVED

### 7A. `formatMinutes` Duplicated 3× — FIXED (March 10, 2026)

**Problem:** `formatMinutes()` was copy-pasted in `NextActionSection.tsx`,
`LearningPathSection.tsx`, and `formatters.ts`. The canonical version in
`formatters.ts` uses `toLocaleString("es-CL")` for proper Spanish
formatting; the copies did not.

**Resolution:** Deleted local copies. Both components now import
`formatMinutes` from `formatters.ts`.

**Files changed:**
- `web/app/portal/NextActionSection.tsx` — removed local function,
  added import from `formatters.ts`
- `web/app/portal/LearningPathSection.tsx` — removed local function,
  added import from `formatters.ts`

---

### 7B. `ApiEnvelope` Type Duplicated — FIXED (March 10, 2026)

**Problem:** `portal/types.ts` defined its own `ApiEnvelope<T>` type
(without the `details?` field), while `apiClientEnvelope.ts` had the
canonical version. Two definitions → drift risk.

**Resolution:** Replaced local definition in `portal/types.ts` with a
re-export from `apiClientEnvelope.ts`. All downstream imports unchanged.

**Files changed:**
- `web/app/portal/types.ts` — removed local `ApiEnvelope` + helper
  types; re-exports from `apiClientEnvelope.ts`

---

### 7C. Error Message Extraction Duplicated 3× — FIXED (March 10, 2026)

**Problem:** Three implementations of the same error-message extraction:
- `apiClientEnvelope.ts` → `resolveApiErrorMessage()` (canonical)
- `formatters.ts` → `getErrorMessage()` (identical logic)
- `study/types.ts` → `resolveErrorMessage()` (thin wrapper)

**Resolution:**
- `formatters.ts` now re-exports `resolveApiErrorMessage` as
  `getErrorMessage` (preserves call-site compatibility)
- `study/types.ts` now re-exports `resolveApiErrorMessage` directly
  (removed wrapper function)
- `study/api.ts` updated to import `resolveApiErrorMessage` from types

**Files changed:**
- `web/app/portal/formatters.ts` — replaced function body with re-export
- `web/app/portal/study/types.ts` — removed `resolveErrorMessage`
  wrapper; added direct re-export of `resolveApiErrorMessage`
- `web/app/portal/study/api.ts` — updated 4 call sites from
  `resolveErrorMessage` → `resolveApiErrorMessage`

---

### 7D. Date/Week Helpers Duplicated 3× — FIXED (March 10, 2026)

**Problem:** `toDateOnly()`, `currentWeekStartDate()`, and
`getCurrentWeekRange()` were each implemented independently in
`journeyState.ts`, `missions.ts`, and `funnelReport.ts`. All three
computed the same ISO Monday-start week.

**Resolution:** Created `web/lib/shared/dateHelpers.ts` with all three
functions. Updated the three consumers to import from it.

**New shared module:**
- `web/lib/shared/dateHelpers.ts` — `toDateOnly()`,
  `currentWeekStartDate()`, `getCurrentWeekRange()`

**Files updated (imports consolidated):**
- `web/lib/student/journeyState.ts`
- `web/lib/student/missions.ts`
- `web/lib/analytics/funnelReport.ts`

---

### 7E. Skeleton Components Duplicated — FIXED (March 10, 2026)

**Problem:** `PrereqScanView.tsx` and `ReviewSessionView.tsx` each had
identical `ScanSkeleton` / `ReviewSkeleton` components (same markup,
same structure).

**Resolution:** Extracted `QuestionSkeleton` to the shared components
barrel. Both views now import from `../components`.

**New shared component:**
- `web/app/portal/components/QuestionSkeleton.tsx`

**Files updated:**
- `web/app/portal/study/PrereqScanView.tsx` — replaced `ScanSkeleton`
- `web/app/portal/study/ReviewSessionView.tsx` — replaced
  `ReviewSkeleton`
- `web/app/portal/components/index.ts` — added barrel export

---

### 7F. Unused `SESSION_MINUTES` Constant — FIXED (March 10, 2026)

**Problem:** `NextActionSection.tsx` declared `SESSION_MINUTES = 25` and
immediately assigned it to `minutes`, adding indirection with no value.

**Resolution:** Replaced with inline literal `const minutes = 25`.

**Files changed:**
- `web/app/portal/NextActionSection.tsx`

---

## Previously Completed

### Sprint 6 — March 10, 2026

- ✅ **`formatMinutes` dedup** (7A) — removed 2 local copies; both
  sections now import from `formatters.ts`
- ✅ **`ApiEnvelope` type dedup** (7B) — `portal/types.ts` re-exports
  from `apiClientEnvelope.ts`; removed 16 lines of redundant type defs
- ✅ **Error extraction dedup** (7C) — eliminated 2 duplicate
  implementations; single canonical `resolveApiErrorMessage`
- ✅ **Date helper dedup** (7D) — new `lib/shared/dateHelpers.ts`;
  removed 3 independent implementations across 3 files
- ✅ **Skeleton dedup** (7E) — new `QuestionSkeleton` shared component;
  removed 2 identical skeleton components
- ✅ **Unused constant cleanup** (7F) — removed `SESSION_MINUTES`
  indirection in `NextActionSection`

### Sprint 5 — March 10, 2026

- ✅ **Mission credit on mastery** (6A) — `incrementMissionProgress`
  called in mastery engine; students get weekly mission progress on
  every mastered atom, not just study sprints
- ✅ **Scoped mastery metrics** (6B) — `metricsService.ts` now counts
  mastered atoms only within the relevant PAES-linked set (~205 atoms)
- ✅ **Dashboard questionsUnlocked** (6C) — "Preguntas PAES
  desbloqueadas" metric added to dashboard progress section
- ✅ **DRY refactor** (6D) — extracted `normalizeAnswer`, `verifySession-
  Ownership`, `getUserDiagnosticSnapshot`, `getMasteryRows` to shared
  modules; eliminated 9 function duplicates across 6 files

### Sprint 2–4 — March 6–10, 2026

- ✅ Sprint 4: Daily streak tracking (3B) — schema + backend + frontend
- ✅ Sprint 3: FK mismatch fix (1A), cooldown enforcement (2A), API
  error handling (4A)
- ✅ Sprint 2: SR review flow, prereq scan flow, diagnostic banner,
  streak badge, rich feedback, score governance, 3-hop implicit SR,
  SR balance rule, habit quality guard

---

## Remaining Work — Recommended Execution Order

1. **Verify data coverage** (5A-5D) — run the SQL queries before any
   real students use the system. Especially important now that review
   and prereq scan use `generated_questions` (need high-difficulty
   questions for all atoms).
2. **Full timed test** (3A) — large feature: test data, creation API,
   timed UI, score recalibration, retest CTA. Banner copy is honest;
   ship without it.
