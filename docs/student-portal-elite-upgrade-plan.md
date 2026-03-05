# Student Portal Elite Upgrade Plan

## Context

- Date: March 5, 2026
- Goal: Reach top-tier product quality (Duolingo/Khan Academy/Acely standard) for PAES students
- Audience: Product, Design, Engineering, Data, Content
- Scope: Student portal v1 flow (`/`, auth, goals/planning, diagnostic handoff, `/portal`, `/portal/study`)

## North Star

Deliver a platform that is:

1. Intuitive in under 60 seconds for a stressed 17-year-old.
2. Emotionally safe and motivating under pressure.
3. Learning-effective, not just “engaging.”
4. Reliable and trustworthy every day on mobile.

## Non-Negotiable Outcomes (90 days)

1. Activation: `landing_cta -> first_sprint_started` +30% from current baseline.
2. Learning consistency: median weekly sessions per active student >= 3.
3. Retention: D7 retention +20% from current baseline.
4. Student clarity: >= 85% of students can explain “what to do next” in 1 sentence.
5. Reliability: < 0.5% user sessions with blocking errors.
6. Accessibility: WCAG 2.2 AA pass on all core screens.

## Critical Issues Found (Fix First)

### P0

1. Planning flow wipes previously entered score data.
2. Impact: trust break, progress loss, confusion, lower return rate.
3. Evidence: `handlePlanningSave` sends `scores: []`.
4. Code: `web/app/portal/goals/usePortalGoals.actions.ts` lines 269-277.

### P1

1. Planning mode can be forced by query param (`mode=planning`) regardless of journey state.
2. Impact: active students can enter an onboarding-only path and trigger destructive state changes.
3. Code: `web/app/portal/goals/page.tsx` lines 14, 35-50.

### P1

1. Sprint “Siguiente” stays enabled even when it no longer advances the learner.
2. Impact: dead-end feeling, repeated taps, frustration, drop risk.
3. Code: `web/app/portal/study/StudySprintView.tsx` lines 145-147, `web/app/portal/study/study-sprint-client.tsx` lines 21-25.

### P2

1. Raw backend error strings are shown directly to students.
2. Impact: anxiety, low trust, “broken app” perception.
3. Code: `web/app/portal/NextActionSection.tsx` lines 76-83, 211-212 and `web/app/portal/components/InlineRecoveryPanel.tsx` line 24.

### P2

1. Accessibility violations on landing page (contrast + heading order).
2. Impact: lower readability, compliance risk, worse mobile clarity.
3. Evidence: axe scan found 9 violations on `/`.
4. Likely code: `web/app/components/landing/MasterySection.tsx` lines 186, 190 and `web/app/components/landing/Footer.tsx` lines 39, 52, 74.

## Immediate Fix Plan (Sprint 1: 5-7 days)

### Functional stability

1. Preserve existing goal scores in planning save path.
2. Reject destructive save if existing primary goal has student-entered scores unless explicitly confirmed.
3. Add journey-state gate for planning mode.
4. Redirect `active_learning` and `activation_ready` users from `mode=planning` to canonical goals/dashboard path.
5. Fix sprint next-navigation affordance:
6. Disable `Siguiente` when it is a no-op, or change behavior to jump to first unanswered item with feedback.

### UX trust

1. Replace raw errors with student-safe microcopy:
2. “Tuvimos un problema cargando tu siguiente paso. Reintenta en 5 segundos.”
3. Keep technical detail for logs only (not UI).

### Accessibility

1. Fix contrast tokens on low-contrast text surfaces.
2. Fix heading hierarchy in footer and any modal structures.
3. Add automated a11y check in CI for landing/auth/portal core screens.

### Acceptance criteria

1. No score loss after entering/exiting planning mode.
2. `mode=planning` unavailable for non-`planning_required` journeys.
3. No dead-end “Siguiente” tap sequence in study sprint.
4. No raw backend error text visible in student UI.
5. Axe: zero critical/serious violations on public entry screens.

## Implemented Status (March 5, 2026)

Completed in code:

1. Planning save preserves existing student scores and prompts before destructive
   primary-goal switch.
2. Planning mode is journey-gated client-side; non-`planning_required` users
   are redirected away from planning mode.
3. Study sprint next navigation no longer allows passive skipping when current
   item is unanswered.
4. Next-action and inline recovery surfaces now use student-safe fallback copy
   (technical details stay in logs).
5. Landing accessibility polish shipped for identified contrast and heading
   hierarchy issues.
6. Example-modal copy quality fixes shipped:
   singular `1 pregunta` and suppression of `+0 preguntas` badges.
7. Example modal onboarding friction reduced by removing extra secondary CTA.
8. Landing daily-plan mock no longer shows stale fixed date wording.

Still open after implementation:

1. Dashboard semantics for students already above goal
   (`actual > target` should show explicit surplus state).
2. Planning-mode flash for active users before redirect
   (needs server-side/middleware gate before paint).
3. Example modal information density remains high for first-minute onboarding.
4. Human environment QA still required: real inbox rendering/click behavior,
   staging/prod smoke, and analytics/Sentry signoff.

## Local Browser QA Addendum (March 5, 2026)

Live browser QA run on local dev (`http://localhost:3000`) found additional
quality gaps that are clearly below elite benchmark.

### P1

1. Dashboard metric semantics break trust when student is already above goal.
2. Evidence: `/portal` shows `M1 actual: 878`, `Meta M1: 720`, but `Brecha: 0`
   and `Esfuerzo estimado: 0 min`.
3. Impact: student cannot tell whether they are ahead, done, or misconfigured.
4. Fix: show explicit surplus state (`Superaste tu meta por +158 pts`) and move
   CTA toward stretch goal or maintenance mission.

### P1

1. Landing example modal remains cognitively overloaded pre-signup.
2. Evidence: modal expands into dense cards/lists with long copy and multiple
   information layers before a user starts the real flow.
3. Impact: decision friction before activation and weaker first-minute clarity.
4. Fix: keep one primary CTA in modal and collapse secondary detail behind one
   optional “Ver detalle técnico” disclosure.

### P2

1. Brief planning-mode UI flash still appears for non-planning journeys.
2. Evidence: navigating to `/portal/goals?mode=planning` while active first
   renders planning screen, then redirects to `/portal`.
3. Impact: jarring transition and perceived routing instability.
4. Fix: enforce journey gate before paint (server-side redirect or middleware)
   so non-planning users never see planning UI.

### Fixed During Browser QA Pass

1. Sprint now blocks passive skipping when no answer is submitted.
2. Example modal copy now uses correct singular form (`1 pregunta`).
3. Low-value route badge (`+0 preguntas`) is no longer shown.
4. Landing mock date now uses non-stale example wording.

## Product Upgrades to Reach Elite Level

## Pillar A: Crystal-Clear Next Action

1. Replace internal jargon (`ROI`, `delta`, `eficiencia`) with student language.
2. Keep only one dominant CTA on each screen.
3. Always answer these 3 questions above the fold:
4. “Dónde estoy”
5. “Qué hago ahora”
6. “Cuánto me acerca a mi meta”

### Deliverables

1. Copy pass for `/portal` hero + next action + mission card.
2. Visual hierarchy pass with one hero objective and one primary action.
3. Contextual helper hints that appear only when confusion risk is high.

## Pillar B: Motivation System (Without Fake Gamification)

1. Reframe from deficit to momentum:
2. Current: “Te faltan X sesiones.”
3. Target: “Ya completaste X/Y. Te falta 1 sesión para cerrar la semana.”
4. Add daily “quick win” path (8-12 min) as fallback action.
5. Add streak-safe behavior:
6. Freeze day logic or “minimum viable session” credit on stressful days.

### Deliverables

1. Mission card copy variants (A/B test).
2. Quick-win CTA and mode.
3. Session-completion celebration with meaningful reinforcement.

## Pillar C: Learning Efficacy

1. Prevent passive progression:
2. Sprint credit should require valid answer submission, not navigation.
3. Add mastery feedback:
4. “You improved in X concept” after each sprint.
5. Add personalized review loop:
6. Start each new sprint with one spaced-repetition item from prior mistakes.

### Deliverables

1. Completion contract update in study sprint.
2. Post-sprint debrief card with “what changed” and “what’s next.”
3. Spaced-repetition insertion rule.

## Pillar D: Frictionless Onboarding

1. Make first-time flow truly linear:
2. Meta -> diagnóstico -> primer sprint.
3. Avoid exposing advanced goals/simulator controls before activation.
4. Ensure example modal does not create decision overload before signup.

### Deliverables

1. Onboarding-only goal UI variant for first-time users.
2. Trimmed example modal with one primary CTA.
3. Post-auth resume guarantee with explicit state banner.

## Pillar E: Reliability + Quality as Product Features

1. Perceived speed target:
2. Actionable state visible <= 1.2s on median mobile for `/portal`.
3. Add resilient skeletons for dashboard and next-action cards.
4. Error recovery CTA must always keep user on productive path.

### Deliverables

1. Skeleton and optimistic loading pass on `/portal`.
2. Standardized fallback copy and retry logic.
3. Reliability dashboard tied to Sentry + product funnel.

## UX Writing Style Guide (PAES Teen Context)

1. Tone: direct, friendly, no corporate wording.
2. Sentences: short, concrete, action-first.
3. Avoid abstract terms: “ROI”, “delta”, “forecast horizon”.
4. Prefer outcome language:
5. “Sube +10 pts si completas esta mini sesión.”
6. Every screen should include:
7. One confidence signal.
8. One immediate action.
9. One short reason why it matters now.

## Metrics and Instrumentation

### Core product metrics

1. `landing_cta -> auth_success` conversion.
2. `auth_success -> planning_saved` conversion.
3. `planning_saved -> diagnostic_started` conversion.
4. `diagnostic_completed -> first_sprint_started` conversion.
5. Weekly active and session completion distribution.

### Quality metrics

1. Error rate per step.
2. Retry-click rate per surface.
3. Rage-click patterns on disabled/no-op controls.
4. Median time-to-first-action on `/portal` and `/portal/study`.

### Learning metrics

1. Correctness trend over first 3 sprints.
2. Concept revisit performance.
3. Improvement slope toward target score bands.

## Experiment Backlog (Ordered)

1. Mission card copy: deficit vs momentum framing.
2. Next-action card simplification: technical vs plain language.
3. Example modal: full detail vs compact story.
4. Quick-win session CTA presence.
5. Streak reinforcement variants.

## 30/60/90 Execution Plan

### Days 0-30 (Stabilize and Remove Trust Breakers)

1. Ship all P0/P1 functional fixes.
2. Ship error-copy and recovery fixes.
3. Fix landing a11y violations.
4. Add regression tests for planning-mode data preservation and study navigation.

### Days 31-60 (Motivation and Clarity Lift)

1. Redesign dashboard hierarchy for one primary objective and action.
2. Launch motivation copy variants.
3. Launch quick-win study mode.
4. Add post-sprint “what changed” reinforcement card.

### Days 61-90 (Efficacy and Scale)

1. Add spaced-repetition injection.
2. Add adaptive difficulty controls.
3. Roll out full product analytics quality dashboard.
4. Freeze final v1.5 UX and prepare scale QA gate.

## QA and Release Gate

Release is blocked unless all are true:

1. No destructive state regressions in goals/planning flows.
2. No dead-end interactions in study sprint.
3. No raw technical messages visible in student UI.
4. Accessibility pass on all core entry and learning surfaces.
5. Core funnel and reliability metrics stable for 7 consecutive days.

## Ownership Matrix

1. Product: journey design, KPI targets, experiment prioritization.
2. Design: hierarchy, copy system, state consistency, accessibility polish.
3. Engineering: fixes, guards, performance, telemetry, tests.
4. Data: dashboards, experiment analysis, anomaly detection.
5. Content/Pedagogy: mastery feedback language and sequencing.

## Final Product Principle

If a student is anxious, tired, and distracted, the product must still make the next best step obvious, achievable, and rewarding.
