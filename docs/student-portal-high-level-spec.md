# Student Portal High-Level Specification (Locked Draft)

## Context and Priority
This specification reflects product decisions as of March 3, 2026.

Primary strategy:
- `B2B schools`
- Optimize for `learning effect` first, then engagement/conversion

## Product North Star
Help each student close the gap between:
- `Current predicted score` (by PAES test)
- `Target weighted admission score` for selected career/university options

Secondary goal:
- Maximize confidence in score outcomes through repeated evidence (mastery + checkpoint tests)

## Fixed Decisions
1. Prioritize learning outcomes over funnel optimization
2. Use cutoff reference with an explicit safety buffer
3. Keep score targets adjustable independently per PAES test
4. Separate:
- Goal-setting and admissions simulation
- Per-test improvement prediction and effort planning
5. Current supported diagnostic: `M1` only
- Global prediction only when all relevant test diagnostics exist
- Until then, global simulation uses user-entered values for non-diagnosed tests

## Onboarding and Entry Model (Portal-First, Live Product)
Decision update (March 4, 2026):
- Arbor PreU is now a live portal, not a waitlist product.
- Remove "we will notify you when we launch" framing from landing, diagnostic,
  and all lifecycle emails.
- Every major screen must end with a concrete in-product next action.

Recommended model: `soft gate with structured unlock`

Canonical sequence:
1. Student authenticates (Google in v1)
2. Student defines target in planning mode (`/portal/goals?mode=planning`)
3. Student starts and completes M1 diagnostic
4. Student receives immediate handoff to first study action
5. Student enters active weekly mission loop in portal

Why this remains the right model:
- Keeps aspiration and planning first, which reduces overwhelm at entry.
- Preserves rigor by locking personalized predictions until diagnostic evidence.
- Makes post-diagnostic value immediate (study sprint and mission), not deferred.

### Journey State Model (Source of Truth)
State set:
- `anonymous`: not authenticated
- `planning_required`: authenticated, no diagnostic snapshot yet, no completed
  planning+diagnostic path
- `diagnostic_in_progress`: started diagnostic, not finished
- `activation_ready`: diagnostic completed, ready for first mission/sprint
- `active_learning`: at least one completed sprint or active weekly mission

Routing contract:
- `anonymous` -> `/auth/signin` with callback to requested page
- `planning_required` -> `/portal/goals?mode=planning`
- `diagnostic_in_progress` -> `/diagnostico` (resume)
- `activation_ready` -> `/portal` (first action visible above the fold)
- `active_learning` -> `/portal` (mission + next best action)

### Case-by-Case User Journeys (Must Be Implemented Consistently)
1. New student from landing (not authenticated)
- Landing primary CTA: "Crear mi plan y empezar diagnóstico"
- Flow: sign in -> planning mode -> diagnostic -> handoff -> portal
- Never drop to a dead-end "thanks, we will contact you" page

2. Returning student from landing (signed out)
- Flow: sign in -> state-based redirect
- If unfinished diagnostic exists, land directly in diagnostic resume
- If diagnostic already complete, land directly in portal dashboard

3. Authenticated student with no planning yet
- Entering `/portal` or `/portal/goals` lands in planning mode
- Planning mode has one primary CTA: "Empezar diagnóstico (15 min)"
- Secondary action: "Guardar y continuar después"

4. Authenticated student with planning done but no completed diagnostic
- `/portal` shows locked dashboard shell with one dominant CTA to diagnostic
- CTA copy explains value and time: "Completar diagnóstico para desbloquear tu
  plan personalizado (15 min)"

5. Authenticated student with diagnostic in progress
- Resume from exact saved point whenever possible
- Provide explicit "guardar y salir" behavior and resume confirmation
- Returning from email/deep-link must keep state and callback context

6. Authenticated student right after diagnostic completion
- Show immediate handoff with two actions:
  - Primary: "Comenzar sprint de hoy"
  - Secondary: "Ajustar meta"
- Entering portal afterwards must show the same first action priority

7. Active student in weekly loop
- `/portal` starts with mission status, current-vs-target, and next action
- `/portal/study` starts sprint quickly with minimal preamble
- `/portal/goals` remains available as an intentional secondary surface

### UX Clarity Rules Across All Cases
- Keep one dominant primary CTA per screen.
- Keep vocabulary stable across product and email:
  - `meta` -> `diagnóstico` -> `sprint` -> `misión semanal`
- Always show "what happens next" and estimated effort/time.
- Use progress/status indicators for long or multi-step tasks.
- Prefer recognition over recall: prefill known context and show recent state.

## Email and Notification Lifecycle (Portal-Live)
Objective:
- Email must move students to the next concrete step in the portal, not announce
  future availability.

### Message Types
1. Transactional emails (event-critical)
- Account and sign-in confirmations
- Save-and-resume confirmation for interrupted diagnostic/planning
- Diagnostic completion summary with direct CTA to first sprint

2. Lifecycle nudges (state-driven)
- Planning started but not saved
- Diagnostic started but not completed
- Diagnostic completed but first sprint not started
- Weekly mission kickoff and check-in
- Inactivity reactivation based on last study activity

3. Optional digest emails
- Weekly progress summary for active students
- Include clear benefit and one next action only

### Trigger Policy by Journey State
1. `planning_required`
- Trigger: no planning save after first authenticated session
- Send: reminder with direct link to planning mode
- Stop condition: planning saved

2. `diagnostic_in_progress`
- Trigger: diagnostic started, incomplete after inactivity window
- Send: resume link to exact diagnostic state
- Stop condition: diagnostic completed

3. `activation_ready`
- Trigger: diagnostic completed, no sprint started
- Send: "start first sprint" email with effort and expected impact context
- Stop condition: first sprint started

4. `active_learning`
- Trigger: weekly mission cycle and inactivity windows
- Send: mission kickoff, checkpoint reminder, and recovery nudge
- Stop condition: weekly mission complete or user reactivates

### Email Copy and Delivery Rules
- Each email must have exactly one primary CTA.
- Include destination and expected effort in copy ("10-15 min", "5 preguntas").
- Deep links must preserve auth callback and return to exact pending task.
- Suppress outdated emails once the target action is completed.
- Frequency guardrails for lifecycle (non-transactional) messages:
  - max 1 per day
  - max 3 per week
- Respect local time windows to avoid late-night sends.

## Landing Page UX Decision Set (Production)
Goal:
- Make landing a high-clarity router into the right next action for each user
  state, with minimal ambiguity and no dead-end outcomes.

### Landing Behavior by Session State
1. Signed out
- Primary CTA: `Crear mi plan y empezar diagnóstico`
- Action: send user to auth, then route by journey state
- Secondary CTA: product explainer (non-blocking)

2. Signed in + `planning_required`
- Primary CTA: `Continuar planificación`
- Destination: `/portal/goals?mode=planning`
- Message: diagnostic unlocks after setting target

3. Signed in + `diagnostic_in_progress`
- Primary CTA: `Retomar diagnóstico`
- Destination: `/diagnostico` resume
- Message: preserve prior progress

4. Signed in + `activation_ready` or `active_learning`
- Primary CTA: `Ir a mi portal`
- Destination: `/portal`
- Message: immediate study action available

### Landing Content Contract
- Hero must state immediate value and time expectation (goal + diagnostic + first
  sprint), not future availability.
- "How it works" must map exactly to live flow:
  - Define target
  - Complete diagnostic
  - Start first sprint
- Every section CTA uses same destination logic as session-state router.
- Remove copy variants that imply waitlist, beta wait, or launch-not-ready status.
- Keep a single dominant CTA visual style per viewport.

## Cross-Entry Journey Matrix (Must Match Routing Logic)
1. Entry: `/` signed out -> auth -> resolver -> state route
2. Entry: `/portal` signed out -> auth -> callback `/portal` -> resolver
3. Entry: `/portal/goals` signed out -> auth -> callback `/portal/goals`
4. Entry: `/diagnostico` signed out -> redirect to auth with callback
   `/diagnostico`
5. Entry: `/diagnostico` signed in + `planning_required`:
- Redirect to planning mode before test start.
6. Entry: `/diagnostico` signed in + `diagnostic_in_progress`:
- Resume in-progress attempt.
7. Entry: `/diagnostico` signed in + `activation_ready`/`active_learning`:
- Route to `/portal` next action by default.
- Retest entry is a separate explicit action, not an implicit route side effect.
8. Entry from email links while signed out:
- Require auth, preserve callback, then route to exact pending task.
9. Entry from stale email links:
- Route to current canonical task and show context banner ("ya completaste X").

## UX Production Readiness Gates (Release Criteria)
No launch should be considered production-ready unless all gates pass.

### Clarity and Navigation
- User can always answer:
  - where they are
  - what happens next
  - how long next step takes
- No dead-end screen without primary next action.
- No contradictory CTA labels for same action across pages/emails.

### Accessibility
- Meet WCAG 2.2 AA on all core journey screens:
  landing, auth, goals planning, diagnostic, results handoff, portal dashboard,
  study sprint, and email templates.

### Performance
- Meet Core Web Vitals "good" thresholds at p75 for core pages:
  - LCP <= 2.5s
  - INP <= 200ms
  - CLS <= 0.1

### Reliability and Recovery
- Save-and-resume works for planning and diagnostic interruption paths.
- Auth callback preserves intended destination.
- Error states always provide recovery action, not just failure messaging.

### Messaging and Lifecycle
- Each lifecycle email maps to one journey state and one primary CTA.
- Suppression logic prevents outdated nudges after action completion.
- Frequency caps enforced for non-transactional lifecycle messages.

### Instrumentation
- Track every stage transition and drop-off point:
  landing CTA -> auth success -> planning saved -> diagnostic started/completed
  -> first sprint started -> weekly active.
- Publish weekly funnel report by state and entry-point.

## Goal-Setting Module (Independent Surface)
This is a standalone module, not mixed with learning analytics.

### Inputs
- Up to 3 primary career/university targets by default
- Optional extra exploratory targets for undecided students
- User-editable expected scores per PAES test (M1 and others)

### Outputs
- Weighted score per target based on current ponderaciones
- Last-year cutoff vs user-computed weighted score
- Explicit safety buffer (e.g., `+20`, `+30`, `+50`) shown as a separate control
- Sensitivity view: "If I move M1 by +10, what changes in admissibility?"

### UX Rules
- Always show "last cutoff" and "buffered target" as separate values
- Allow direct per-test slider/input manipulation
- Do not hide formula: expose weighting breakdown for trust and school transparency

## Improvement Prediction Module (Independent Surface)
This module is per-test and tied to actual measured mastery.

### For current scope (M1 only)
Show:
- M1 predicted score today (with confidence band)
- M1 target score chosen by user
- Gap in points
- Estimated study minutes required
- Effort scenario curve to exam date by weekly study load

Allow:
- Adjust weekly study hours and see projected M1 curve
- Adjust M1 target and recalculate effort requirement

Do not present "true global prediction" unless diagnostics for all required tests are available.

### Model Governance (Locked for v1)
To avoid contradictory projections in early evidence states:
- Score prediction authority:
  - Use the diagnostic score model as the only source of truth for `prediction min/max`.
  - Confidence band must come from diagnostic uncertainty handling, not atom-only extrapolation.
- Atom model role:
  - Use atom mastery and route optimizer for `next best action` ranking and ROI estimation.
  - Use atom-derived effort as study-planning signal, not as authoritative score forecast.
- Forecast UX rules:
  - Display effort in minutes-based units (`minutes per point` or `minutes per +10 points`).
  - Label slider output as effort scenario, not core prediction.
  - Cap scenario projection to the diagnostic prediction ceiling until new evidence
    (new diagnostic/retest) is collected.
  - v1 cap formula: `scenario_score = min(effort_scenario_projection, diagnostic_prediction_max)`.
- Evidence constraint:
  - Short diagnostics (v1: 16 questions) provide useful direction but not full graph certainty.
  - Product should prefer conservative score claims and strong actionability over overconfident precision.

## Main Dashboard Architecture
Top section:
- `M1 today vs M1 target`
- Gap and expected hours to close
- Confidence indicator

Second section:
- "Next best action" (highest expected score ROI)
- Score delta estimate + time cost

Third section:
- Learning queue (atoms + spaced repetition)

Fourth section:
- Access point to Goal-Setting Simulator (career/university admissibility)

## Learning Loop (Atom Level)
Maintain current mastery policy:
- Mastery: 3 consecutive correct, at least 2 at HARD
- Fail if 3 wrong in a row OR <70% after 10
- Continue to max 20, then fail if mastery not reached

On mastery:
- Move to next highest-ROI feasible item (new atom or SR block)

On fail:
1. Run prerequisite quick scan (hard probes)
2. Mark weak prerequisites as not mastered
3. Recompute path priorities
4. Resume from updated top ROI action

## Spaced Repetition Strategy (Learning-First)
Use hybrid SR queue with two item families:
1. Variant questions from official PAES mappings
2. Transfer probes on higher-order atoms implying prerequisite retention

Scheduling policy:
- Insert short SR blocks after every 2-3 newly mastered atoms OR when due by time
- Prioritize medium/hard retrieval (active recall, interleaving)
- Keep sessions short to avoid reducing forward velocity
- Use SR outcomes as mastery evidence updates when atom evidence is attributable

## Habit and Workload Policy (Student Portal)
Goal: maximize sustained learning without incentivizing burnout.

Policy:
1. Daily streak condition is binary: `>=1 mastered atom/day`.
2. Weekly success is primary: target `5+ active days/week`, with weekend catch-up allowed.
3. Daily guidance:
- Minimum: `1 atom/day` (consistency floor)
- Optimal: `2-4 atoms/day` for most students
- High-intensity: up to `6 atoms/day` occasionally
4. Reward shaping:
- Atoms 1-3 in a day: full progress reward
- Atoms 4-5: reduced reward
- Atom 6+: minimal extra reward
5. Quality guard:
- If within-session accuracy drops or repeated failures appear, system suggests switching
  from new atoms to SR/review before continuing.

Rationale:
- Consistency improves habit stability; strict all-or-nothing daily rules are unnecessary.
- Distributed learning outperforms massed cramming for retention.
- Diminishing external rewards protect intrinsic motivation while still recognizing effort.

Evidence boundary:
- Research supports the direction (consistency, spacing, retrieval, motivation effects).
- Exact cutoffs (`2-4 atoms/day`, reward breakpoints at 3/5/6) are product calibration
  defaults and should be tuned with pilot data.

## Full-Test Cadence Policy (Recommended)
Use `atom-mastery gating` as the primary retest control.

Definitions:
- `X` = minimum newly mastered atoms required to unlock retest eligibility
- `Y` = newly mastered atoms threshold to actively recommend retest (`Y >= X`)
- For retest gating, qualifying SR mastery evidence can increment mastered-atom progress

Policy:
1. Full retest stays locked until the student masters at least `X` new atoms since the last full test.
2. Once the student reaches `Y` new atoms, the system shows a clear recommendation to retest to recalibrate prediction quality and reduce drift.
3. Enforce a minimum spacing guard of 7-10 days between full tests, even if `X`/`Y` conditions are met.
4. Teacher/counselor can trigger earlier retest only when model uncertainty is high or intervention is needed.

Suggested v1 defaults:
- `X = 18`
- `Y = 30`

Guardrails:
- Target typical usage of ~1 to 2 full tests per month
- Hard cap at 3 per month to prevent over-testing fatigue

Why this policy:
- Keeps retests tied to real learning change
- Preserves instructional time
- Reduces prediction drift by prompting recalibration after meaningful mastery gains

## SR Gap Detection and Mastery Status Updates
Spaced repetition is also a diagnostic signal, not only a retention mechanism.

Rules:
1. If SR questions map cleanly to single atoms, update those atom mastery statuses directly from SR evidence.
2. If SR uses multi-atom PAES-style items and the student fails, trigger a direct-atom scan for atoms mapped to failed items.
3. Direct-atom scan uses short hard probes per mapped atom to isolate the specific gap.
4. Atoms that fail the scan are marked `not mastered` and reinserted into the optimization queue.
5. Recompute learning path immediately after status updates.

## B2B School Layer Requirements
- Teacher/counselor view should track:
- student target definition quality
- current per-test gap
- confidence and uncertainty trends
- effort vs progress adherence

Trust requirements:
- Show transparent formula and assumptions
- Show date/version for cutoff and weighting datasets
- Flag when values are student-entered vs system-estimated

## Research Grounding Used for These Decisions
- Retrieval practice and distributed practice repeatedly show strong learning effects in classroom research and meta-analysis.
- Self-determination theory supports autonomy + competence framing.
  This aligns with controllable per-test goals plus rigorous evidence gates.
- High-stakes practice test evidence suggests repeated practice helps up to a point.
  Excessive frequency can reduce efficiency, supporting gated retest thresholds.
- Short adaptive/IRT-style assessments have higher measurement uncertainty in low-information zones.
  This supports using explicit prediction bands and conservative claims for early snapshots.

## Remaining Implementation Decisions
1. Default safety buffer value (`+20` vs `+30` vs adaptive by competitiveness)
2. Final threshold values for full-test unlock conditions
3. Confidence-band UI style for M1 prediction (single interval vs tiered confidence)
4. Rules for expanding beyond 3 targets for undecided students

## Suggested v1 Defaults
- Default targets: up to 3, expandable to 6 in exploration mode
- Default safety buffer: +30 points (editable)
- Habit target: `>=1 mastered atom/day`, with weekly goal of `5+ active days`
- Recommended daily load: `2-4 atoms`; high-intensity up to `6` occasionally
- Reward curve: full (1-3), reduced (4-5), minimal (6+)
- Full-test unlock threshold: `X = 18` newly mastered atoms
- Full-test recommendation threshold: `Y = 30` newly mastered atoms
- Minimum spacing between full tests: 7-10 days
- Monthly cap: 3 full tests

## References
- Progressive disclosure for novice-to-expert onboarding (NN/g):
  https://www.nngroup.com/articles/progressive-disclosure/
- Visibility of system status and clarity heuristics (NN/g):
  https://www.nngroup.com/articles/ten-usability-heuristics/
- Recognition over recall for resume and navigation clarity (NN/g):
  https://www.nngroup.com/articles/recognition-and-recall/
- Progress indicators for multi-step flows (NN/g):
  https://www.nngroup.com/articles/progress-indicators/
- User journeys in government digital services (GOV.UK Service Manual):
  https://www.gov.uk/service-manual/design/user-journeys
- Task-list pattern for linear, stateful journeys (GOV.UK):
  https://design-patterns.service.justice.gov.uk/patterns/task-list/
- Account creation + save-progress journey guidance (GOV.UK One Login):
  https://www.gov.uk/service-manual/design/designing-user-journeys-for-onelogin
- Save-and-return account pattern details (GOV.UK One Login):
  https://www.gov.uk/service-manual/design/designing-user-journeys-for-onelogin/let-users-create-account-save-progress
- Text nudging and parent engagement in education transitions (IES):
  https://ies.ed.gov/use-work/awards/text-based-nudging-and-parent-engagement?ID=312
- Effects of scaling behavioral interventions in online education (PNAS / PubMed):
  https://pubmed.ncbi.nlm.nih.gov/32571979/
- Interleaved practice in physics (npj Science of Learning, 2021):
  https://www.nature.com/articles/s41539-021-00110-x
- Spaced retrieval in STEM classrooms (Int. J. STEM Education, 2024):
  https://stemeducationjournal.springeropen.com/articles/10.1186/s40594-024-00468-5
- Classroom motivation and SDT needs (Frontiers in Psychology, 2019):
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6656925/
- Habit formation in daily behavior (Eur. J. Soc. Psych., 2010):
  https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674
- Distributed practice optimization (Exp. Psychology, 2009):
  https://pubmed.ncbi.nlm.nih.gov/19439395/
- Retrieval practice in real classrooms (Educ. Psych. Rev., 2021):
  https://link.springer.com/article/10.1007/s10648-021-09595-9
- Extrinsic rewards and intrinsic motivation meta-analysis (Psych. Bull., 1999):
  https://pubmed.ncbi.nlm.nih.gov/10589297/
- AI-enabled repeated practice tests in high-stakes setting
  (Duolingo English Test observational study, 2025 preprint):
  https://arxiv.org/abs/2508.17108
- Conditional/consistent standard error behavior in short adaptive testing:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7221492/
- CAT score comparability and conditional measurement uncertainty:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10664745/
