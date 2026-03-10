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

### 3.2 Per-Test Normalization

Questions appear across the 4 official PAES tests. When ranking routes:

- 1 question that appears across all 4 tests counts as **1/4 question per test**
  for route ranking purposes
- `additionalPerTest = totalQuestionsUnlocked / NUM_OFFICIAL_TESTS`
- PAES improvement is calculated from `additionalPerTest` via the PAES score table

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

- Atoms with `mastery_source = 'diagnostic'` and `isMastered = false` are
  **confirmed unknowns** — the student was tested and failed
- Atoms with `mastery_source = 'not_tested'` have **unknown status** — the
  short diagnostic (16 questions) could not determine mastery
- Confirmed unknowns must receive a priority multiplier in the unlock
  scoring, so the learning path starts with what we KNOW the student
  doesn't know

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
6. Rank routes by total questions unlocked (descending)

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
| `MINUTES_PER_ATOM` | 20 | `scoringConstants.ts` |
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
2. Initialize SR schedule: call `initializeReviewSchedule(userId, atomId, masteryQuality)`
3. Apply implicit repetition: call `applyImplicitRepetition(userId, atomId)`
4. Check cooldown expiry: call `checkCooldownExpiry(userId, masteredAtomId)`
5. Increment session counters: call `incrementSessionCounters(userId)`
6. Advance to next highest-ROI feasible item (new atom or SR block)

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

1. Get prerequisite chain for the failed atom (recursive, deepest first)
2. For each prerequisite:
   - Present **1 HARD question** (from `questions` + `questionAtoms` table,
     not `generatedQuestions`)
   - If **correct**: prereq is solid, move to next
   - If **incorrect**: gap candidate found
     - First pass: stop scanning, focus on this prereq
     - Allow up to **3 questions per prereq** across entire scan
3. Max 3 questions per prerequisite across the scan

### 5.3 Outcomes

**Gap found:**
- Mark prerequisite atom as `not_mastered` (set `atom_mastery.status` to
  `in_progress`)
- Recalculate learning path immediately — the gap prereq becomes the
  next study target
- Student's next mini-clase is this prerequisite (gap-fill)
- After mastering it, re-attempt the original atom

**No gap found:**
- All prereqs are solid; apply cooldown to the failed atom (section 6)

### 5.4 Constants

| Constant | Value |
|---|---|
| `COOLDOWN_MASTERY_COUNT` | 3 |
| Max questions per prereq | 3 |
| Question difficulty | HARD |

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
- Uses **alternate versions** of PAES official questions (not generated
  questions)
- Balance rule: don't do too many reviews without completing new atoms
  in between

### 7.2 Initial Interval (Sturdiness)

After mastery, the initial review interval depends on mastery quality:

| Sturdiness | Criteria | First Review |
|---|---|---|
| High | <= 10 questions, > 85% accuracy | 5 sessions |
| Medium | 11-17 questions, 70-85% accuracy | 3 sessions |
| Low | 18-20 questions, barely passed | 2 sessions |

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
- First session back: up to 40% review budget

### 7.8 Review Construction

- Select atoms where `sessionsSinceLastReview >= reviewIntervalSessions`
- Cap at session budget (max 5)
- Use **alternate** source questions (different PAES versions)
- Mix atoms for interleaving (desirable difficulty)
- 1 HARD question per review item

### 7.9 SR Failure Protocol

When a student fails review questions:

1. Identify all atoms mapping to failed questions
2. For atoms WITH prerequisites: start `startPrereqScan` (section 5)
3. For atoms WITHOUT prerequisites: halve review interval (min 1), reset
   `sessionsSinceLastReview`
4. Gap found in scan -> mark prereqs `not_mastered`, add to learning path
5. No gap -> halve interval for failed atoms

### 7.10 Balance Rule

SR blocks should be inserted after every 2-3 newly mastered atoms OR when
due by session count. The system must not allow spaced repetition to
dominate sessions at the expense of forward progress. The session budget
caps enforce this, but the UI should also interleave new learning with
reviews.

---

## 8. Retest (Full Timed Test) Gating

Use atom-mastery gating as the primary retest control.

### 8.1 Definitions

- `X` = minimum newly mastered atoms required to unlock retest eligibility
- `Y` = newly mastered atoms threshold to actively recommend retest
  (`Y >= X`)
- Qualifying SR mastery evidence can increment mastered-atom progress

### 8.2 Policy

1. Full retest stays **locked** until the student masters at least `X` new
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

### 9.3 Model Governance (Locked for v1)

- **Score prediction authority**: Use the diagnostic score model as the only
  source of truth for `prediction min/max`. Confidence band comes from
  diagnostic uncertainty, not atom extrapolation.
- **Atom model role**: Use atom mastery and route optimizer for next-best-action
  ranking and ROI estimation. Use atom-derived effort as a study-planning
  signal, NOT as authoritative score forecast.
- **Effort scenarios**: Label slider output as "escenario de esfuerzo", not
  core prediction. Cap scenario projection to diagnostic prediction ceiling
  until new evidence (retest).
- **Cap formula**: `scenario_score = min(effort_projection, diagnostic_prediction_max)`

### 9.4 Conservative Claims

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

### 12.1 Layout

The goals page uses a **tabbed interface** with two tabs:

**Tab 1: "Metas de admision"**
- Goal editor: up to 3 career/university preferences by priority
- Explicit "Guardar cambios" button
- Success confirmation on save

**Tab 2: "Simulador"**
- Admission simulator: score inputs per test, buffer, results
- Auto-computes on input change (no save button needed)
- Clearly labeled: "Este simulador no guarda cambios — es solo para
  explorar escenarios"

### 12.2 Saving Semantics

- Goals (Tab 1): explicit save. Unsaved changes prompt a warning on
  navigation.
- Simulator (Tab 2): no persistence. Draft scores used for computation
  only.
- The two tabs are visually and functionally separated so students know
  exactly what saves and what doesn't.

### 12.3 Score Targets

- Adjustable independently per PAES test (M1, M2, etc.)
- Safety buffer shown as a separate editable control
- Target = last-year cutoff + buffer
- Formula and weighting breakdown always visible for trust and transparency

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
| sessionType | enum | mastery, prereq_scan, review |
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

- `mastery_status`: not_started, in_progress, mastered, frozen
- `mastery_source`: diagnostic, practice_test, pp100, study
- `session_type`: mastery, prereq_scan, review
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
| Confirmed-unknown priority | IMPLEMENTED | `unlockCalculator.ts` | 1.5x multiplier for confirmed unknowns |
| Per-test question normalization | FIXED | `routeOptimizer.ts` | Route ranking now uses `estimatedPointsGain` |
| Shared metrics service | IMPLEMENTED | `metricsService.ts` | Single source of truth for mastery metrics |
| Diagnostic source indicator | IMPLEMENTED | `DashboardSections.tsx` | Shows source label + retest CTA |
| Scoped mastery metrics | IMPLEMENTED | `metricsService.ts` | Scoped to question-linked atoms |

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
