# Arbor Learning System — Unified Master Specification

> **Single source of truth** for the entire learning system powering Arbor PreU.
> Every algorithm, rule, UX contract, and implementation status lives here.
> If it is not in this document, it is not part of the spec.

**Last updated:** March 5, 2026

**Supersedes:** `learning-method-specification.md`, `adaptive-mastery-specification.md`,
and learning-related sections of `student-portal-high-level-spec.md`.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Knowledge Graph](#2-knowledge-graph)
3. [Learning Path Optimization Algorithm](#3-learning-path-optimization-algorithm)
4. [Mini-Clase (Adaptive Mastery) Algorithm](#4-mini-clase-adaptive-mastery-algorithm)
5. [Prerequisite Scan Protocol](#5-prerequisite-scan-protocol)
6. [Cooldown Mechanism](#6-cooldown-mechanism)
7. [Spaced Repetition (Activity-Based)](#7-spaced-repetition-activity-based)
8. [Retest (Full Timed Test) Gating](#8-retest-full-timed-test-gating)
9. [Score Prediction and Confidence](#9-score-prediction-and-confidence)
10. [Dashboard Data Contracts (DRY)](#10-dashboard-data-contracts-dry)
11. [Student Feedback UX Contracts](#11-student-feedback-ux-contracts)
12. [Goals and Objectives UX](#12-goals-and-objectives-ux)
13. [Habit and Workload Policy](#13-habit-and-workload-policy)
14. [Student-Facing Terminology](#14-student-facing-terminology)
15. [Schema Reference](#15-schema-reference)
16. [Implementation Status](#16-implementation-status)
17. [Research Basis](#17-research-basis)

---

## 1. System Overview

```
Diagnostic (MST-16) → Learning Plan → Mini-clase → Next Concepto / Gap-Fill / Cooldown
                                        ↕
                                   Spaced Repetition
                                        ↕
                                   Retest (Full Timed Test)
```

Students take a 16-question adaptive diagnostic, then learn through personalized
mini-clases — each focused on one atom (students see "concepto"). The system
optimizes the order of atoms to maximize PAES score improvement per unit of
study time.

### Core Principle

**Minimize atoms mastered to maximize official PAES questions unlocked.**
A question is unlocked only when ALL its primary atoms are mastered. The
algorithm finds the most efficient path through the knowledge graph to
unlock the most questions with the fewest atoms.

### Question Freshness Principle (Cross-Cutting)

**Every flow MUST prefer unseen questions. Repeat only when the pool is
exhausted.**

This applies to ALL student-facing flows:

| Flow | Pool | Strategy |
|---|---|---|
| Full test | Official `questions` | Per-student assembly: prefer alternate versions the student hasn't seen. If all versions seen, find another question testing the same atoms. Repeat only as last resort. Goal: cover all/most atoms the test assesses. |
| Mini-clase | `generated_questions` | Exclude all questions this user has ever answered for this atom (across all sessions). Difficulty fallback when pool exhausted. |
| SR review | `questions` (alternate) + `generated_questions` fallback | Try PAES variant first (eligibility: all co-primary atoms mastered). Fall back to generated hard question if no eligible variant. Exclude previously seen in both pools. |
| Prereq scan | `generated_questions` | Exclude all previously answered questions for this atom (all sessions, not just current). Prefer hard, fall back to medium. |
| Verification | `generated_questions` | Exclude all previously answered questions for this atom. Hard only. |

**Learning science basis:**
- Retrieval practice is strongest with novel cues; repeating the same
  question shifts from genuine retrieval to recognition memory
- Desirable difficulty: new question variants force deeper processing
- Ecological validity: PAES has no repeated questions

### Journey States

| State | Description |
|---|---|
| `anonymous` | Not authenticated |
| `planning_required` | Authenticated, no diagnostic snapshot |
| `diagnostic_in_progress` | Started diagnostic, not finished |
| `activation_ready` | Diagnostic completed, ready for first mini-clase |
| `active_learning` | At least one completed mini-clase or active weekly mission |

---

## 2. Knowledge Graph

### Inventory

| Asset | Count | Notes |
|---|---|---|
| Total atoms | 229 | Knowledge units across 4 axes |
| Atoms with prerequisites | 174 | 76% have prerequisite chains |
| Foundation atoms (no prereqs) | 50 | Base knowledge units |
| Leaf atoms (most advanced) | 61 | Terminal knowledge units |
| Maximum prerequisite depth | 5 | Deepest chains |
| Official PAES questions | 202 | From 4 historical tests (~50/test) |
| Official tests | 4 | NUM_OFFICIAL_TESTS constant |

### Axis Distribution

| Axis | Atoms | % |
|---|---|---|
| Algebra y Funciones | 80 | 35% |
| Numeros | 55 | 24% |
| Probabilidad y Estadistica | 51 | 22% |
| Geometria | 43 | 19% |

### Atom-Question Mappings

Each question maps to atoms via `question_atoms` with a relevance field:

- **Primary**: Required to unlock the question. ALL primary atoms must be
  mastered for the question to be considered unlocked.
- **Secondary**: Helpful context but not required for unlock.

---

## 3. Learning Path Optimization Algorithm

### 3.1 Question Unlock Rule

A question is **unlocked** when ALL its primary atoms are mastered.
Secondary atoms do not affect unlock status.

### 3.2 Pool-to-Test Normalization

Questions in the official pool (~202) represent the knowledge tested on a
60-question PAES M1 exam. To estimate PAES improvement, raw pool-level
unlock counts are normalized to a 60-question test:

- `additionalOnTest = normalizeToTestSize(totalQuestionsUnlocked, totalOfficialQuestions)`
  i.e. `totalQuestionsUnlocked × 60 / totalOfficialQuestions`
- Net gain accounts for guessing baseline:
  `effectiveAdditional = additionalOnTest × (1 - RANDOM_GUESS_ACC)`
  (unlocking a question moves it from 20% guess accuracy to ~100%)
- PAES improvement is calculated from `effectiveAdditional` via the PAES
  score table

### 3.3 Unlock Scoring (Per Atom)

For each non-mastered atom, calculate a marginal value score:

```
unlockScore = (immediateUnlocks x 10) + (twoAwayContributions x 3) + (threeOrMoreContributions x 1)
```

Where:
- **Immediate unlock** (weight 10): This atom is the ONLY missing primary atom
  for a question
- **Two away** (weight 3): After mastering this atom, the question will need
  only 1 more atom
- **Three or more** (weight 1): The question needs 2+ more atoms after this one

### 3.4 Efficiency Calculation

```
totalCost = 1 + count(unmasteredPrerequisites)
efficiency = unlockScore / totalCost
```

The algorithm favors atoms that unlock many questions (high score) with few
unmastered prerequisites (low cost).

### 3.5 Confirmed-Unknown Priority

**Critical rule**: The learning path must prioritize atoms the student
**definitively failed** in the diagnostic over atoms with unknown status.

- Atoms **with** an `atom_mastery` row where `isMastered = false` are
  **confirmed unknowns** — the student was tested and failed
- Atoms **without** an `atom_mastery` row have **unknown status** — the
  short diagnostic (16 questions) never covered them
- Confirmed unknowns receive a `1.5×` priority multiplier in the unlock
  scoring (`CONFIRMED_UNKNOWN_MULTIPLIER`), so the learning path starts
  with what we KNOW the student doesn't know

**Persistence rule**: The diagnostic profile save must only write
`atom_mastery` rows for atoms that were actually tested (`source =
"direct"`) or inferred as mastered via transitivity (`source =
"inferred"`). Atoms the diagnostic never covered (`source =
"not_tested"`) must NOT get rows. This allows `computeMasteryAsMap` to
correctly categorize atoms: rows → `"direct"`, no row → `"not_tested"`.

**Rationale**: Starting with confirmed unknowns gives the student immediate
wins (they address real gaps), while starting with untested atoms may waste
time on things the student already knows but we could not verify.

### 3.6 Route Building

1. Filter atoms by axis with positive unlock scores
2. Sort by efficiency (descending)
3. Include top atoms plus all their unmastered prerequisites (up to
   `maxAtoms = 10` per route)
4. Topologically sort so prerequisites come first
5. Simulate mastery step-by-step, counting questions unlocked at each step
6. Rank routes by estimated PAES improvement (descending)

### 3.7 Competitive Routes

A second route is shown if it achieves >= 80% of the top route's estimated
points gain (`COMPETITIVE_THRESHOLD = 0.8`). This gives the student a
meaningful choice between axes.

### 3.8 Mastery Transitivity

When used for diagnostic inference (not learning):

- If atom X is mastered, ALL its prerequisites are also considered mastered
  (recursively DOWN the chain)
- Direct test results are never overridden by transitivity
- Negative transitivity does NOT apply (failing X does not mark prereqs as failed)

**For learning routes**: Transitivity is a COST, not a bonus. The student
must teach/master all prerequisites BEFORE attempting an advanced atom.

### 3.9 Constants

| Constant | Value | Location |
|---|---|---|
| `UNLOCK_WEIGHTS.immediateUnlock` | 10.0 | `scoringConstants.ts` |
| `UNLOCK_WEIGHTS.twoAway` | 3.0 | `scoringConstants.ts` |
| `UNLOCK_WEIGHTS.threeOrMore` | 1.0 | `scoringConstants.ts` |
| `MINUTES_PER_ATOM` | 20 | `scoringConstants.ts` (mini-clase only) |
| `EFFECTIVE_MINUTES_PER_ATOM` | 38 | `scoringConstants.ts` (includes SR, test, verification overhead) |
| `NUM_OFFICIAL_TESTS` | 4 | `scoringConstants.ts` |
| `COMPETITIVE_THRESHOLD` | 0.8 | `nextAction.ts` |
| `ROUTE_ATOM_PREVIEW_COUNT` | 3 | `nextAction.ts` |
| `maxAtoms` per route | 10 | `routeOptimizer.ts` |

---

## 4. Mini-Clase (Adaptive Mastery) Algorithm

Each mini-clase = 1 lesson + 1 adaptive question session per atom.

### 4.1 Flow

1. **Lesson**: Paginated HTML content (1-3 worked examples). Split by
   `<h2>`, `<h3>`, or `<hr>` tags.
2. **Adaptive Questions**: Start at EASY, progress through MEDIUM to HARD.
3. **Feedback**: After each answer — choice-level feedback + expandable
   general solution.
4. **Outcome**: Mastery, Failure, or max questions reached.

### 4.2 Difficulty Progression

Students always start at EASY. Difficulty changes based on streaks of 2:

| Current Level | After 2 Correct | After 2 Wrong |
|---|---|---|
| Easy | -> Medium | Stay at Easy |
| Medium | -> Hard | -> Easy |
| Hard | Stay at Hard | -> Medium |

### 4.3 Mastery Criteria

ALL must be true:

- `consecutiveCorrect >= 3`
- `hardCorrectInStreak >= 2` (at least 2 of those 3 consecutive answers
  were at HARD difficulty)

### 4.4 Failure Criteria

ANY of:

- `consecutiveIncorrect >= 3` — fundamental misunderstanding
- `totalQuestions >= 10 AND correctQuestions / totalQuestions < 0.70` —
  consistent struggle
- `totalQuestions >= 20` without mastery — hard cap to prevent
  wheel-spinning

### 4.5 Session Limits

- Max 20 questions per attempt
- Up to 3 attempts per atom (`MAX_ATTEMPTS = 3`)
- No repeat questions across attempts for same user+atom

### 4.6 Question Selection

- Source: `generated_questions` table (AI-generated per atom at 3 difficulty
  levels)
- Target difficulty mapped via `DIFF_MAP`: easy->low, medium->medium,
  hard->high
- Fallback order when no questions at target: `DIFF_FALLBACKS`
  (e.g. low -> [medium, high])
- Excludes all previously seen questions for this user+atom

### 4.7 Question Pool Per Atom

| Difficulty | Recommended |
|---|---|
| Easy | 14 |
| Medium | 18 |
| Hard | 14 |
| **Total** | **46** |

### 4.8 On Mastery

After mastery is achieved, the system must (in order):

1. Record mastery: upsert `atom_mastery` with `isMastered: true`
2. Compute mastery quality: `determineMasteryQuality(totalQuestions,
   accuracy, medianResponseTimeSec)` — see section 7.2 for fluency gates
3. Initialize SR schedule: call `initializeReviewSchedule(userId, atomId, masteryQuality)`
4. Apply implicit repetition: call `applyImplicitRepetition(userId, atomId)`
5. Check cooldown expiry: call `checkCooldownExpiry(userId, masteredAtomId)`
6. Increment session counters: call `incrementSessionCounters(userId)`
7. Advance to next highest-ROI feasible item (new atom or SR block)

### 4.9 On Failure

After failure, the system must:

1. Start prerequisite scan: call `startPrereqScan(userId, atomId)` (see
   section 5)
2. Increment session counters: call `incrementSessionCounters(userId)`
3. Return scan status in API response so UI can show what happens next

---

## 5. Prerequisite Scan Protocol

### 5.1 Trigger

- Mini-clase failure (for atoms with prerequisites)
- SR review failure (for atoms with prerequisites, via `handleReviewFailures`)

If the failed atom has NO prerequisites, skip directly to cooldown (section 6).

### 5.2 Process

1. Get **direct** prerequisites for the failed atom (one level, not
   recursive — v1 simplification; recursive scanning deferred)
2. For each prerequisite:
   - Present **1 hard question** from `generated_questions`
   - Prefer hard; fall back to medium if no unseen hard questions remain
   - If **correct**: prereq is solid, move to next
   - If **incorrect**: gap found — stop scanning, focus on this prereq

### 5.3 Outcomes

**Gap found:**
- Mark prerequisite atom as `not_mastered` (set `atom_mastery.status` to
  `in_progress`)
- Recalculate learning path immediately — the gap prereq becomes the
  next study target
- Student's next mini-clase is this prerequisite (gap-fill)
- After mastering it, re-attempt the original atom

**No gap found (mastery failure):**
- All prereqs are solid; apply cooldown to the failed atom (section 6)

**No gap found (SR review failure):**
- All prereqs are solid; halve the review interval (min 1) and reset
  `sessionsSinceLastReview` to 0, keeping the atom mastered (section 7.9)

### 5.4 Constants

| Constant | Value |
|---|---|
| `COOLDOWN_MASTERY_COUNT` | 3 |
| Questions per prereq | 1 |
| Question source | `generated_questions` |
| Question difficulty | Hard (medium fallback) |

---

## 6. Cooldown Mechanism

When an atom fails but all prerequisites are verified solid:

- Set `cooldownUntilMasteryCount = 3` on the failed atom's `atom_mastery` row
- The learning route algorithm skips this atom until 3 other atoms have been
  mastered
- On each new atom mastery, decrement `cooldownUntilMasteryCount` for all
  atoms in cooldown (via `checkCooldownExpiry`)
- When counter reaches 0, the atom becomes eligible for re-attempt

**Rationale** (Math Academy): "All it takes to rebound is a bit of rest
and a fresh pair of eyes."

---

## 7. Spaced Repetition (Activity-Based)

Inspired by Math Academy's FIRe (Fractional Implicit Repetition) system.
Pure time-based intervals break down for students with irregular activity.

### 7.1 Core Principles

- Reviews measured in **sessions**, not calendar days
- Each session has a **review budget** (capped fraction)
- Calendar time is a secondary signal (inactivity decay)
- Mixed question pool: PAES variant (alternate) questions first for
  exam-realistic context, generated questions as fallback for atoms
  without eligible variants (prerequisite-only or co-atom constraints)
- Balance rule: don't do too many reviews without completing new atoms
  in between

### 7.2 Initial Interval (Sturdiness)

After mastery, the initial review interval depends on mastery quality.
Quality is determined by accuracy, question count, AND response-time
fluency (median seconds per answer):

| Sturdiness | Accuracy + Questions | Fluency Gate | First Review |
|---|---|---|---|
| High | <= 10 Qs, > 85% accuracy | median < 60s | 5 sessions |
| Medium | 11-17 Qs, 70-85% accuracy | median < 120s | 3 sessions |
| Low | 18-20 Qs, barely passed | any | 2 sessions |

**Fluency caps (conservative — only lowers sturdiness, never raises):**
- Median response time > 120s → cap at Low regardless of accuracy
- Median response time 60–120s → cap at Medium (High demoted)
- Median response time < 60s → no penalty

**Rationale** (Anderson, 1982; Pellegrino & Goldman): Speed of correct
retrieval predicts durable mastery vs. fragile knowledge that decays
quickly. A slow-but-accurate student still earns mastery but gets
reviewed sooner. Since PAES is timed, fluency also directly affects
test-day performance.

### 7.3 Interval Growth (On Successful Review)

| Accuracy | Growth Factor |
|---|---|
| > 85% | 2.5x |
| > 70% | 2.0x |
| Otherwise | 1.5x |

### 7.4 Session Budget

| Study Frequency | Review Budget | New Learning |
|---|---|---|
| Frequent (3+/week) | Up to 30% | 70% |
| Moderate (1-2/week) | Up to 20% | 80% |
| Rare (<1/week) | Up to 15% | 85% |

Hard cap: **max 5 review items per session**.

### 7.5 Review Due Logic

- An atom is due when `sessionsSinceLastReview >= reviewIntervalSessions`
- Ordered by `(sessionsSinceLastReview - reviewIntervalSessions)` DESC,
  then `reviewIntervalSessions` ASC (most overdue first, then most fragile)
- Capped by `getSessionBudget`

### 7.6 Implicit Repetition (Simplified FIRe)

When a student masters or reviews an advanced atom, its prerequisite atoms
get partial review credit:

| Hop Distance | Credit |
|---|---|
| Direct prerequisite | 1.0 (full reset of `sessionsSinceLastReview`) |
| 2-hop prerequisite | 0.5 (`sessionsSinceLastReview -= max(1, sessions/2)`) |
| 3-hop prerequisite | 0.25 |
| Beyond 3 hops | 0 |

**Example**: If atom A has prereqs B and C, and the student masters/reviews
A, then B and C get implicit review credit. This means reviewing A
effectively reviews B and C as well, reducing explicit review burden.

### 7.7 Inactivity Decay

If inactive > 14 days:
- Apply 2%/day decay to all review intervals
- Floor: 50% of original interval (never decay below half)

### 7.8 Review Construction

- Select atoms where `sessionsSinceLastReview >= reviewIntervalSessions`
- Cap at session budget (max 5)
- For each due atom, select one question using variant-first strategy:
  1. Find alternate (`source='alternate'`) questions where the atom is PRIMARY
  2. Eligibility filter: all OTHER primary atoms on the variant must be
     mastered by the student (prevents testing unlearned material)
  3. Freshness filter: exclude variants seen in full tests, diagnostics
     (`student_responses`), or prior SR sessions (`atom_study_responses`)
  4. If eligible unseen variant found → use it (PAES-realistic context)
  5. Else → fall back to generated hard question (current `generated_questions`
     path, unseen-first within the atom's generated pool)
- Mix atoms for interleaving (desirable difficulty)
- 1 question per review item (hard difficulty for generated, exam-level for variants)

### 7.9 SR Failure Protocol

When a student fails review questions:

1. Identify all atoms mapping to failed questions
2. For atoms WITH prerequisites: start `startPrereqScan` (section 5)
3. For atoms WITHOUT prerequisites: halve review interval (min 1), reset
   `sessionsSinceLastReview`
4. Gap found in scan → mark prereq `in_progress`, add to learning path
5. No gap in scan → halve interval for the failed atom (section 5.3)

### 7.10 Balance Rule

SR blocks should be inserted after every **3** newly mastered atoms
(`SR_BALANCE_THRESHOLD = 3`) OR when due by session count. The system
must not allow spaced repetition to dominate sessions at the expense of
forward progress. The session budget caps enforce this, but the UI should
also interleave new learning with reviews.

---

## 8. Retest (Full Timed Test) Gating

Use atom-mastery gating as the primary retest control.

### 8.1 Definitions

- `X` = minimum newly mastered atoms required to unlock retest eligibility
- `Y` = newly mastered atoms threshold to actively recommend retest
  (`Y >= X`)
- Qualifying SR mastery evidence can increment mastered-atom progress

### 8.2 Policy

0. **First full test:** available immediately after diagnostic — the
   diagnostic is a rough screen (16 questions) and many atoms remain
   uncovered. Requiring study before the first real measurement would
   force students to study atoms they may already know.
1. **Subsequent tests:** locked until the student masters at least `X` new
   atoms since the last full test
2. Once the student reaches `Y` new atoms, the system shows a clear
   **recommendation** to retest to recalibrate prediction quality
3. Enforce minimum spacing guard of **7-10 days** between full tests
4. Teacher/counselor can trigger earlier retest when model uncertainty is
   high

### 8.3 v1 Defaults

| Parameter | Value |
|---|---|
| X (unlock threshold) | 18 atoms |
| Y (recommend threshold) | 30 atoms |
| Minimum spacing | 7-10 days |
| Monthly cap | 3 full tests |

### 8.4 Incentivization in UI

- After X atoms: show "Puedes hacer un test completo para mejorar tu
  prediccion" (eligible, not pushy)
- After Y atoms: show strong recommendation banner "Te recomendamos hacer
  un test completo — has dominado Y conceptos nuevos"
- The full test must be **timed** and taken **within the platform** for
  the prediction to be recalibrated
- After completing a full test, the prediction source changes from "short
  diagnostic" to "full test" with higher confidence

### 8.5 What Counts

- Atoms mastered via mini-clase (primary source)
- Atoms mastered via successful SR review evidence (secondary source)
- Count only atoms mastered SINCE the last full test (or since diagnostic
  if no full test yet)

### 8.6 Full Test Mastery Integration

When a student completes a full timed test, the system processes all answers:

**Correct answers on mastered atoms:** Credit spaced repetition.
- Reset `sessionsSinceLastReview` to 0
- Update `lastDemonstratedAt` to now
- Boost `reviewIntervalSessions` by 1.5x (cap at 20)
- Recalculate `nextReviewAt`

A timed 60-question test is high-quality evidence of retention.

**Wrong answers on mastered atoms:** Flag as `needs_verification`.
- Set `status = 'needs_verification'`
- Do NOT immediately downgrade `isMastered`
- One wrong answer in a timed test may be a careless mistake

### 8.7 Verification Quiz Protocol

**Trigger:** Atoms in `needs_verification` status exist for the student
AND at least 24 hours have passed since they were flagged.

**Grace period (24h):** Verification is not surfaced immediately after a
full test. The 24-hour delay ensures one sleep-consolidation cycle,
reduces post-test ego depletion, and produces more reliable diagnostic
data (spacing effect). During this window `isMastered` stays true, so
the learning path still benefits from newly-proven atoms.

**Priority:** After the grace period, verification items are surfaced
with highest priority in the next-action engine (`primaryIntent:
"verification"`), above SR reviews and new atom study.

**Session construction:**
- `session_type = 'verification'`
- 1 hard generated question per `needs_verification` atom
- All items loaded into a single session

**On correct answer:**
- Restore `status = 'mastered'`
- Reset `sessionsSinceLastReview` to 0
- Update `lastDemonstratedAt` to now
- Framing: "Concepto confirmado — sigue contando como dominado."

**On incorrect answer:**
- Set `status = 'in_progress'`, `isMastered = false`
- Trigger prerequisite scan on the failed atom
- Framing: "Vacío detectado — lo agregaremos a tu camino de aprendizaje."

**Learning science basis:**
- Testing effect (Roediger & Karpicke, 2006): retrieval under different
  conditions is the gold standard for verifying knowledge
- Spacing effect: the delay between full test and verification quiz
  (next study session) creates productive spacing
- Avoids false negatives: one wrong answer in a timed test could be a
  careless mistake, hence verify rather than immediately penalize
- Self-determination theory: framing as "verificación rápida" rather
  than "you failed" preserves autonomy and competence

---

## 9. Score Prediction and Confidence

### 9.1 Prediction Source Hierarchy

| Source | Uncertainty | Label |
|---|---|---|
| Short diagnostic (16 questions) | HIGH | "Estimado desde diagnostico corto" |
| Full timed test (50+ questions) | LOW | "Basado en test completo" |

The dashboard must **always** clearly indicate which source the prediction
comes from.

### 9.2 Score Calculation (Diagnostic)

Formula: `score = 100 + 900 x normalizedScore x FACTOR_ROUTE x FACTOR_COVERAGE`

Where:
- `normalizedScore = weightedCorrect / maxWeightedScore`
- `FACTOR_ROUTE`: A=0.7, B=0.85, C=1.0
- `FACTOR_COVERAGE = 0.9`

Range: +/-5 questions using PAES score table.

### 9.3 Model Governance

- **Knowledge-based projection**: The projected score mid-line is purely
  knowledge-based. Questions whose atoms are mastered count as correct;
  locked questions use random-guess baseline (0.2). No accuracy modeling
  in the mid-line — knowledge determines the score.
- **No diagnostic ceiling**: The diagnostic ceiling has been removed from the
  progress chart. It was a rough initial estimate that added no value to the
  projection. The projection is driven purely by atom mastery and knowledge.
- **Confidence band**: Accuracy-derived uncertainty (from the student's
  demonstrated gap between knowledge and test performance) informs the
  band width only. Band range: 5–20% of projected score.
- **Atom model role**: Use atom mastery and route optimizer for
  next-best-action ranking and ROI estimation. Atom-derived knowledge
  IS the authoritative projection driver.
- **Evidence constraint**: Short diagnostics (16 questions) produce wider
  confidence bands. Full tests narrow the band. The product should prefer
  conservative band claims and strong actionability.

### 9.4 Simulation-Based Projection Model

The progress page projects score growth over 20 weeks using a
simulation-based model derived entirely from the system's atom-question
graph. No guessed constants — all inputs are system-derived.

**Architecture** (client-side for performance):

1. **Server** (one call on page load): builds the unlock curve + uncertainty
   metadata via `buildProjectionMetadata()` in `scoreHistory.ts`.
2. **Client** (`ProgressClient.tsx`): walks the curve at slider speed,
   computing projections instantly without API calls.

**Component 1 — Unlock Curve** (`buildUnlockCurve`):

Maps `[atomsMastered → questionsUnlocked]` using the actual atom-question
graph scoped to ~205 M1-relevant atoms and 202 official questions. Atoms
are ordered by marginal efficiency (high-impact first), respecting
prerequisite chains via DFS topological insertion.

Natural diminishing returns emerge from the graph structure:
- Prereq-only atoms → curve is flat (unlock 0 questions directly)
- High-value gating atoms → curve jumps
- Most impactful atoms are learned first → steeper early, flatter later

**Component 2 — Effective Throughput** (`EFFECTIVE_MINUTES_PER_ATOM`):

| Component | Minutes | Source |
|---|---|---|
| Mini-clase learning | 20 | `MINUTES_PER_ATOM` |
| SR review overhead | ~7 | `ceil(20 / SR_BALANCE_THRESHOLD=3)` |
| Full test overhead | ~9 | `ceil(150 / RETEST_ATOM_THRESHOLD=18)` |
| Verification overhead | ~2 | `ceil(30 / RETEST_ATOM_THRESHOLD=18)` |
| **Total** | **38** | Single constant for all surfaces |

`effectiveAtomsPerWeek = weeklyMinutes / EFFECTIVE_MINUTES_PER_ATOM`

**Component 3 — Knowledge-Based Score Model**:

Pure knowledge model — the projected score reflects what the student
knows, not test-day accuracy:
- Unlocked questions (all atoms mastered) = correct
- Locked questions (missing atoms) = random guess (0.20 for 5-option MCQ)

At each projected week:
`expectedCorrect = unlockedPerTest + 0.2 × lockedPerTest`
→ lookup in PAES score table for the projected PAES score.

**Confidence band** uses accuracy-derived uncertainty computed server-side:
`accuracyUncertainty = clamp(1 - accUnlocked, 0.05, 0.20)` where
`accUnlocked` is derived from the student's diagnostic performance via
`deriveUnlockedAccuracy()`. The band is `projectedMid ± projectedMid × uncertainty`.

### 9.5 Per-Test Study Hours

Study hour commitments are stored per test code in `student_test_hours`.
When computing `defaultAtomsPerWeek`, the system prefers the M1-specific
entry over the global `student_planning_profiles.weekly_minutes_target`.
The progress page slider persists changes to `student_test_hours` via
`PATCH /api/student/progress`.

### 9.6 Conservative Claims

Short diagnostics (16 questions) provide useful direction but not full graph
certainty. The product should prefer conservative score claims and strong
actionability over overconfident precision. Show effort in minutes-based
units ("minutos por punto" or "minutos por +10 puntos").

---

## 10. Dashboard Data Contracts (DRY)

### 10.1 Single Metrics Service

All UI surfaces (dashboard, learning path, goals, study result) must consume
metrics from a single shared service (`metricsService.ts`). No duplicate
calculations across components.

### 10.2 Core Metrics

| Metric | Definition | Scope |
|---|---|---|
| Conceptos dominados | Count of mastered atoms | Goal-relevant atoms only (not all 229) |
| % avance | `masteredAtoms / relevantTotalAtoms x 100` | Goal-relevant atoms only |
| Puntaje estimado | From diagnostic or full test | Labeled with source |
| Gap (points) | `targetScore - currentScore` (>= 0) | Primary M1 goal |
| Preguntas desbloqueadas | Questions with all primary atoms mastered | Official PAES only |
| Tiempo estimado a meta | `gapPoints x minutesPerPoint` | From top route |

### 10.3 Scoping Rule

Mastery metrics (conceptos dominados, % avance) must be scoped to atoms
reachable from the student's goal-relevant test questions, NOT all 229 atoms.
Showing "15/229 = 7%" is misleading and discouraging. Scoping to relevant
atoms gives a meaningful and motivating percentage.

### 10.4 Consistency Rule

These metrics must produce identical values everywhere they appear:
dashboard hero, progress section, learning path, study result panel, goals
page. A single computation, consumed by all.

---

## 11. Student Feedback UX Contracts

### 11.1 On Mastery (atom passed)

The result screen must show:

1. **Animated atom visual** — the atom "fills in" on a mini learning path
   visualization
2. **Questions unlocked count** — "Desbloqueaste X preguntas PAES"
3. **Next concept preview** — "Siguiente concepto: [atom name]" with
   visual preview and estimated time
4. **Motivational copy** — based on streak length and progress milestone
5. **Clear CTA** — "Siguiente concepto" button, visually prominent

Visual > textual. Prefer animations and icons over paragraphs of text.

### 11.2 On Failure (atom failed)

The result screen must explain what happens next:

**If prereq scan is starting:**
- "Vamos a verificar tus bases" — brief explanation
- Visual showing which prerequisite atoms will be checked
- "Siguiente paso" button routes to prereq scan flow

**If cooldown (no prereqs or all prereqs solid):**
- "Este concepto queda en pausa" — explain cooldown
- "Volveremos a este concepto despues de dominar 3 conceptos mas"
- Show which concept comes next
- "Siguiente concepto" button routes to next best action

### 11.3 On Gap Detection (after prereq scan)

When a prerequisite gap is found:

- "Detectamos un vacio en [prereq name]" — name the specific gap
- Visual path update: atoms "unfilling" to show the backtrack
- Motivational framing: "Esto es normal — reforzar bases acelera tu
  aprendizaje"
- Clear next action: "Vamos a reforzar [prereq name]" button

### 11.4 On Cooldown Applied

- "Este concepto necesita tiempo de descanso"
- "Domina 3 conceptos mas y lo intentaremos de nuevo"
- Show the next concept in the learning path
- "Continuar con [next atom name]" button

### 11.5 Principle: Visual > Textual

All feedback screens should prioritize visual elements:
- Animated atom nodes filling/unfilling
- Mini learning path showing position
- Progress rings or bars
- Clear, single-action CTA buttons (not multiple text links)

---

## 12. Goals and Objectives UX

### 12.1 Architecture: Student-Centric Objectives

The system uses a **student-centric** model for score objectives:

- **PAES score targets** (`studentScoreTargets`): the student owns one
  target per test code (M1, CL, CIENCIAS, HISTORIA, M2). These are
  general — not tied to any specific career.
- **Academic profile estimates** (`studentProfileScores`): NEM and
  Ranking estimates that evolve as the student's school year progresses.
- **Career interests** (`studentGoals`, used as bookmarks): up to 5
  career/university preferences. No per-career scores or buffers.
- **Career positioning engine** (`careerPositioning.ts`): given the
  student's targets + profile, computes how they position against any
  career's weighted formula and cutoff.

### 12.2 "Mis Objetivos" Page Layout

A **unified page with no tabs**. Three flowing sections:

**Section 1: "Mis objetivos de puntaje"**
- PAES score targets: M1, Comprensión Lectora, Electivo (Ciencias /
  Historia — system takes best), M2 (shown if any career requires it)
- Academic profile: NEM and Ranking with quieter visual treatment,
  framed as "tu estimación actual"
- Explicit "Guardar" button with unsaved-changes warning on navigation

**Section 2: "¿Dónde me posiciono?"**
- Live career positioning cards for each bookmarked career
- Each card shows: career name, university, progress bar
  (weighted score vs cutoff), status label, and margin
- "Agregar carrera" button opens autocomplete search
- Updates in real-time as score targets change

**Section 3: Career explorer** (below the fold)
- Full-text search across all offerings
- Inline positioning for any searched career
- "Agregar a mis intereses" button to bookmark

### 12.3 Saving Semantics

- Score targets and profile estimates: explicit save. Unsaved changes
  prompt a warning on navigation.
- Career positioning: computed live from saved targets. Adding/removing
  career bookmarks saves immediately.
- No separate simulator tab — positioning IS the simulation, driven by
  the student's own targets.

### 12.4 Progress Page Integration

- Single M1 target (from `studentScoreTargets`) with progress bar
- Career positioning summary: "Con tu objetivo, calificas para X de Y
  carreras de interés"
- Score journey chart shows one goal line (the student's M1 target)

### 12.5 Planning Mode (Onboarding)

4-step flow for new students:

1. **Career interest**: pick a career/university (exploratory language)
2. **Suggested target**: system suggests M1 based on career cutoff +
   30-pt margin; student adjusts freely
3. **Commitment**: study hours/week, PAES date
4. **Start diagnostic**: confirm and begin

---

## 13. Habit and Workload Policy

### 13.1 Daily and Weekly Targets

| Parameter | Value |
|---|---|
| Minimum | 1 atom/day (consistency floor) |
| Optimal | 2-4 atoms/day |
| High-intensity | Up to 6 atoms/day occasionally |
| Weekly target | 5+ active days/week |
| Daily streak condition | >= 1 mastered atom/day |

### 13.2 Reward Shaping

| Atoms in Day | Reward Level |
|---|---|
| 1-3 | Full progress reward |
| 4-5 | Reduced reward |
| 6+ | Minimal extra reward |

### 13.3 Quality Guard

If within-session accuracy drops or repeated failures appear, the system
suggests switching from new atoms to SR/review before continuing.

---

## 14. Student-Facing Terminology

| Internal Term | Student-Facing (Spanish) | Context |
|---|---|---|
| atom | concepto | Learning path, study headers |
| study session / mini-clase | mini-clase | CTAs, completion screens, emails |
| spaced repetition review | repaso | Learning path badges |
| learning route | camino recomendado | Dashboard |
| mastery | avance | Progress section |
| prerequisite scan | verificacion de bases | Failure screens |
| cooldown | pausa de descanso | Failure/cooldown screens |

Internal code (variable names, DB columns, API paths) uses the internal terms.

---

## 15. Schema Reference

### 15.1 `atom_study_sessions`

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| userId | uuid | FK to users |
| atomId | varchar(50) | FK to atoms |
| sessionType | enum | mastery, prereq_scan, review, verification |
| attemptNumber | integer | 1-3 |
| status | enum | lesson, in_progress, mastered, failed, abandoned |
| currentDifficulty | enum | easy, medium, hard |
| easyStreak | integer | Consecutive correct at easy |
| mediumStreak | integer | Consecutive correct at medium |
| hardStreak | integer | Consecutive correct at hard |
| consecutiveCorrect | integer | Global consecutive correct |
| consecutiveIncorrect | integer | Global consecutive incorrect |
| hardCorrectInStreak | integer | Hard corrects in current streak |
| totalQuestions | integer | Total questions attempted |
| correctQuestions | integer | Total correct answers |
| lessonViewedAt | timestamp | When lesson was viewed |
| startedAt | timestamp | Session start |
| completedAt | timestamp | Session end |

### 15.2 `atom_study_responses`

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| sessionId | uuid | FK to atom_study_sessions |
| questionId | varchar | FK to generated_questions |
| position | integer | Question order in session |
| difficultyLevel | enum | easy, medium, hard |
| selectedAnswer | varchar | Student's answer |
| isCorrect | boolean | Whether answer was correct |
| responseTimeSeconds | integer | Time taken |
| answeredAt | timestamp | When answered |

### 15.3 `atom_mastery` (additional fields for SR and cooldown)

| Column | Type | Description |
|---|---|---|
| cooldownUntilMasteryCount | integer | Atoms to master before cooldown expires |
| nextReviewAt | timestamp | Calendar hint for review |
| reviewIntervalSessions | integer | Primary SR interval |
| sessionsSinceLastReview | integer | Counter incremented per session |
| totalReviews | integer | Lifetime reviews |
| lastReviewResult | enum | pass, fail, null |

### 15.4 `question_atoms`

| Column | Type | Description |
|---|---|---|
| questionId | varchar(100) | FK to questions |
| atomId | varchar(50) | FK to atoms |
| relevance | enum | primary, secondary |
| reasoning | text | Why this mapping exists |

### 15.5 Key Enums

- `mastery_status`: not_started, in_progress, mastered, needs_verification, frozen
- `mastery_source`: diagnostic, practice_test, pp100, study
- `session_type`: mastery, prereq_scan, review, verification
- `session_status`: lesson, in_progress, mastered, failed, abandoned
- `session_difficulty`: easy, medium, hard
- `review_result`: pass, fail

---

## 16. Implementation Status

### 16.1 Algorithms — Wired

| Component | Status | Notes |
|---|---|---|
| Mini-clase mastery algorithm | WIRED | `atomMasteryAlgorithm.ts` |
| Mini-clase engine (DB ops) | WIRED | `atomMasteryEngine.ts` |
| Question unlock scoring | WIRED | `questionUnlock/unlockCalculator.ts` |
| Route optimization | WIRED | `questionUnlock/routeOptimizer.ts` |
| Next action computation | WIRED | `nextAction.ts` |
| Dashboard M1 data | WIRED | `dashboardM1.ts` |
| Goals read/write | WIRED | `goals.read.ts`, `goals.write.ts` |
| Admission simulator | WIRED | `simulator.ts` |
| Journey state routing | WIRED | `journeyState.ts`, `journeyRouting.ts` |

### 16.2 Algorithms — Recently Wired

| Component | Status | File | Notes |
|---|---|---|---|
| SR schedule init after mastery | WIRED | `atomMasteryEngine.ts` | Calls `initializeReviewSchedule` on mastery |
| Session counter increment | WIRED | `atomMasteryEngine.ts` | Calls `incrementSessionCounters` on mastery/failure |
| Implicit repetition | WIRED | `atomMasteryEngine.ts` | Calls `applyImplicitRepetition` on mastery |
| Inactivity decay | WIRED | `atomMasteryEngine.ts` | Calls `applyInactivityDecay` on session creation |
| Cooldown expiry check | WIRED | `atomMasteryEngine.ts` | Calls `checkCooldownExpiry` on mastery |
| Prereq scan on mastery failure | WIRED | `atomMasteryEngine.ts` | Calls `startPrereqScan` on failure |
| Retest gating | IMPLEMENTED | `retestGating.ts` | X=18 unlock, Y=30 recommend, 7-day spacing |
| Confirmed-unknown priority | IMPLEMENTED | `unlockCalculator.ts`, `profile/route.ts` | 1.5x multiplier; diagnostic only persists tested/inferred atoms |
| Per-test question normalization | FIXED | `routeOptimizer.ts` | Route ranking now uses `estimatedPointsGain` |
| Shared metrics service | IMPLEMENTED | `metricsService.ts` | Single source of truth for mastery metrics |
| Diagnostic source indicator | IMPLEMENTED | `DashboardSections.tsx` | Shows source label + retest CTA |
| Scoped mastery metrics | IMPLEMENTED | `metricsService.ts` | Scoped to question-linked atoms |
| Full test SR credit | IMPLEMENTED | `fullTest.ts` | Resets SR counters for correct on mastered |
| Full test discrepancy flagging | IMPLEMENTED | `fullTest.ts` | Flags wrong on mastered as needs_verification |
| Verification quiz engine | IMPLEMENTED | `verificationQuiz.ts` | 1 hard Q per flagged atom, restore/downgrade |
| Question freshness (gen. Qs) | IMPLEMENTED | `questionQueries.ts` | Shared `getSeenQuestionIds` for SR, scan, verification |
| Question freshness (full test) | IMPLEMENTED | `fullTest.ts` | Per-student test assembly with unseen-first selection |
| SR variant-first review | IMPLEMENTED | `questionQueries.ts`, `spacedRepetition.ts` | `findBatchReviewVariants` with co-atom eligibility + unseen filter, generated fallback |

### 16.3 UI — Implemented

| Component | Status | Notes |
|---|---|---|
| Dashboard hero (score, band, gap) | IMPLEMENTED | `DashboardSections.tsx` |
| Mission ring | IMPLEMENTED | `DashboardSections.tsx` |
| Progress section | IMPLEMENTED | `DashboardSections.tsx` |
| Effort slider | IMPLEMENTED | `DashboardSections.tsx` |
| Learning path timeline | IMPLEMENTED | `LearningPathSection.tsx` |
| Next action CTA | IMPLEMENTED | `NextActionSection.tsx` |
| Study flow (atom) | IMPLEMENTED | `AtomStudyView.tsx` |
| Goals editor | IMPLEMENTED | `GoalsEditorSection.tsx` |
| Simulator | IMPLEMENTED | `SimulatorSection.tsx` |

### 16.4 UI — Recently Updated

| Component | Status | Notes |
|---|---|---|
| Atom result panel (pass) | OVERHAULED | Animated stats, mini path, questions unlocked, next preview |
| Atom result panel (fail) | OVERHAULED | Prereq scan explanation, cooldown explanation |
| Gap detection feedback | IMPLEMENTED | Shows prereq scan status and gap messaging |
| Goals page layout | OVERHAULED | Tabbed interface: Metas (save) vs Simulador (auto) |
| Diagnostic source label | IMPLEMENTED | Banner with source label + retest CTA |
| Retest encouragement | IMPLEMENTED | Shows eligibility/recommendation based on atoms mastered |
| Animated learning path | PARTIAL | Mini path with animated atom nodes on result panel |
| Verification quiz UI | IMPLEMENTED | `VerificationView.tsx` with feedback per answer |
| Verification banner | IMPLEMENTED | `LearningPathSection.tsx` prioritized CTA |

---

## 17. Research Basis

- **3-in-a-row (3CCR)**: ASSISTments, Mathia — reduces guess-based false
  positives
- **HARD items for mastery**: Avoids shallow mastery, promotes transfer
- **Failure rules**: Wheel-spinning literature — 3 consecutive errors or
  <70% over 10+
- **Streak-based transitions**: ALEKS, Direct Instruction — reduce noise
- **Session-based SR**: Adapted from Math Academy FIRe (Fractional Implicit
  Repetition)
- **Implicit repetition**: Advanced topic practice gives credit to
  prerequisites
- **Cooldown mechanism**: Math Academy — "all it takes to rebound is a bit
  of rest and a fresh pair of eyes"
- **Prerequisite diagnosis**: Targeted scanning for knowledge gaps
- **Distributed practice**: Research supports spacing over massed cramming
- **Self-determination theory**: Autonomy + competence framing
- **Conservative score claims**: Short adaptive tests have higher measurement
  uncertainty in low-information zones
