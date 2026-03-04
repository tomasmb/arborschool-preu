# Student Portal Production Roadmap (100% Portal Commitment)

## Status
- Date: March 4, 2026
- Owner: Product + Design + Engineering
- Supersedes transition planning in `student-portal-v1-implementation-plan.md`

## Purpose
Convert Arbor from a mixed transition funnel (landing -> diagnostic lead capture)
to a fully coherent student portal product:
- deterministic entry routing
- account-first progression
- immediate post-diagnostic action in portal
- lifecycle emails that drive in-product next steps

This roadmap executes the decisions in:
- [student-portal-high-level-spec.md](/Users/tomas/Repos/arbor/arborschool-preu/docs/student-portal-high-level-spec.md)

## Non-Negotiable Outcomes
1. No waitlist positioning in product or email copy.
2. No anonymous diagnostic path in production flow.
3. Every major screen has one clear primary next action.
4. Landing, auth, portal, diagnostic, and emails use the same journey states.
5. Journey analytics are state-driven and measurable end-to-end.

## Engineering Principles
All implementation work in this roadmap should follow:
1. `SOLID`
- Keep modules and components with single clear responsibility.
- Depend on explicit interfaces/contracts between layers.
- Prefer extension points over rewriting stable behavior.

2. `DRY`
- Reuse shared routing/state utilities instead of duplicating logic.
- Keep one canonical source for journey-state decisions and copy semantics.
- Remove dead or duplicate transition code once replacement is live.

3. Testability and readability
- Every workstream change should map to explicit E2E scenarios.
- Keep docs and tests synchronized with real production behavior.

## Implementation Status Update (March 4, 2026)
Scope completed in current code pass:
1. `Workstream A` mostly completed.
- Landing CTA now resolves by auth + `journeyState` instead of hard-routing to
  `/diagnostico`.
- Post-login redirect now uses journey-state routing contract only.
- Transition portal-disable branch was removed from middleware/post-login path.

2. `Workstream B` mostly completed.
- `/diagnostico` now enforces auth + planning prerequisite server-side.
- Diagnostic API start/response/complete/profile routes now require authenticated
  student identity.
- Anonymous register route was retired (`410` deprecated).
- Mini-form dependency was removed from active diagnostic start flow.
- Legacy mini-form artifacts were removed (`MiniFormScreen`, `mini-form`
  screen state, and related analytics event surface).

3. `Workstream C` partially completed.
- Confirmation and follow-up emails were rewritten to drive immediate portal
  actions (primary CTA to sprint).
- Waitlist/launch wording was removed from diagnostic results and email templates.
- Lifecycle policy now gates follow-up by journey state (`activation_ready`),
  unsubscribe/reminder preferences, and caps (`max 1/day`, `max 3/week`).
- Follow-up scheduling now targets local daytime send windows.
- Follow-up reminders now enqueue to `student_reminder_jobs` and are
  re-evaluated at dispatch time to suppress stale sends after state changes.
- Internal reminder dispatch endpoint added:
  `POST/GET /api/internal/reminders/dispatch`

4. Cross-cutting copy/routing cleanup completed.
- Removed runtime `STUDENT_PORTAL_V1` branching from app flow.
- Updated verification script assertions to current post-login routing behavior.

Open items after this pass:
1. Refactor analytics schema + reporting to canonical state-transition milestones
  (Workstream D).
2. Complete reliability, accessibility, and performance release gates
  (Workstreams E/F).

## Current Gap Analysis (Spec vs Implementation)

### P0 Gaps (Blockers for 100% Portal Commitment)
1. Landing still sends everyone directly to `/diagnostico`. `Status: Resolved`
- Current: `web/app/page.tsx`
- Target: session-aware routing aligned to journey state.

2. Anonymous mini-form lead flow in production journey. `Status: Resolved`
- Current: `web/app/api/diagnostic/register/route.ts` now returns `410`; the
  diagnostic flow and analytics schema no longer include mini-form production
  branches.
- Target: account-first diagnostic only (no pre-auth email capture funnel).

3. Waitlist messaging still appears in core results UX. `Status: Resolved`
- Current: `web/app/diagnostico/components/ResultsScreen.tsx`,
  `web/app/diagnostico/components/TierContent.tsx`
- Target: immediate portal actions (`/portal`, `/portal/study`, `/portal/goals`).

4. Confirmation and follow-up emails still imply future platform access.
`Status: Partially resolved`
- Current: `web/lib/email/confirmationEmail.ts`,
  `web/lib/email/followupEmail.ts`,
  `web/lib/student/lifecycleEmailPolicy.ts`
- Target: state-based lifecycle nudges with one concrete portal CTA.

5. Transition flags can still disable or split portal flow. `Status: Resolved`
- Current: `STUDENT_PORTAL_V1` checks in `web/middleware.ts`,
  `web/app/auth/post-login/page.tsx`, `web/lib/auth/postLoginRedirect.ts`
- Target: single production path (remove or freeze transition toggles).

### P1 Gaps (High-Impact UX Quality)
1. Dual onboarding architecture remains (`NEXT_PUBLIC_NEW_ONBOARDING` split).
- Current: `web/app/diagnostico/page.tsx`,
  `web/app/components/onboarding/*`
- Target: single onboarding path; no branch-specific user experience drift.

2. Analytics schema is transition-funnel oriented.
- Current: `web/lib/analytics/types.ts`, `web/lib/analytics/tracker.ts`
- Target: state transitions and portal outcomes as primary funnel model.

3. Legacy wording and semantics remain in comments/types/docs.
- Current: diagnostic utils and component docs still refer to signup/waitlist.
- Target: terminology normalized to portal journey vocabulary.

### P2 Gaps (Operational Hardening)
1. Lifecycle dispatch now re-evaluates policy at send time for
   activation-ready reminders; stale-link context banner still pending.
2. Stale-link handling and callback consistency need explicit E2E guarantees.
3. Accessibility and performance gates are specified but not enforced in CI.

## Target Architecture (Production Journey Contract)
1. `/` is a router-like experience:
- signed out -> auth
- signed in -> route by `journeyState`

2. `/portal/goals?mode=planning` is the only entry for `planning_required`.

3. `/diagnostico` is authenticated and planning-aware:
- signed out -> auth callback `/diagnostico`
- `planning_required` -> redirect to planning mode
- `diagnostic_in_progress` -> resume attempt
- `activation_ready`/`active_learning` -> route to `/portal` by default

4. Post-diagnostic always ends with in-product action:
- primary: start sprint
- secondary: adjust goal

5. Emails are state triggers, not campaign blasts.

## Implementation Workstreams

### Workstream A: Entry and Landing Unification
Goal: Landing and entry points behave deterministically by session/state.

Scope:
- Replace direct `window.location.href = "/diagnostico"` behavior.
- Introduce server-backed landing CTA resolution (auth + journey-aware).
- Normalize CTA copy and remove launch/wait phrasing.

Primary files:
- `web/app/page.tsx`
- `web/lib/student/journeyState.ts`
- `web/app/auth/post-login/page.tsx`
- `web/lib/auth/postLoginRedirect.ts`

Acceptance:
- Landing behavior matches all cases in high-level spec matrix.

### Workstream B: Diagnostic Flow Portalization
Goal: Diagnostic becomes a portal step, not a separate acquisition funnel.

Scope:
- Remove mini-form screen from production journey.
- Remove `/api/diagnostic/register` dependency from core flow.
- Require authenticated user identity for diagnostic attempts.
- Enforce planning prerequisite before starting diagnostic.
- Replace post-diagnostic home return with portal handoff.

Primary files:
- `web/app/diagnostico/page.tsx`
- `web/app/diagnostico/hooks/useDiagnosticFlow.bootstrap.ts`
- `web/app/diagnostico/hooks/useDiagnosticFlow.actions.ts`
- `web/app/diagnostico/components/MiniFormScreen.tsx` (removed)
- `web/app/api/diagnostic/register/route.ts` (retire or remove)
- `web/app/diagnostico/components/ResultsScreen.tsx`
- `web/app/diagnostico/components/TierContent.tsx`

Acceptance:
- No anonymous diagnostic path.
- No waitlist CTA/copy in diagnostic results.

### Workstream C: Email Lifecycle Rewrite
Goal: Every email drives one immediate portal action by journey state.

Scope:
- Rewrite confirmation and follow-up templates.
- Map trigger conditions to `planning_required`, `diagnostic_in_progress`,
  `activation_ready`, `active_learning`.
- Add suppression logic when target action is completed.
- Enforce send frequency guardrails.

Primary files:
- `web/lib/email/confirmationEmail.ts`
- `web/lib/email/followupEmail.ts`
- `web/app/api/diagnostic/profile/route.ts`
- related reminder/job orchestrators under `web/lib/student/*`

Acceptance:
- Zero "te avisamos cuando lancemos" language.
- One primary CTA per lifecycle email.

### Workstream D: Analytics and Observability Refactor
Goal: Measure real portal funnel outcomes and diagnose drop-offs quickly.

Scope:
- Replace transition-era events with state-transition event model.
- Add canonical funnel milestones:
  landing_cta -> auth_success -> planning_saved -> diagnostic_started ->
  diagnostic_completed -> first_sprint_started -> weekly_active
- Add dashboard/report definitions by entry point and state.

Primary files:
- `web/lib/analytics/types.ts`
- `web/lib/analytics/tracker.ts`
- event emitters in landing/diagnostic/portal surfaces

Acceptance:
- Weekly funnel can be generated with no manual interpretation hacks.

### Workstream E: UX and Reliability Hardening
Goal: Reach production-grade polish and resilience.

Scope:
- Implement callback preservation checks for all protected routes.
- Validate save/resume integrity for interrupted diagnostic sessions.
- Close all no-action error screens.
- Align loading/empty/error states with production UX gates.

Primary files:
- `web/middleware.ts`
- `web/app/portal/*`
- `web/app/diagnostico/*`
- `web/app/auth/*`

Acceptance:
- Every error/empty state has a clear recovery CTA.

### Workstream F: Accessibility, Performance, and Release Gates
Goal: Enforce non-functional quality from spec in release process.

Scope:
- WCAG 2.2 AA audit for core journey screens.
- Core Web Vitals validation for landing, portal, diagnostic, study.
- Add production readiness checklist run before release.

Acceptance:
- Release blocked automatically when gates fail.

## Execution Sequence (Recommended)
1. Sprint 1: Workstream A + routing contract tests
2. Sprint 2: Workstream B (remove anonymous/mini-form flow)
3. Sprint 3: Workstream C (email lifecycle rewrite)
4. Sprint 4: Workstream D + E (analytics + reliability hardening)
5. Sprint 5: Workstream F + final UX QA sweep

## Definition of Done (Project-Level)
All conditions must be true:
1. Landing, portal, diagnostic, and auth flows fully match high-level spec.
2. Legacy waitlist funnel code is removed or permanently disconnected.
3. Lifecycle emails are state-based and action-oriented.
4. Funnel analytics shows complete state transitions with stable event quality.
5. UX gates pass: clarity, accessibility, performance, reliability.
6. Team can explain every user’s next step from any entry point in one sentence.

## Cleanup Plan for Legacy Artifacts
1. Remove transition-only docs and comments that conflict with portal commitment.
2. Remove or archive obsolete test plans that assume mixed funnel behavior.
3. Keep one canonical source of truth for journey decisions:
- `docs/student-portal-high-level-spec.md`
- this roadmap file

## Notes for DB Changes
If this roadmap introduces schema changes (for lifecycle jobs/events/state),
follow project DB policy:
1. Edit `web/db/schema/*.ts`
2. Run `npx drizzle-kit generate --name <name>` (interactive)
3. Run `npx drizzle-kit migrate`
4. Update `docs/data-model-specification.md`
