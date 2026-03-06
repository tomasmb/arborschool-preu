# Implementation Gap Analysis

> Audit of what the [Arbor Learning System Spec](./arbor-learning-system-spec.md)
> describes vs. what actually works end-to-end in the student portal.
>
> Use this document to plan and prioritize implementation work.

**Audited:** March 6, 2026

---

## Summary

| Feature | Backend | API | Frontend | E2E Status |
|---|---|---|---|---|
| Mini-clase mastery | Done | Done | Done | **Working** |
| Cooldown after failure | Done | Done | Done | **Working** |
| Misión semanal | Done | Done | Done | **Working** |
| Score prediction display | Done | Done | Done | **Working** |
| Diagnostic source banner | Done | Done | Done | **Working** |
| Milestone banners | Done | Done | Done | **Working** |
| Prereq scan flow | Done | **Missing** | **Missing** | **Dead link** |
| Spaced repetition reviews | Done | Done | **Missing** | **Dead link** |
| Full timed test | **Missing** | **Missing** | **Missing** | **Not built** |
| Score prediction governance | **Missing** | — | — | **Not enforced** |
| Daily streak tracking | **Missing** | — | Misleading | **Not built** |
| Habit quality guard | **Missing** | **Missing** | **Missing** | **Not built** |
| 3-hop implicit SR credit | **Missing** | — | — | **Not built** |
| SR balance rule | **Missing** | — | — | **Not built** |

---

## Priority 1 — Dead Links (students hit a wall)

### 1A. Spaced Repetition Review Flow

**Spec ref:** Section 7 — Spaced Repetition (Activity-Based)

**What's built:**
- `spacedRepetition.ts` — full backend: scheduling, budgets, due items,
  create/answer/complete session, implicit repetition, inactivity decay
- API route at `api/student/atom-sessions/review/route.ts` — wired
- Dashboard shows `ReviewBadge` with pending count, links to
  `/portal/study?mode=review`

**What's missing:**
- `study-sprint-client.tsx` does NOT handle `?mode=review`. It only
  handles `?atom=` and `?sprintId=`. The link is a dead end.
- No dedicated `ReviewSessionView` component exists.

**Work needed:**
1. Add `?mode=review` URL param handling in `study-sprint-client.tsx`
2. Build a review session UI (question-by-question, multi-atom)
3. Wire to the existing `api/student/atom-sessions/review` endpoint
4. Handle review failure → prereq scan or halved interval (spec 7.9)

**Estimated scope:** Medium — backend/API done, need frontend routing + UI.

---

### 1B. Prerequisite Scan Flow

**Spec ref:** Section 5 — Prerequisite Scan Protocol

**What's built:**
- `prerequisiteScan.ts` — full backend: `startPrereqScan`,
  `getNextScanQuestion`, `submitScanAnswer`, `checkCooldownExpiry`
- `atomMasteryEngine.ts` — correctly calls `startPrereqScan` on failure,
  returns scan info in the response payload
- `AtomResultPanel.tsx` — renders scan CTA linking to
  `/portal/study?scan={sessionId}`

**What's missing:**
- No API routes for `getNextScanQuestion` or `submitScanAnswer`
- `study-sprint-client.tsx` does NOT handle `?scan=` URL parameter
- No `PrereqScanView` component exists
- Gap detection feedback UI (spec 11.3 — "Detectamos un vacío en
  [prereq name]") is not built

**Work needed:**
1. Create API routes: `GET /api/student/prereq-scan/[sessionId]/next`,
   `POST /api/student/prereq-scan/[sessionId]/answer`
2. Add `?scan=` URL param handling in `study-sprint-client.tsx`
3. Build `PrereqScanView` (1 question at a time, show which prereq
   is being tested, progress indicator)
4. Build gap detection result screen
5. On gap found: mark prereq as not mastered, trigger learning path
   recalculation

**Estimated scope:** Medium-Large — backend done, need API routes +
frontend flow + gap detection UX.

---

## Priority 2 — Misleading or Broken UX

### 2A. Diagnostic Banner + Retest CTA

**Spec ref:** Section 8 — Retest Gating

**Current behavior:**
- Banner says "Estimado desde diagnóstico corto (16 preguntas). Para una
  predicción más precisa, realiza un test completo cronometrado."
- Below it: "Necesitas dominar 17 conceptos más" (from retest gating:
  `UNLOCK_THRESHOLD=18 - atomsMasteredViaStudy=1 = 17`)
- The implicit promise is that a full test exists and will unlock after
  18 atoms. **It doesn't exist.**

**What's built:**
- `retestGating.ts` — complete gating logic (thresholds, spacing, cap)
- CTA links to `/diagnostico?mode=full` — **dead link**

**What's missing:**
- Full timed test UI (50+ questions, timer, scoring)
- `/diagnostico?mode=full` handler
- Score recalibration after full test

**Immediate fix (honest UX while full test isn't built):**
1. Remove the "Necesitas dominar X conceptos más" text — it promises
   something that doesn't exist yet
2. Keep the diagnostic source label ("Estimado desde diagnóstico corto")
3. Replace the retest CTA with softer copy: "Pronto podrás tomar un
   test completo para mejorar tu estimación" or remove entirely

**Full implementation (later):**
1. Build full timed test flow (separate project)
2. Wire retest gating CTA to real test
3. Score recalibration on test completion

---

### 2B. Streak Badge Misrepresentation

**Spec ref:** Section 13.1 — Habit Policy

**Current behavior:**
- Fire icon + number next to the score (e.g. "🔥 2")
- Displays `completedSessions` from `student_weekly_missions`
- This is **sessions this week**, NOT a consecutive-days streak

**What the spec says:**
- Daily streak: ≥1 mastered atom per day → streak increments
- No backend logic exists for daily streak tracking
- `users` table has no `current_streak` column

**Options:**
1. **Relabel honestly:** Change badge to show "2 esta semana" instead
   of implying a streak
2. **Build real streaks (later):** Add `current_streak` + `max_streak`
   to user profile, track daily activity, reset on missed days

---

### 2C. Rich Feedback — Unwired Props

**Spec ref:** Section 11 — Student Feedback UX

**Current behavior:**
- `AtomResultPanel.tsx` accepts `questionsUnlocked` and `nextAtom` props
- `useAtomStudyController` never passes these — always `undefined`
- The mastery result panel's "questions unlocked" stat and "next atom"
  preview are silently empty

**Work needed:**
1. After mastery, compute how many questions the student just unlocked
   (query `question_atoms` for questions where all primary atoms are
   now mastered)
2. Determine the next atom in the learning path
3. Pass both to the result panel

---

## Priority 3 — Missing Backend Logic

### 3A. Score Prediction Governance

**Spec ref:** Section 9.3

**What the spec says:**
- `scenario_score = min(effort_projection, diagnostic_prediction_max)`
- Effort slider projections should be capped by the diagnostic ceiling
- Prediction authority stays with the diagnostic model

**Current behavior:**
- Effort metrics computed in `dashboardM1.ts` are not capped
- The atom model projects scores independently of diagnostic bounds

**Work needed:**
1. Apply cap formula in `computeEffortMetrics` or `buildReadyDashboard`
2. Ensure displayed scenarios never exceed `prediction.max`

---

### 3B. 3-Hop Implicit Repetition

**Spec ref:** Section 7.6

**What the spec says:**
- 1-hop prerequisites get full SR reset
- 2-hop get half credit
- 3-hop get 0.25 credit

**Current behavior:**
- `applyImplicitRepetition` in `spacedRepetition.ts` only does 1-hop
  (full) and 2-hop (half). 3-hop is not implemented.

**Work needed:**
1. Add 3-hop traversal to `applyImplicitRepetition`
2. Apply 0.25 credit factor

---

### 3C. SR Balance Rule

**Spec ref:** Section 7.10

**What the spec says:**
- Interleave SR review blocks after every 2-3 newly mastered atoms
- Prevents long streaks of new learning without reinforcement

**Current behavior:**
- No interleaving logic. Reviews show up in the dashboard as a count,
  but the study flow doesn't enforce alternation.

**Work needed:**
1. Track atoms mastered since last review block
2. After 2-3 new masteries, insert a review block before next new atom
3. Enforce in the study sprint flow

---

### 3D. Habit & Workload Quality Guard

**Spec ref:** Section 13.3

**What the spec says:**
- If within-session accuracy drops or repeated failures appear, suggest
  switching to SR/review or taking a break
- Diminishing returns for 4-5+ atoms/day

**Current behavior:**
- Nothing exists for this.

**Work needed:**
1. Track within-session accuracy
2. Detect failure patterns (3+ consecutive failures)
3. Show intervention UI suggesting review or break
4. Implement diminishing reward shaping for high-volume days

---

## Data Integrity Notes

These items were fixed during this audit and are now working correctly:

- ✅ **Atom count:** 123/205 (was showing 123/206, then 123/140, then
  1/238 at various points)
- ✅ **Score display:** 878 (was flashing "0" due to `useCountUp` init)
- ✅ **Diagnostic source:** Shows "diagnóstico corto" (was showing
  "test completo" incorrectly)
- ✅ **Milestone banner:** Shows actual count "123 conceptos dominados"
  (was showing fixed "50 conceptos dominados")
- ✅ **CTA time:** Shows "~25 min" per session (was showing full route
  time "4h 20 min")
- ✅ **Route cards:** Toggle behavior instead of direct navigation
- ✅ **Diagnostic mastery backfill:** Script ran to fix missing
  diagnostic-sourced `atom_mastery` records
- ✅ **Misión semanal:** Confirmed real data from
  `student_weekly_missions` table

---

## Recommended Execution Order

1. **Fix misleading UX now** (2A diagnostic banner, 2B streak badge) —
   small changes, high trust impact
2. **Wire SR review flow** (1A) — backend is done, biggest student value
3. **Wire prereq scan flow** (1B) — backend is done, critical for
   learning quality
4. **Rich feedback props** (2C) — small win, better mastery experience
5. **Score governance** (3A) — correctness matter
6. **Backend polish** (3B, 3C, 3D) — diminishing returns, do when
   capacity allows
