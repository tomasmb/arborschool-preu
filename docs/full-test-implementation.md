# Full Timed PAES Test — Implementation Tracker

> Multi-session implementation guide for the full timed test feature.
> Check off tasks as you complete them. Each pass is independently testable.
>
> **Spec refs:** [arbor-learning-system-spec.md](./arbor-learning-system-spec.md) §8-9,
> [student-portal-high-level-spec.md](./student-portal-high-level-spec.md) §Full-Test Cadence Policy + §Improvement Prediction Module

**Created:** March 10, 2026

---

## Summary

| Pass | Scope | Status |
|------|-------|--------|
| Pass 1 | Backend + Schema | **Done** |
| Pass 2 | Full Test UI (`/portal/test`) | **Done** |
| Pass 3 | Progress Page + Dashboard (`/portal/progress`) | **Done** |

---

## Principles (Apply Everywhere)

- **SOLID/DRY**: All business logic in dedicated `web/lib/student/` modules.
  API routes are thin wrappers (auth + validate + delegate + envelope).
- **Reuse existing modules** — never duplicate:
  - `retestGating.ts` — gating checks
  - `paesScoreTable.ts` — PAES score conversion (`getPaesScore`, `estimateCorrectFromScore`, `calculateImprovement`)
  - `scoringConstants.ts` — `EFFECTIVE_MINUTES_PER_ATOM` (38), `NUM_OFFICIAL_TESTS` (4)
  - `questionQueries.ts` — `normalizeAnswer()`
  - `userQueries.ts` — `getUserDiagnosticSnapshot()`, `getMasteryRows()`
  - `metricsService.ts` — `getStudentMetrics()`
  - `apiAuth.ts` — `requireAuthenticatedStudentUser()`
  - `apiClientEnvelope.ts` — `ApiEnvelope<T>` type
- **Question resolution rule**: Always prefer alternate questions (`source = 'alternate'`,
  matched via `parent_question_id`). Fall back to official originals when no alternate exists.
- **Only serve complete tests**: A test is "complete" when its available question count
  (originals + alternates) >= `tests.question_count`. Partial tests are never served.
- **Files < 500 lines, lines < 150 chars.**

---

## File Inventory

### New Files

| File | Pass | Purpose |
|------|------|---------|
| `web/lib/student/fullTest.ts` | 1 | Test selection, question resolution, score recalibration |
| `web/lib/student/scoreHistory.ts` | 1 | Score history query, projection metadata builder |
| `web/app/api/student/full-test/start/route.ts` | 1 | Start full test API |
| `web/app/api/student/full-test/answer/route.ts` | 1 | Record answer API |
| `web/app/api/student/full-test/complete/route.ts` | 1 | Complete + recalibrate API |
| `web/app/api/student/progress/route.ts` | 1 | Score history + projection metadata API |
| `web/app/portal/test/page.tsx` | 2 | Server component for test page |
| `web/app/portal/test/FullTestClient.tsx` | 2 | Client component — test state machine |
| `web/app/portal/test/useFullTestFlow.ts` | 2 | State management hook |
| `web/app/portal/test/useFullTestTimer.ts` | 2 | Timer hook (adapted from diagnostic) |
| `web/app/portal/progress/page.tsx` | 3 | Server component for progress page |
| `web/app/portal/progress/ProgressClient.tsx` | 3 | Client component — mastery metrics + client-side projection |
| `web/app/portal/progress/ProgressSections.tsx` | 3 | Retest CTA + test history table |

### Modified Files

| File | Pass | Change |
|------|------|--------|
| `web/db/schema/users.ts` | 1 | Add `paes_score_min`/`paes_score_max` to `testAttempts` |
| `web/app/api/diagnostic/complete/route.ts` | 1 | Also write PAES scores to attempt row |
| `web/app/portal/DashboardSections.tsx` | 3 | Retest CTA, remove effort slider, add progress link |
| `web/app/portal/M1DashboardClient.tsx` | 3 | Remove effort slider props |
| `web/app/portal/usePortalDashboard.ts` | 3 | Remove `weeklyMinutes`/`projectedScore` |
| `web/app/portal/types.ts` | 3 | Remove effort slider types from `DashboardViewModel` |
| `web/app/portal/components/PortalNav.tsx` | 3 | Add "Progreso" nav link |
| `docs/implementation-gap-analysis.md` | 3 | Mark 3A as done |

---

## Pass 1 — Backend + Schema

### 1.1 Schema Change

- [x] Add columns to `testAttempts` in `web/db/schema/users.ts`

Add after the existing `stage2Difficulty` column:

```typescript
paesScoreMin: integer("paes_score_min"),
paesScoreMax: integer("paes_score_max"),
```

Then tell user to run:

```bash
npx drizzle-kit generate --name add-paes-scores-to-test-attempts
npx drizzle-kit migrate
```

---

### 1.2 Backend Module — `web/lib/student/fullTest.ts`

- [x] Create file with the functions below

**Imports to use:**

```typescript
import { and, eq, desc, sql, isNotNull, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  tests, testQuestions, questions, questionAtoms,
  testAttempts, studentResponses, atomMastery, users,
} from "@/db/schema";
import { getRetestStatus } from "./retestGating";
import { getPaesScore, estimateCorrectFromScore } from
  "@/lib/diagnostic/paesScoreTable";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
```

#### `getAvailableFullTests(userId: string)`

Returns complete official tests the student hasn't taken yet.

```typescript
type AvailableTest = {
  id: string;
  name: string;
  questionCount: number;
  timeLimitMinutes: number | null;
};
```

Query pattern:

```sql
SELECT t.id, t.name, t.question_count, t.time_limit_minutes,
  COUNT(DISTINCT tq.question_id) AS available
FROM tests t
JOIN test_questions tq ON tq.test_id = t.id
JOIN questions q ON q.id = tq.question_id
WHERE t.test_type = 'official'
  AND t.id NOT IN (
    SELECT ta.test_id FROM test_attempts ta
    WHERE ta.user_id = $userId
      AND ta.completed_at IS NOT NULL
      AND ta.test_id IS NOT NULL
  )
GROUP BY t.id
HAVING COUNT(DISTINCT tq.question_id) >= t.question_count
ORDER BY t.name
```

Return only tests where `available >= questionCount`.

#### `resolveTestQuestions(testId: string)`

Returns all questions for a test, preferring alternates over originals.

```typescript
type ResolvedQuestion = {
  position: number;
  resolvedQuestionId: string;
  originalQuestionId: string;
  qtiXml: string;
  correctAnswer: string;
  atoms: { atomId: string; relevance: "primary" | "secondary" }[];
};
```

Query strategy — two queries:

**Query 1: Resolve questions** (single query with LEFT JOIN for alternates)

```sql
SELECT
  tq.position,
  q.id AS original_id,
  COALESCE(alt.id, q.id) AS resolved_id,
  COALESCE(alt.qti_xml, q.qti_xml) AS qti_xml
FROM test_questions tq
JOIN questions q ON q.id = tq.question_id
LEFT JOIN questions alt
  ON alt.parent_question_id = q.id
  AND alt.source = 'alternate'
WHERE tq.test_id = $testId
ORDER BY tq.position
```

Parse `correctAnswer` from the QTI XML for each question using `parseQtiXml()`.
Normalize: if `correctAnswer` starts with "Choice", strip the prefix
(e.g. "ChoiceA" → "A").

**Query 2: Fetch atom mappings**

```sql
SELECT qa.question_id, qa.atom_id, qa.relevance
FROM question_atoms qa
WHERE qa.question_id IN (
  SELECT question_id FROM test_questions WHERE test_id = $testId
)
```

Group atoms by `question_id` and attach to each resolved question.

#### `recalibrateScore(params)`

```typescript
type RecalibrateParams = {
  userId: string;
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: {
    originalQuestionId: string;
    isCorrect: boolean;
  }[];
};

type RecalibrateResult = {
  paesScore: number;
  paesScoreMin: number;
  paesScoreMax: number;
  level: string;
};
```

Steps:

1. `paesScore = getPaesScore(correctAnswers)` — direct table lookup
2. Confidence band: ±2 questions (narrower than diagnostic's ±5)
   - `minCorrect = max(0, correctAnswers - 2)`
   - `maxCorrect = min(60, correctAnswers + 2)`
   - `paesScoreMin = getPaesScore(minCorrect)`
   - `paesScoreMax = getPaesScore(maxCorrect)`
3. `level` from `getLevel(paesScore)` (import from `@/lib/diagnostic/config`)
4. Update `test_attempts` row: set `paesScoreMin`, `paesScoreMax`,
   `correctAnswers`, `scorePercentage`, `completedAt`
5. Update `users` row: set `paesScoreMin`, `paesScoreMax`
6. Update `atom_mastery` for correctly-answered questions:
   - For each correct answer, get atoms from `question_atoms` where `relevance = 'primary'`
   - Upsert `atom_mastery`: `isMastered = true`, `masterySource = 'practice_test'`,
     `firstMasteredAt = now()` (only if not already mastered)

---

### 1.3 Backend Module — `web/lib/student/scoreHistory.ts`

- [x] Create file with the functions below

**Imports:**

```typescript
import { and, eq, desc, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { testAttempts, users } from "@/db/schema";
import {
  getPaesScore, estimateCorrectFromScore, PAES_TOTAL_QUESTIONS,
} from "@/lib/diagnostic/paesScoreTable";
import { EFFECTIVE_MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import { getStudentMetrics } from "./metricsService";
import { getUserDiagnosticSnapshot } from "./userQueries";
```

#### `getScoreHistory(userId: string)`

```typescript
type ScoreDataPoint = {
  date: string;           // ISO date
  type: "short_diagnostic" | "full_test";
  paesScoreMin: number;
  paesScoreMax: number;
  paesScoreMid: number;
  correctAnswers: number | null;
  totalQuestions: number | null;
  testName: string | null;
};
```

Query:

```sql
SELECT
  ta.completed_at,
  ta.test_id,
  ta.paes_score_min,
  ta.paes_score_max,
  ta.correct_answers,
  ta.total_questions,
  t.name AS test_name
FROM test_attempts ta
LEFT JOIN tests t ON t.id = ta.test_id
WHERE ta.user_id = $userId
  AND ta.completed_at IS NOT NULL
  AND ta.paes_score_min IS NOT NULL
ORDER BY ta.completed_at ASC
```

Derive `type`: if `test_id IS NULL` → `"short_diagnostic"`, else `"full_test"`.
Derive `paesScoreMid = Math.round((min + max) / 2)`.

#### `buildProjectionMetadata(params)` (server-side)

```typescript
type ProjectionMetadata = {
  unlockCurve: { atomsMastered: number; questionsUnlocked: number }[];
  accUnlocked: number;
  accLocked: number;
  effectiveMinPerAtom: number;  // EFFECTIVE_MINUTES_PER_ATOM (38)
  totalRemainingAtoms: number;
  currentCorrect: number;
  currentScore: number;
  diagnosticCeiling: number | null;
  targetScore: number | null;
};
```

Algorithm:

1. Build unlock curve via `buildUnlockCurve(userId)`:
   - Load atom-question graph, student mastery state
   - Sort non-mastered atoms by marginal efficiency (prereqs first)
   - Simulate atom-by-atom unlocks → `[atomsMastered → questionsUnlocked]`
2. Derive accuracy model from student's current performance:
   - `ACC_UNLOCKED`: accuracy on unlocked questions (clamped 0.5–0.95)
   - `ACC_LOCKED`: accuracy on locked questions (baseline 0.20)
3. Return metadata — projection computation happens client-side

#### Client-side projection (`computeProjection` in ProgressClient.tsx)

For each week 1..20:
1. `atomsMastered = min(effectiveAtomsPerWeek × week, totalRemaining)`
2. `questionsUnlocked = interpolate(unlockCurve, atomsMastered)`
3. `expectedCorrect = ACC_UNLOCKED × (unlocked/4) + ACC_LOCKED × (60 - unlocked/4)`
4. `projectedScore = PAES_TABLE[round(expectedCorrect)]`

No API calls on slider change — projection is instant.

---

### 1.4 API Route — `POST /api/student/full-test/start`

- [x] Create `web/app/api/student/full-test/start/route.ts`

Auth pattern (same as all student APIs):

```typescript
const authResult = await requireAuthenticatedStudentUser();
if (authResult.unauthorizedResponse) return authResult.unauthorizedResponse;
const userId = authResult.userId;
```

Steps:

1. Call `getRetestStatus(userId)` — if `!eligible`, return 403 with `blockedReason`
2. Call `getAvailableFullTests(userId)` — if empty, return 404 "No hay tests completos disponibles"
3. Pick first available test
4. Call `resolveTestQuestions(testId)` — get all questions
5. Insert `test_attempts` row:
   ```typescript
   { userId, testId, startedAt: new Date(), totalQuestions: questions.length }
   ```
6. Return envelope:
   ```typescript
   {
     success: true,
     data: {
       attemptId: string,
       testName: string,
       timeLimitMinutes: number,
       totalQuestions: number,
       questions: ResolvedQuestion[]
     }
   }
   ```

---

### 1.5 API Route — `POST /api/student/full-test/answer`

- [x] Create `web/app/api/student/full-test/answer/route.ts`

Modeled after `web/app/api/diagnostic/response/route.ts`. Thin wrapper around
`student_responses` insert.

Body:

```typescript
{
  attemptId: string;
  questionId: string;      // resolved question ID (alternate or original)
  selectedAnswer: string;
  isCorrect: boolean;
  questionIndex: number;
  responseTimeSeconds?: number;
}
```

Insert into `studentResponses`:

```typescript
{
  userId,
  testAttemptId: attemptId,
  questionId,
  selectedAnswer,
  isCorrect,
  responseTimeSeconds: responseTimeSeconds ?? 0,
  questionIndex,
  answeredAt: new Date(),
}
```

Return `{ success: true, responseId }`.

---

### 1.6 API Route — `POST /api/student/full-test/complete`

- [x] Create `web/app/api/student/full-test/complete/route.ts`

Body:

```typescript
{
  attemptId: string;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: { originalQuestionId: string; isCorrect: boolean }[];
}
```

Steps:

1. Auth check + verify attempt belongs to user
2. Call `recalibrateScore({ userId, attemptId, correctAnswers, totalQuestions, answeredQuestions })`
3. Calculate axis performance (reuse `calculateAxisPerformance()` pattern from
   `@/lib/diagnostic/config` — adapted for full test data)
4. Return:
   ```typescript
   {
     success: true,
     data: {
       paesScore: number,
       paesScoreMin: number,
       paesScoreMax: number,
       level: string,
       correctAnswers: number,
       totalQuestions: number,
       axisPerformance: Record<Axis, { correct: number; total: number; percentage: number }>
     }
   }
   ```

---

### 1.7 API Route — `GET /api/student/progress`

- [x] Create `web/app/api/student/progress/route.ts`

No query params — projection metadata is user-specific, not slider-dependent.

Steps:

1. Auth check
2. Parallel fetch:
   - `getScoreHistory(userId)`
   - `buildProjectionMetadata({ userId })`
   - `getRetestStatus(userId)`
   - `getUserDiagnosticSnapshot(userId)` → current score
3. Return:
   ```typescript
   {
     success: true,
     data: {
       masteryBreakdown: MasteryBreakdown,
       axisMastery: AxisMasteryItem[],
       personalBest: ScoreDataPoint | null,
       scoreHistory: ScoreDataPoint[],
       projectionMetadata: ProjectionMetadata | null,
       retestStatus: RetestStatus,
       currentScore: CurrentScore | null,
       goalMilestones: GoalMilestone[],
       defaultAtomsPerWeek: number,
     }
   }
   ```

---

### 1.8 Backfill — Update Diagnostic Complete Route

- [x] Modify `web/app/api/diagnostic/complete/route.ts`

After the existing `db.update(testAttempts).set(...)` call, also set
`paesScoreMin` and `paesScoreMax` on the attempt row. These values come from
the existing scoring flow that already computes them for the `users` table.

The diagnostic uses the MST scoring formula (`calculatePAESScore` from config),
which returns `{ score, min, max, level }`. Add `paesScoreMin: min` and
`paesScoreMax: max` to the `.set()` object.

Note: this requires the diagnostic complete route to receive `min`/`max` from
the client (which it currently doesn't — it receives `correctAnswers` and
`scorePercentage`). Two options:

**Option A (preferred):** Have the client send `paesScoreMin`/`paesScoreMax` as
additional fields in the POST body. The client already computes these during
results calculation.

**Option B:** Recompute the score server-side from `stage1Score`,
`stage2Difficulty`, and responses. More complex but removes client trust.

For v1, Option A is fine — this is a practice platform, not a proctored exam.

---

## Pass 2 — Full Test UI (`/portal/test`)

### 2.1 Server Page

- [x] Create `web/app/portal/test/page.tsx`

Simple server component:

```tsx
import { FullTestClient } from "./FullTestClient";

export default function FullTestPage() {
  return <FullTestClient />;
}
```

### 2.2 State Machine — `useFullTestFlow.ts`

- [x] Create `web/app/portal/test/useFullTestFlow.ts`

Screens:

```typescript
type FullTestScreen =
  | "pre-test"        // instructions + start button
  | "in-progress"     // timed test with question nav
  | "submitting"      // submitting results
  | "time-up"         // timer expired modal
  | "results";        // score + breakdown
```

State:

```typescript
type FullTestState = {
  screen: FullTestScreen;
  attemptId: string | null;
  testName: string | null;
  timeLimitMinutes: number;
  questions: ResolvedQuestion[];
  answers: Map<number, string>;       // position -> selected answer
  currentPosition: number;            // 1-based
  results: FullTestResults | null;
  error: string | null;
  loading: boolean;
};
```

Key actions:

- `startTest()` — calls `POST /api/student/full-test/start`, loads questions,
  transitions to `in-progress`, starts timer
- `selectAnswer(position, answer)` — updates `answers` map, auto-saves to
  localStorage, periodically calls answer API (every 5 answers or on navigate)
- `goToQuestion(position)` — navigates to question
- `submitTest()` — transitions to `submitting`, calls complete API, transitions
  to `results`
- `handleTimeUp()` — shows time-up modal, then auto-submits

localStorage key: `arbor-full-test-${attemptId}` — stores `{ answers, currentPosition }`.
On mount, check for existing session to enable crash recovery.

### 2.3 Timer Hook — `useFullTestTimer.ts`

- [x] Create `web/app/portal/test/useFullTestTimer.ts`

Adapted from `web/app/diagnostico/hooks/useDiagnosticFlow.timer.ts`.

```typescript
type TimerState = {
  timeRemaining: number;        // seconds
  isRunning: boolean;
  urgency: "normal" | "caution" | "warning" | "critical";
};

function useFullTestTimer(params: {
  timeLimitMinutes: number;
  onTimeUp: () => void;
  enabled: boolean;              // only tick when test is in-progress
}): TimerState;
```

Thresholds (scaled for ~150 min test):

| Level | Seconds remaining | Visual |
|-------|------------------|--------|
| `critical` | < 60 | Red pulse |
| `warning` | < 600 (10 min) | Orange |
| `caution` | < 1800 (30 min) | Yellow |
| `normal` | >= 1800 | Default |

Implementation: `useEffect` with `setInterval(1000ms)`. Clears interval when
`enabled` is false or time hits 0. Calls `onTimeUp()` at 0.

### 2.4 Client Component — `FullTestClient.tsx`

- [x] Create `web/app/portal/test/FullTestClient.tsx`

**Pre-test screen:**
- Title: "Test Completo PAES M1"
- Info: question count, time limit
- Instructions:
  - "Puedes navegar libremente entre preguntas"
  - "El test se enviará automáticamente cuando se acabe el tiempo"
  - "Tiempo límite: X minutos"
- CTA: "Comenzar Test" button (calls `startTest()`)
- Loading state while start API runs

**In-progress screen:**
- **Top bar:** Timer display (formatted as `HH:MM:SS`), colored by urgency
- **Question navigator:** Grid of numbers 1-60, color-coded:
  - Gray: unanswered
  - Primary color: current
  - Green: answered
- **Question area:**
  - Question number + position indicator ("Pregunta 12 de 60")
  - QTI content rendered via `parseQtiXmlForReview()` from
    `web/lib/qti/clientParser.ts` (reuse existing parser)
  - Options A-E as radio buttons / clickable cards
  - Selected option highlighted
- **Navigation:** "Anterior" / "Siguiente" buttons + "Enviar test" button
  (with confirmation dialog)

**Time-up modal:**
- "Se acabó el tiempo"
- "Tu test será enviado con las respuestas que alcanzaste a completar"
- "Ver resultados" button → submits and goes to results

**Results screen:**
- Big PAES score display with min/max band
- Performance level (e.g. "Intermedio Alto")
- Correct count: "42/60 correctas"
- Per-axis breakdown cards (ALG, NUM, GEO, PROB) with percentage bars
- CTA: "Ver tu progreso" → navigates to `/portal/progress`
- Secondary: "Volver al inicio" → navigates to `/portal`

**Reuse from diagnostic:**
- `parseQtiXmlForReview()` from `web/lib/qti/clientParser.ts`
- `getLevel()` from `web/lib/diagnostic/config.ts`
- `AXIS_NAMES` from `web/lib/diagnostic/config.ts`
- Timer countdown pattern from `useDiagnosticFlow.timer.ts`

---

## Pass 3 — Progress Page + Dashboard Changes

### 3.1 Server Page

- [x] Create `web/app/portal/progress/page.tsx`

```tsx
import { ProgressClient } from "./ProgressClient";

export default function ProgressPage() {
  return <ProgressClient />;
}
```

### 3.2 Client Component — `ProgressClient.tsx`

- [x] Create `web/app/portal/progress/ProgressClient.tsx`

Fetches from `GET /api/student/progress` (one call on load; slider is client-side).

**Section 1: Mastery Hero**
- Circular SVG progress ring showing overall mastery percentage
- Status badges: Dominados, En progreso, Por verificar, Sin iniciar
- Current PAES score (mid ± range) and personal best

**Section 2: Axis Breakdown**
- Grid of 4 cards (ALG, NUM, GEO, PROB) with mastered/total counts and bars

**Section 3: Projection Card**
- Hours-per-week slider: 0.5–10 hrs in 0.5 hr steps (default 3)
- Shows estimated atoms/week derived from EFFECTIVE_MINUTES_PER_ATOM
- Simple text result: "Alcanzas tu meta en ~N semanas" with projected score
- Computes projection client-side instantly from unlock curve metadata

**Section 4: Retest CTA**
- Uses `retestStatus` from the progress API response
- If `eligible && recommended`:
  - Green banner: "Te recomendamos hacer un test completo — has dominado Y conceptos nuevos"
  - CTA button: "Comenzar test completo" → `/portal/test`
- If `eligible && !recommended`:
  - Soft banner: "Ya puedes tomar un test completo para mejorar tu estimación"
  - CTA link: "Tomar test" → `/portal/test`
- If `!eligible`:
  - Progress indicator: "X/18 conceptos para desbloquear test completo"
  - Progress bar: `atomsMasteredSinceLastTest / 18 * 100`
  - If `blockedReason` is spacing/cap-related, show the reason text

**Section 5: Test History Table**
- List of all completed tests from `scoreHistory`
- Columns: Fecha, Tipo, Puntaje, Correctas, Total
- Most recent first
- Type badges: "Diagnóstico" (amber) vs "Test completo" (emerald)

### 3.3 Dashboard Changes — `DashboardSections.tsx`

- [x] Remove `DashboardEffortSection` component
- [x] Remove `DashboardDetailsSection` component
- [x] Add progress link card (replaces the "Ver detalle y escenarios" button)

New compact card to add after `DashboardProgressSection`:

```tsx
<Link
  href="/portal/progress"
  className="rounded-2xl border border-gray-200 bg-white p-4
    flex items-center justify-between hover:bg-gray-50 transition"
>
  <div>
    <p className="text-sm font-medium text-gray-800">
      Proyección y progreso
    </p>
    <p className="text-xs text-gray-500">
      Ve tu historial de puntajes y proyección de mejora
    </p>
  </div>
  <svg className="w-5 h-5 text-gray-400" ...chevron-right... />
</Link>
```

- [x] Update `DiagnosticSourceBanner` to show retest CTA

Current behavior: when `source === "short_diagnostic"`, shows static text
"Pronto podrás tomar un test completo para mejorar tu estimación."

New behavior — needs `retestStatus` prop:

```typescript
function DiagnosticSourceBanner({
  source,
  retestStatus,
}: {
  source: DashboardPayload["diagnosticSource"];
  retestStatus: DashboardPayload["retestStatus"];
})
```

- If `source === "full_test"`: keep existing emerald text
- If `retestStatus?.eligible && retestStatus?.recommended`: strong green CTA
  "Te recomendamos un test completo" with link to `/portal/test`
- If `retestStatus?.eligible`: soft CTA "Ya puedes tomar un test completo"
  with link to `/portal/test`
- If `retestStatus && !retestStatus.eligible`: show progress
  `"${retestStatus.atomsMasteredSinceLastTest}/18 conceptos para desbloquear test completo"`
- Else: keep existing "Pronto podrás..." text (fallback)

### 3.4 Dashboard Client — `M1DashboardClient.tsx`

- [x] Remove `weeklyMinutes`, `setWeeklyMinutes`, `projectedScore` props
- [x] Remove `DashboardDetailsSection` from render
- [x] Add progress link card after `DashboardProgressSection`
- [x] Pass `retestStatus` to `DiagnosticSourceBanner`

### 3.5 Dashboard Hook — `usePortalDashboard.ts`

- [x] Remove `useProjectedScore` function (lines 129-153)
- [x] Remove `weeklyMinutes` / `setWeeklyMinutes` state from `useDashboardPayload`
- [x] Remove `projectedScore` from the returned `DashboardViewModel`
- [x] Simplify `DashboardViewModel` type accordingly

### 3.6 Dashboard Types — `types.ts`

- [x] Remove from `DashboardViewModel`:
  - `weeklyMinutes: number`
  - `setWeeklyMinutes: (value: number) => void`
  - `projectedScore: number | null`

### 3.7 Navigation — `PortalNav.tsx`

- [x] Add "Progreso" to `NAV_ITEMS` array

Insert after "Estudiar" (index 1):

```typescript
{
  href: "/portal/progress",
  label: "Progreso",
  icon: (active) => (
    <svg
      className="w-6 h-6"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0
          1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21
          6.375 21h-2.25A1.125 1.125 0 013
          19.875v-6.75zM9.75 8.625c0-.621.504-1.125
          1.125-1.125h2.25c.621 0 1.125.504 1.125
          1.125v11.25c0 .621-.504 1.125-1.125
          1.125h-2.25a1.125 1.125 0
          01-1.125-1.125V8.625zM16.5
          4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496
          3 21 3.504 21 4.125v15.75c0 .621-.504
          1.125-1.125 1.125h-2.25a1.125 1.125 0
          01-1.125-1.125V4.125z"
      />
    </svg>
  ),
},
```

Note: this uses the same bar-chart icon currently used for "Metas". Consider
using a different icon (e.g. trending-up / chart-line) to differentiate. The
existing "Metas" icon can stay as-is — it represents goals/targets.

### 3.8 Gap Analysis Update

- [x] Update `docs/implementation-gap-analysis.md`

Change the row in the summary table:

```
| Full timed test / retest | Done | Done | Done | **Working** |
```

Update section 3A to mark as fixed, following the pattern of other resolved
sections (e.g. 3B).

---

## Integration Points Checklist

These are cross-cutting concerns to verify after all passes are complete:

- [ ] `retestGating.ts` correctly detects full tests via `testId IS NOT NULL`
  on `test_attempts` — already implemented, no changes needed
- [ ] `hasCompletedFullTest(userId)` returns true after a full test —
  already checks `testId IS NOT NULL AND completedAt IS NOT NULL`
- [ ] `dashboardM1.ts` correctly reads `diagnosticSource` as `"full_test"`
  after completion — already uses `hasCompletedFullTest()`
- [ ] `DiagnosticSourceBanner` shows "Basado en test completo" after full test —
  already handled for `source === "full_test"`
- [ ] Score governance cap lifts after full test recalibrates — `users.paesScoreMax`
  is updated by `recalibrateScore()`, so `diagnosticPredictionMax` in projection
  automatically uses the new ceiling
- [ ] Atom mastery from full test answers counts toward retest gating —
  `masterySource = 'practice_test'` is counted by `countAtomsMasteredSinceViaStudy`
  which filters on `masterySource = 'study'`. **Decision needed**: should
  practice_test mastery count? Current gating only counts `study`. This may
  need a change to also count `practice_test` or the gating stays study-only.

---

## Testing Notes

After each pass, verify manually:

**Pass 1:**
- Schema migration applies cleanly
- `POST /api/student/full-test/start` returns questions (or 403/404 correctly)
- `POST /api/student/full-test/answer` records to `student_responses`
- `POST /api/student/full-test/complete` recalibrates score on `users` and
  writes `paes_score_min`/`max` on `test_attempts`
- `GET /api/student/progress` returns history + projection metadata
- Verify alternate-first resolution: questions should be alternates where available

**Pass 2:**
- Navigate to `/portal/test`, see pre-test screen
- Start test, see timer and questions
- Navigate between questions, answers persist
- Submit test, see results with PAES score
- Refresh during test → crash recovery from localStorage

**Pass 3:**
- `/portal/progress` shows mastery hero, axis breakdown, projection card
- Projection card computes projection client-side from unlock curve metadata
- Dashboard shows retest CTA when eligible
- Dashboard effort slider is gone, replaced by progress link
- "Progreso" appears in nav bar
