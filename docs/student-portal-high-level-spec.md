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

## Onboarding and Entry Model
Recommended model: `soft gate with structured unlock`

Flow:
1. Student creates account
2. Student sets goals (career/university exploration first)
3. Student can explore simulator in "planning mode"
4. Personalized learning path and predictions remain locked until diagnostic completion
5. Student completes M1 diagnostic
6. M1 personalized dashboard unlocks immediately

Rationale:
- Maintains autonomy and motivation while preserving rigor before personalization
- Works better for hesitant students who are still defining goals

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
- Estimated study hours required
- Forecast curve to exam date by weekly effort

Allow:
- Adjust weekly study hours and see projected M1 curve
- Adjust M1 target and recalculate effort requirement

Do not present "true global prediction" unless diagnostics for all required tests are available.

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

## Research Alignment Appendix (External Benchmarks)

### What top systems do vs Arbor strategy

1. **Math Academy (official pedagogy + AI docs)**
- Benchmark pattern:
  - Knowledge graph with prerequisites
  - Adaptive diagnostic
  - Task selection for maximum learning per unit time
  - Spaced repetition with implicit transfer across related knowledge
- Alignment with Arbor:
  - Strong alignment with atom graph, prerequisite logic, ROI path optimization, and SR + transfer probing
- Keep/change:
  - **Keep** current core strategy
  - **Add** explicit UI copy around \"learning per hour\" as a first-class metric
- Sources:
  - https://www.mathacademy.com/how-our-ai-works
  - https://www.mathacademy.com/how-it-works
  - https://www.mathacademy.com/pedagogy

2. **Duolingo (official research/product science)**
- Benchmark pattern:
  - Habit-first mechanics (daily consistency, streak behavior)
  - Bite-sized sessions
  - Personalized difficulty/modeling (Birdbrain)
  - Constant experimentation and outcome tracking
- Alignment with Arbor:
  - Good alignment on adaptivity and short learning loops
  - Current Arbor strategy is less explicit on habit scaffolding
- Keep/change:
  - **Keep** mastery rigor and path optimization
  - **Add** a minimal daily commitment mechanic (for example, 10-15 minutes)
    to improve consistency without replacing deep-study goals
- Sources:
  - https://blog.duolingo.com/how-duolingo-streak-builds-habit/
  - https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/
  - https://blog.duolingo.com/results-duolingo-efficacy-studies/

3. **ALEKS / MATHia style mastery systems**
- Benchmark pattern:
  - Periodic reassessment cycles after learning intervals
  - Skill-probability mastery and remediation states
  - Detection of persistent gaps and targeted intervention
- Alignment with Arbor:
  - High alignment with retest gating, SR gap detection, and failed-atom remediation
- Keep/change:
  - **Keep** `X/Y` retest gating and direct-atom rescans after ambiguous SR failures
  - **Add** teacher-facing uncertainty and remediation flags in B2B views from day one
- Sources:
  - https://www.sciencedirect.com/science/article/pii/S0022249621000134
  - https://support.carnegielearning.com/help-center/math/teaching-strategies/
    educators/teaching-strategies/mathia/getting-started-in-mathia/article/
    understanding-mastery-and-concept-builder-workspaces-in-mathia/
  - https://www.carnegielearning.com/texas-help/article/understanding-the-skills-report/

### Chile-relevant behavioral evidence

PISA 2022 evidence shows Chile among systems with relatively high mathematics
anxiety, and anxiety is linked to lower performance and avoidance behavior.
This supports:
- separating aspiration planning from performance prediction
- keeping feedback concrete and actionable (\"next best action\")
- avoiding overly punitive high-frequency retest loops
- using consistency-first goals with flexible catch-up to reduce anxiety-friction

Sources:
- https://www.oecd.org/en/publications/pisa-2022-results-volume-v_c2e44201-en/full-report/component-12.html
- https://www.oecd.org/en/publications/pisa-2022-results-volume-i-and-ii-
  country-notes_ed6fbcc5-en/chile_d038b73d-en.html

### PAES admissions data implications

Admission is determined by career/university-specific weighting and annually
updated official information. Product implication:
- store versioned cutoff/ponderación datasets
- display dataset date/version in simulator UX
- clearly label when non-M1 scores are user-entered assumptions

Sources:
- https://portaldemre.demre.cl/paes/postulacion/como-postulo-a-una-universidad/paso2-seleccion-carreras
- https://portaldemre.demre.cl/paes/factores-seleccion/notas-ensenanza-media
- https://portaldemre.demre.cl/paes/factores-seleccion/
  tabla-transformacion-puntajes-paes-regular-p2025-m1

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
