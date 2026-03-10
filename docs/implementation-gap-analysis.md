# Implementation Gap Analysis

> Audit of what the [Arbor Learning System Spec](./arbor-learning-system-spec.md)
> describes vs. what actually works end-to-end in the student portal.
>
> Use this document to plan and prioritize implementation work.

**Audited:** March 10, 2026 (third pass — post-P1/P2/P4 fixes)

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
| Streak badge (relabeled as weekly sessions) | Done | Done | Done | **Working** |
| Rich feedback (questionsUnlocked, nextAtom) | Done | Done | Done | **Working** |
| Misión semanal | Done | Done | Done | **Working** |
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
| Real daily streak tracking | **Missing** | **Missing** | — | **Not built** |
| Error handling on 3 API routes | — | Done | — | **Working** |

---

## ~~Priority 1 — Runtime Crashes~~ RESOLVED

### 1A. Foreign Key Mismatch in Review + Prereq Scan — FIXED (March 10, 2026)

**Resolution:** Option A — switched both flows to `generated_questions`.

A shared `questionQueries.ts` helper was created with `findGeneratedQuestions`,
`getQuestionAtomId`, and `getQuestionContent` to eliminate duplication across
the mastery engine, spaced repetition, and prereq scan flows.

**Files changed:**
- `web/lib/student/questionQueries.ts` — **new** shared query helpers
- `web/lib/student/spacedRepetition.ts` — `findReviewQuestion()`,
  `submitReviewAnswer()`, `completeReviewSession()` now use
  `generatedQuestions` instead of `questions` + `questionAtoms`
- `web/lib/student/prerequisiteScan.ts` — `findHardQuestion()`,
  `submitScanAnswer()`, `getTestedPrereqs()` now use `generatedQuestions`

**Important:** Verify data coverage item 5D (below) to ensure atoms reachable
via review/scan have high-difficulty generated questions.

---

## ~~Priority 2 — Logic Bugs~~ RESOLVED

### 2A. Cooldown Not Enforced After Failure — FIXED (March 10, 2026)

**Resolution:** Cooldown is now enforced at 4 levels:

1. **Session creation blocked** — `createAtomSession()` queries
   `atom_mastery.cooldownUntilMasteryCount` and throws a user-facing
   error with the remaining count if > 0.
2. **Next-action filtering** — `getMasteryRows()` in `nextAction.ts` now
   includes `cooldownUntilMasteryCount`; atoms in cooldown are excluded
   before passing to `analyzeLearningPotential()`.
3. **Next-study-atom filtering** — `getNextStudyAtom()` in
   `masteryLifecycle.ts` excludes atoms with active cooldowns from the
   "next atom in subject" suggestion.
4. **Dynamic UI count** — `FailureWithCooldown` in `AtomResultPanel.tsx`
   now accepts `cooldownRemaining` and displays the actual remaining
   count instead of hardcoding 3. The pipeline flows through
   `AnswerResultWithLifecycle` → API → `AtomStudyView` → `AtomResultPanel`.

**Files changed:**
- `web/lib/student/atomMasteryEngine.ts` — cooldown check in
  `createAtomSession()`, `cooldownRemaining` in answer result type
- `web/lib/student/nextAction.ts` — `getMasteryRows()` includes
  cooldown; filtering before analysis
- `web/lib/student/masteryLifecycle.ts` — `getNextStudyAtom()` excludes
  cooldown atoms
- `web/lib/student/prerequisiteScan.ts` — exported `COOLDOWN_MASTERY_COUNT`
- `web/app/portal/study/AtomResultPanel.tsx` — dynamic `cooldownRemaining`
- `web/app/portal/study/AtomStudyView.tsx` — passes `cooldownRemaining`

---

## Priority 3 — Missing Features

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

### 3B. Real Daily Streak Tracking

**Spec ref:** Section 13.1 — Habit Policy

**Current state:**
- `StreakBadge` honestly displays "X sesión(es) esta semana" (weekly
  session count from `student_weekly_missions`)
- No consecutive-day streak logic exists

**What the spec says:**
- Daily streak: ≥1 mastered atom per day → streak increments
- Missed day → streak resets to 0
- Show current streak + max streak

**Work needed:**
1. Add `current_streak` and `max_streak` columns to `users` table
2. Track daily activity: on each mastery, check if the student had a
   mastery yesterday — if yes, increment; if gap, reset to 1
3. Update `StreakBadge` to show actual daily streak
4. Optional: streak freeze (1 per week), streak milestone badges

---

## ~~Priority 4 — API Hardening~~ RESOLVED

### 4A. Missing Error Handling on 3 Routes — FIXED (March 10, 2026)

**Resolution:** All three GET handlers now have try/catch with
`studentApiError()` responses:

1. `goals/route.ts` — `GOALS_LOAD_FAILED` (500)
2. `me/route.ts` — `PROFILE_LOAD_FAILED` (500)
3. `simulator/route.ts` — `SIMULATION_LOAD_FAILED` (500); also migrated
   from raw `NextResponse.json` to `studentApiSuccess`/`studentApiError`
   for consistency with all other student API routes.

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

## Previously Completed

### Sprint 3 — March 10, 2026

- ✅ **FK mismatch fix** (1A) — review + prereq scan switched to
  `generated_questions`; shared `questionQueries.ts` helper created
- ✅ **Cooldown enforcement** (2A) — blocked in `createAtomSession`,
  filtered in next-action + next-study-atom, dynamic UI count
- ✅ **API error handling** (4A) — try/catch on goals, me, simulator
  routes; simulator migrated to `studentApiSuccess`/`studentApiError`

### Sprint 2 — March 6, 2026

- ✅ SR review flow frontend (`?mode=review` routing, ReviewSessionView,
  useReviewSessionController)
- ✅ Prereq scan flow frontend (`?scan=` routing, PrereqScanView,
  usePrereqScanController, API routes)
- ✅ Diagnostic banner — removed dead retest CTA, honest copy
- ✅ Streak badge — relabeled from streak to weekly sessions
- ✅ Rich feedback props — wired questionsUnlocked + nextAtom through
  engine → API → UI
- ✅ Score prediction governance — diagnostic ceiling cap
- ✅ 3-hop implicit SR credit — 1-hop full, 2-hop 50%, 3-hop 25%
- ✅ SR balance rule — suggest review after 3 consecutive masteries
- ✅ Habit quality guard — fatigue detection + intervention banners

---

## Remaining Work — Recommended Execution Order

1. **Verify data coverage** (5A-5D) — run the SQL queries before any
   real students use the system. Especially important now that review
   and prereq scan use `generated_questions` (need high-difficulty
   questions for all atoms).
2. **Real daily streaks** (3B) — needs schema change (`current_streak`,
   `max_streak` on `users`), streak update logic on mastery, StreakBadge
   update. Current weekly label is honest; not urgent.
3. **Full timed test** (3A) — large feature: test data, creation API,
   timed UI, score recalibration, retest CTA. Banner copy is honest;
   ship without it.
