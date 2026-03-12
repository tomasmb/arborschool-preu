# Production Readiness Audit — Arbor PreU

> **Created:** March 12, 2026
> **Purpose:** Comprehensive audit of the learning app for school deployment readiness.
> All findings, gaps, and required changes are documented here.

---

## Table of Contents

1. [Current System Architecture](#1-current-system-architecture)
2. [Student Journey (End-to-End)](#2-student-journey-end-to-end)
3. [What Works Well](#3-what-works-well)
4. [All Gaps Found](#4-all-gaps-found)
5. [Learning Science Alignment](#5-learning-science-alignment)
6. [Implementation Phases](#6-implementation-phases)
7. [Key Files Map](#7-key-files-map)

---

## 1. Current System Architecture

```
Diagnostic (MST-16) → Dashboard → Learning Path → Mini-clase (atom study)
                                                       ↕
                                                  Spaced Repetition
                                                       ↕
                                              Retest (Full 60q Test)
                                                       ↕
                                              Verification Quiz (NEW)
```

The system optimizes learning paths by minimizing atoms mastered to maximize
official PAES questions unlocked. A question is unlocked only when ALL its
primary atoms are mastered. The next-action engine finds the most efficient
path through the knowledge graph.

### Knowledge Graph

- 229 atoms across 4 axes (ALG 35%, NUM 24%, PROB 22%, GEO 19%)
- 174 atoms (76%) have prerequisite chains, max depth 5
- 202 official PAES questions from 4 historical tests
- Each question maps to atoms via `question_atoms` (primary = required for unlock)

### Journey States

| State | Description |
|---|---|
| `anonymous` | Not authenticated |
| `planning_required` | Authenticated, no diagnostic snapshot |
| `diagnostic_in_progress` | Started diagnostic, not finished |
| `activation_ready` | Diagnostic completed, ready for first mini-clase |
| `active_learning` | At least one completed mini-clase |

---

## 2. Student Journey (End-to-End)

1. **Landing** (`/`) — CTA to sign in
2. **Auth** (`/auth/signin`) — Google OAuth, user upserted on first login
3. **Post-Login** (`/auth/post-login`) — routes by journey state
4. **Planning** (`/portal/goals?mode=planning`) — career/university goals, study commitment
5. **Diagnostic** (`/diagnostico`) — 16 questions, 2 stages, route A/B/C by stage-1 performance
6. **Dashboard** (`/portal`) — PAES score, learning path, mission, progress
7. **Study** (`/portal/study?atom=ID`) — mini-clase: lesson → easy/med/hard → 3CCR mastery
8. **SR Review** (`/portal/study?mode=review`) — spaced repetition quiz on mastered atoms
9. **Prereq Scan** (`/portal/study?scan=ID`) — 1 hard question per prerequisite to find gaps
10. **Full Test** (`/portal/test`) — 60 questions, 2h30, PAES recalibration
11. **Verification** (`/portal/study?mode=verification`) — NEW: verify suspected gaps from full test

---

## 3. What Works Well

- **Signup/Auth:** Google OAuth, journey state machine, post-login routing
- **Diagnostic:** 16-question MST, route A/B/C, atom mastery via transitivity
- **Mini-Clase:** Lesson phase → difficulty escalation → 3CCR mastery → prereq scan on failure → cooldown
- **Spaced Repetition:** Session-based intervals, implicit repetition (1/2/3 hop), inactivity decay
- **Next-Action Engine:** Route optimization maximizing PAES questions unlocked per study effort
- **Full Test:** 60 questions, PAES score recalibration, retest gating (18 atoms, 7 days, 3/month)
- **Dashboard:** PAES band, diagnostic source banners, retest encouragement, learning path with atom CTAs
- **Goals/Simulator:** Admission goals with weighted score simulation and sensitivity analysis

---

## 4. All Gaps Found

### CRITICAL-1: Post-Diagnostic Handoff Routes to Legacy Sprint

**Location:** `web/app/diagnostico/DiagnosticoClientPage.tsx` line 337

The "Comenzar mini-clase de hoy" button navigates to `/portal/study` with no
`?atom=` param. This falls through to a legacy sprint flow (labeled "Legacy
sprint-based study flow" in `study-sprint-client.tsx` line 54). The sprint
gives 5 official PAES questions but does NOT update atom mastery, initialize
SR schedules, trigger prereq scans, or track difficulty.

**Impact:** First learning experience after diagnostic is broken — nothing
meaningful happens to the knowledge graph.

**Fix:** Route post-diagnostic to `/portal` (dashboard) where `LearningPathSection`
provides proper `?atom=ATOM_ID` links.

### CRITICAL-2: Legacy Sprint System Is Dead Weight

**Location:** 3 DB tables + ~500 lines of lib code + UI components + API routes

The sprint system was the original study flow before atom-based mini-clases.
It is labeled "Legacy" in comments, not rendered from the dashboard (replaced by
`LearningPathSection`), not connected to the mastery system, and only reachable
via the post-diagnostic bug or direct URL with no params.

**Files removed:**
- `web/lib/student/studySprints.ts`, `studySprint.types.ts`
- `web/app/portal/study/StudySprintView.tsx`, `SprintCompletionPanel.tsx`, `useStudySprintController.ts`
- `web/app/api/student/study-sprints/` (all routes)
- Dead component code in `web/app/portal/NextActionSection.tsx` (types preserved)

**Note:** DB tables (`student_study_sprints`, `student_study_sprint_items`,
`student_study_sprint_responses`) kept for existing data. Schema references
retained. Only code paths removed.

### CRITICAL-3: Full Test Does NOT Credit Spaced Repetition

**Location:** `web/lib/student/fullTest.ts` lines 372-428

`upsertMasteryFromCorrectAnswers` sets `isMastered` and `masterySource` but
never touches `sessionsSinceLastReview`, `lastDemonstratedAt`, `reviewIntervalSessions`,
or `nextReviewAt`.

**Impact:** Students who prove retention in a timed 60-question test still get
SR review requests for those atoms. Violates the "use every opportunity" principle.

**Fix:** For correct answers on already-mastered atoms, reset SR counters and
update `lastDemonstratedAt`.

### CRITICAL-4: Full Test Wrong Answers on Mastered Atoms Silently Ignored

**Location:** `web/lib/student/fullTest.ts` lines 377-379

Only correct answers are processed. Wrong answers on mastered atoms cause no
flag, no re-verification, no learning path adjustment.

**Impact:** Knowledge graph drifts from reality. System optimizes on stale data.

**Fix:**
1. New `needs_verification` mastery status — preserves nuance (careless mistake vs real gap)
2. New `verification` session type
3. Verification quiz: 1 hard question per flagged atom, surfaced after 24h grace period
4. On correct: restore mastered + credit SR. On incorrect: downgrade to `in_progress` + prereq scan
5. 24-hour grace period: verification is NOT surfaced immediately after full test. During
   the grace window `isMastered` stays true and the learning path benefits from newly-proven
   atoms. After 24h, verification appears with highest priority (`primaryIntent: "verification"`).

**Learning science basis:**
- Testing effect (Roediger & Karpicke, 2006): retrieval under different conditions verifies knowledge
- Spacing effect: 24h delay ensures one sleep-consolidation cycle, producing more reliable data
- Avoids false negatives: one wrong answer in a timed test may be careless
- Ego depletion: post-test cognitive fatigue makes immediate verification unreliable and punishing
- Self-determination theory: framing as "verificacion rapida" preserves autonomy

### MODERATE-5: Confidence Badge Ignores Diagnostic Source

**Location:** `web/app/portal/components/ConfidenceBadge.tsx`, `web/lib/student/dashboardM1.ts`

`computeConfidence` uses `masteryRatio` (65%) and `bandWidth` (35%) but not
`diagnosticSource`. Short diagnostic should never yield "Alta" confidence.

**Fix:** Cap confidence to "Media" when `diagnosticSource !== 'full_test'`.

### MODERATE-6: Documentation Contamination

- `docs/adaptive-mastery-specification.md` — deprecated, wrong FK references
- `docs/learning-method-specification.md` — deprecated, superseded
- `docs/data-model-specification.md` — missing many schema columns

**Fix:** Delete 2 deprecated docs. Update data model spec. Update master spec.

### MODERATE-7: Open E2E Bugs

- **M2:** Back nav from Study goes to `/portal/goals` instead of `/portal`
- **N3b:** Invalid UUID returns 500 instead of 400

### MODERATE-8: Question Freshness — Students Can See Repeated Questions

**Principle:** Every flow must prefer unseen questions, falling back to
already-seen ones only when the pool is exhausted.

**Current state by flow:**

| Flow | Question pool | Excludes seen? | Status |
|---|---|---|---|
| Full test | `questions` (official) | Yes (per-student assembly) | DONE — unseen-first with cross-position substitution |
| Atom mastery | `generated_questions` | Yes (user+atom history) | DONE — uses shared `getSeenQuestionIds` |
| SR review | `generated_questions` | Yes (user+atom history) | DONE — updated to pass `excludeIds` |
| Prereq scan | `generated_questions` | Yes (all sessions) + medium fallback | DONE — updated to full history + `findScanQuestion` |
| Verification | `generated_questions` | Yes (user+atom history) | DONE — updated to pass `excludeIds` |

**Full test question selection (largest gap):**

The full test must be built per-student to maximize atom coverage while
avoiding questions the student has already seen. Strategy:

1. Start with the fixed test question list from `test_questions`
2. For each position, check if the student has seen the original — if so,
   prefer an alternate version (`source = 'alternate'`)
3. If ALL versions of a question were seen, find another official question
   testing the same primary atoms
4. Only repeat a question when no unseen option exists for those atoms
5. The final selection should cover all atoms (directly or via transitivity)
   that the test was designed to assess

**Generated question flows (SR, prereq scan, verification):**

These all share the same `findGeneratedQuestions` helper and should pass
`excludeIds` from the student's full answer history for that atom (not just
the current session).

**Prereq scan difficulty:**

Currently always uses `"high"` difficulty. Should use hard OR medium,
still preferring unseen questions.

**Learning science basis:**
- Testing effect is strongest with novel retrieval cues; repeating the
  exact same question shifts from retrieval to recognition
- Desirable difficulty: new question variants force deeper processing
- Ecological validity: PAES has no repeated questions; practice should mirror

### LOW-9: NextActionSection Component Partially Dead

`NextActionSection` component no longer rendered on dashboard (replaced by
`LearningPathSection`). Types still used. Dead component code removed, types
preserved in same file.

---

## 5. Learning Science Alignment

| Principle | Status | Notes |
|---|---|---|
| Spaced retrieval practice | IMPLEMENTED | Session-based SR. Full test credit added. |
| Testing effect | IMPLEMENTED | Diagnostic + mini-clases + verification quizzes |
| Prerequisite remediation | IMPLEMENTED | Prereq scan on failure, cooldown |
| Desirable difficulty | IMPLEMENTED | Easy → medium → hard progression |
| Mastery-based progression | IMPLEMENTED | 3CCR with hard items required |
| Metacognitive feedback | IMPLEMENTED | Result panels show prereq context |
| Interleaving | PARTIAL | SR reviews interleave topics |
| Question freshness | IMPLEMENTED | All flows (generated-Q + full test) prefer unseen questions |
| Error analysis | IMPLEMENTED | Full test discrepancies flagged + verified |
| Calibration correction | IMPLEMENTED | Verification quiz for test failures |
| Distributed practice | IMPLEMENTED | Spacing via SR intervals |
| Self-determination theory | IMPLEMENTED | Autonomy framing in UX copy |

---

## 6. Implementation Phases

### Phase 1: Remove Legacy Sprint + Fix Post-Diagnostic Handoff — DONE
1. ~~Fix post-diagnostic handoff to route to `/portal`~~
2. ~~Update `/portal/study` default to redirect to `/portal`~~
3. ~~Remove sprint UI, controllers, API routes, lib code~~
4. ~~Clean up dead `NextActionSection` component code~~

### Phase 2: Full Test Mastery Integration — DONE
1. ~~Schema: add `needs_verification` to `mastery_status`, `verification` to `session_type`~~
2. ~~Full test correct answers on mastered atoms: reset SR counters~~
3. ~~Full test wrong answers on mastered atoms: flag as `needs_verification`~~
4. ~~Migration `0016_add-verification-enums.sql` generated and applied~~

### Phase 3: Verification Quiz Engine — DONE
1. ~~`web/lib/student/verificationQuiz.ts` — query, create, submit verification sessions~~
2. ~~API routes for verification flow~~
3. ~~UI: `?mode=verification` in study flow~~

### Phase 4: Next-Action Engine + Disclaimers — DONE
1. ~~Prioritize `needs_verification` atoms in next-action engine~~
2. ~~Cap confidence when based on short diagnostic only~~

### Phase 5: Documentation Cleanup — DONE
1. ~~Delete deprecated docs~~
2. ~~Update data model spec and master spec~~
3. ~~Fix E2E bugs (M2 mitigated, N3b fixed)~~

### Phase 6: Question Freshness (Unseen-First Principle)

**Core rule:** Every flow that selects questions for a student MUST prefer
questions the student has never answered. Repeat only when the pool is
fully exhausted.

#### 6a. Generated question flows (SR review, prereq scan, verification) — DONE
1. ~~Create `getSeenQuestionIds(userId, atomId)` shared helper in
   `questionQueries.ts`~~
2. ~~Update SR `createReviewSession` to pass seen IDs as `excludeIds`~~
3. ~~Update prereq scan `getNextScanQuestion` to exclude all-session
   history (not just current scan)~~
4. ~~Update verification `findHardQuestion` to exclude seen IDs~~
5. ~~Prereq scan: allow `"medium"` fallback when no hard questions remain~~

#### 6b. Full test question selection (per-student test assembly) — DONE
1. ~~Before resolving test questions, load the student's `student_responses`
   to know which `question_id` values they've already answered~~
2. ~~For each test position, prefer an alternate version the student hasn't
   seen. If no unseen alternate exists, check if the original is unseen.~~
3. ~~If ALL versions of a question (original + alternates) are seen, search
   for another official question testing the same primary atoms that the
   student hasn't seen.~~
4. ~~Goal: cover all atoms the test was designed to assess (directly or via
   transitivity), using only unseen questions when possible.~~
5. ~~Only repeat a question when no unseen option exists for those atoms.~~

**Files modified:**
- `web/lib/student/fullTest.ts` — `getSeenOfficialQuestionIds`, `resolveQuestionRows` with unseen-first ORDER BY, `substituteSeenPositions` cross-position fallback
- `web/app/api/student/full-test/start/route.ts` — pass `userId` and `excludeAttemptId`
- `web/app/api/student/full-test/info/route.ts` — pass `userId` and `excludeAttemptId`

---

## 7. Key Files Map

| Area | Files |
|---|---|
| Schema | `web/db/schema/enums.ts`, `users.ts`, `studentPortal.ts`, `content.ts` |
| Atom mastery | `web/lib/student/atomMasteryEngine.ts`, `atomMasteryAlgorithm.ts` |
| Spaced repetition | `web/lib/student/spacedRepetition.ts` |
| Prereq scan | `web/lib/student/prerequisiteScan.ts` |
| Full test | `web/lib/student/fullTest.ts` |
| Verification quiz | `web/lib/student/verificationQuiz.ts` (NEW) |
| Next action | `web/lib/student/nextAction.ts` |
| Dashboard | `web/lib/student/dashboardM1.ts` |
| Study UI | `web/app/portal/study/study-client.tsx` |
| Master spec | `docs/arbor-learning-system-spec.md` |
