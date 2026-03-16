# Implementation Gap Analysis

> Audit of what the [Arbor Learning System Spec](./arbor-learning-system-spec.md)
> describes vs. what actually works end-to-end in the student portal.
>
> Use this document to plan and prioritize implementation work.

**Audited:** March 10, 2026 (seventh pass — data coverage verification)

---

## Summary

| Feature | Backend | API | Frontend | E2E Status |
|---|---|---|---|---|
| Short diagnostic (16 questions) | Done | Done | Done | **Working** |
| Mini-clase mastery (`?atom=`) | Done | Done | Done | **Working** |
| Mastery algorithm (streaks, difficulty ladder) | Done | — | — | **Working** |
| Score prediction (dynamic recomputation) | Done | Done | Done | **Working** |
| Score prediction governance (knowledge-based) | Done | — | — | **Working** |
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
| Full timed test / retest | Done | Done | Done | **Working** |
| Real daily streak tracking | Done | Done | Done | **Working** |
| Error handling on 3 API routes | — | Done | — | **Working** |
| Scoped mastery metrics (spec 10.3) | Done | Done | Done | **Working** |
| Dashboard questionsUnlocked (spec 10.2) | Done | Done | Done | **Working** |
| DRY shared modules (SOLID) | Done | — | — | **Working** |
| DRY deep cleanup (formatters, types, dates, skeletons) | Done | — | — | **Working** |
| Data coverage verification (5A–5D) | Done | — | — | **Verified** |

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

## ~~Priority 3 — Missing Features~~ RESOLVED

### 3A. Full Timed Test (Retest) — FIXED (March 10, 2026)

**Spec ref:** Section 8 — Retest Gating

Full implementation across three passes:

**Pass 1 (Backend):** Schema change (`paesScoreMin`/`paesScoreMax` on
`testAttempts`), `fullTest.ts` (test selection, question resolution with
alternate-first logic, score recalibration + atom mastery upsert),
`scoreHistory.ts` (score history query, simulation-based projection metadata). Four API routes: `POST /api/student/full-test/start`,
`POST /api/student/full-test/answer`, `POST /api/student/full-test/complete`,
`GET /api/student/progress`.

**Pass 2 (Test UI):** `/portal/test` page with `FullTestClient` state
machine (pre-test → in-progress → submitting → time-up → results),
`useFullTestFlow` hook with localStorage crash recovery and batch answer
saving, `useFullTestTimer` hook with urgency levels. Question navigator,
QTI rendering with MathJax, confirm dialog, time-up modal, and results
screen with per-axis breakdown.

**Pass 3 (Progress + Dashboard):** `/portal/progress` page with mastery
hero ring, axis breakdown cards, projection card with hours-per-week
slider (client-side computation), retest CTA section, and test history table. Dashboard updated: removed
effort slider and details section, added progress link card. Updated
`DiagnosticSourceBanner` to show actionable retest CTAs based on
`retestStatus`. Added "Progreso" to portal navigation.

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

## ~~Priority 5 — Data Verification~~ VERIFIED (March 10, 2026)

All checks pass for the relevant learning path (~205 atoms).

### 5A. Generated Questions Coverage — PASS

- 238 total atoms in DB; 33 have zero generated questions
- **All 33 are outside the relevant learning path** (not linked to any
  official PAES question and not a prerequisite of one)
- Every atom in the active learning path has ≥9 questions (3+ per
  difficulty level: low/medium/high)

### 5B. Prerequisite IDs Populated — PASS

- 184 atoms have `prerequisite_ids` set
- Zero dangling references — every referenced prerequisite ID exists in
  the `atoms` table

### 5C. Lessons Coverage — PASS (for relevant atoms)

- 205/238 atoms have lesson content (86.1%)
- The 33 atoms without lessons are the same 33 outside the relevant set
- **All 205 relevant learning path atoms have lesson content**

### 5D. Review/Scan Question Coverage — PASS

- 143 distinct mastered atoms across all users
- All 143 have high-difficulty generated questions available for
  review and prereq scan flows

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

**Resolution:** Removed the constant; `studyMinutes` is now passed as a prop
from `LearningPathSection`, sourced from `MINUTES_PER_ATOM` (20 min).

**Files changed:**
- `web/app/portal/NextActionSection.tsx`

---

## Previously Completed

### Sprint 8 — March 10, 2026

- Full timed test implementation (3A) — backend, test UI, progress
  page, dashboard updates, navigation. Three passes: schema + APIs,
  timed test UI with state machine, progress page + dashboard cleanup.

### Sprint 7 — March 10, 2026

- ✅ **Data coverage verification** (5A–5D) — all 205 relevant atoms
  have questions (3+ per difficulty), valid prereq IDs, lesson content,
  and high-difficulty questions for review/scan. The 33 atoms outside
  the relevant set are not reachable by the learning path.

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

## Remaining Work

No remaining implementation gaps. All features from the spec are built.
