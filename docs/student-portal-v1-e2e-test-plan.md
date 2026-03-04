# Student Portal E2E Test Plan (Portal-Live)

## Status
- Last updated: March 4, 2026
- Owner: Product + Design + Engineering
- Replaces transition-era assumptions from the prior v1 test plan

## Purpose
Keep one practical checklist for full portal validation before release:
1. What can be tested now with local automation
2. What must be validated end-to-end with real OAuth + staging/prod controls
3. What remains pending implementation and must be re-tested once built

## Maintenance Rule (Living Plan)
This file is a living checklist and must be updated whenever scope changes.

Required updates per feature/change:
1. Add or edit affected scenarios in `Full Coverage Checklist`
2. Mark whether each new scenario is codex-runnable or human-required
3. Add explicit expected result and blocker condition
4. Add pending tests for not-yet-implemented behavior with owner/date

Release hygiene:
1. No feature is considered done until its E2E scenario is listed here
2. Before release, every pending test item must be either executed or accepted
   as a documented risk

## Scope
In scope:
1. Entry routing and auth callbacks for `/`, `/portal`, `/portal/goals`,
   `/diagnostico`, and post-login resolver
2. Planning prerequisite + diagnostic resume behavior
3. Post-diagnostic handoff and first portal action
4. Lifecycle emails and deep-link destination behavior
5. Analytics funnel milestones and reliability gates

Out of scope:
1. v2+ learning orchestration beyond current portal contract
2. New features not defined in
   [student-portal-high-level-spec.md](/Users/tomas/Repos/arbor/arborschool-preu/docs/student-portal-high-level-spec.md)

## Current Implementation Snapshot (March 4, 2026)
Implemented and ready for validation:
1. Landing CTA resolves by auth + `journeyState`
2. `/diagnostico` is auth-gated and planning-aware
3. Anonymous diagnostic register flow is retired (`/api/diagnostic/register` -> `410`)
4. Diagnostic APIs require authenticated student identity
5. Waitlist wording removed from results + confirmation/follow-up emails
6. Runtime `STUDENT_PORTAL_V1` branching removed from active app flow
7. Remaining mini-form artifacts removed from diagnostic UI/state and analytics schema
8. Lifecycle follow-up scheduling is now state-gated (`activation_ready` only),
   suppression-aware (`unsubscribed` / `reminderEmail=false`), and capped
   (`max 1/day`, `max 3/week`) via reminder-job policy
9. Follow-up schedule now respects local daytime window (planning timezone,
   fallback `America/Santiago`)
10. Canonical analytics milestone events are emitted in active flow:
    `landing_cta`, `auth_success`, `planning_saved`, `diagnostic_started`,
    `diagnostic_completed`, `first_sprint_started`, `weekly_active`
11. Follow-up reminder jobs are now dispatched via internal worker path with
    send-time suppression checks (`/api/internal/reminders/dispatch`)

Still pending and must be tested after implementation:
1. Stale email link context banner ("ya completaste X") behavior
2. Funnel dashboard/report QA for milestone segmentation by entry/journey state
3. CI-enforced accessibility/performance gates

## Ownership Matrix
Codex-runnable now:
1. `typecheck` and static compile checks
2. Scripted portal verification (`verify:student-portal-v1`)
3. Unauthenticated route/API guard smoke checks with `curl`
4. Link/copy checks for no waitlist messaging in key product/email files
5. Legacy artifact grep checks (`MiniFormScreen` / `mini-form` / `mini_form_completed`)

Human-required (OAuth or environment controls):
1. Full Google OAuth browser journeys
2. Staging and production smoke verification
3. Inbox-level email CTA and deep-link behavior
4. PostHog/Sentry validation for event quality and errors
5. Accessibility and Core Web Vitals signoff

## Full Coverage Checklist

### A. Entry Routing Matrix
Validate each entry point for each user state:
1. Signed out -> auth required with callback preserved
2. `planning_required` -> `/portal/goals?mode=planning`
3. `diagnostic_in_progress` -> `/diagnostico` resume
4. `activation_ready` -> `/portal` (first action visible)
5. `active_learning` -> `/portal` (mission + next action)

Required entry points:
1. `/`
2. `/portal`
3. `/portal/goals`
4. `/diagnostico`
5. Email deep links (signed out + signed in + stale)

### B. Planning and Diagnostic Contract
1. User with no planning profile cannot start diagnostic
2. User with planning saved can start diagnostic
3. In-progress diagnostic resumes at exact saved question/timer state
4. Save-and-resume survives refresh and browser restart
5. User with completed diagnostic is routed away from default `/diagnostico`
   entry to `/portal`

### C. Post-Diagnostic Handoff
1. Results handoff shows one primary CTA:
   `Comenzar sprint de hoy`
2. Secondary CTA:
   `Ajustar meta`
3. Entering `/portal` immediately after completion preserves first-action
   priority
4. `/portal/study` starts quickly with minimal friction

### D. Email Lifecycle Contract
1. Confirmation email:
   one CTA, no waitlist wording, destination `/portal/study`
2. Follow-up email:
   one CTA, no pilot/waitlist wording, destination `/portal/study`
3. Signed-out email click -> auth -> callback -> canonical task
4. Stale email link -> routed to canonical current task with context banner
   (test once implemented)
5. Lifecycle suppression and send caps:
   max 1/day, max 3/week
6. Follow-up scheduling blocked when:
   `journeyState != activation_ready`, `unsubscribed=true`,
   or `planning.reminderEmail=false`
7. Follow-up scheduling timestamp falls inside local send window
   (09:00-21:00 planning timezone)

### E. Analytics and Observability
Validate event quality for funnel milestones:
1. `landing_cta`
2. `auth_success`
3. `planning_saved`
4. `diagnostic_started`
5. `diagnostic_completed`
6. `first_sprint_started`
7. `weekly_active`

Also validate:
1. Event properties include entry-point context
2. No duplicate milestone emissions per single user action
3. Drop-off reporting can be segmented by journey state
4. No legacy `mini_form_completed` event emissions

### F. Reliability and Recovery
1. Every error/empty state has a recovery CTA
2. Callback URL is preserved end-to-end across auth boundaries
3. Diagnostic API failures do not strand the user on dead-end screens
4. Retry/reload paths are obvious and functional

### G. Accessibility and Performance
Accessibility (WCAG 2.2 AA) on core screens:
1. Landing
2. Auth sign-in
3. Planning goals
4. Diagnostic
5. Diagnostic handoff/results
6. Portal dashboard
7. Study sprint

Performance targets (p75):
1. LCP <= 2.5s
2. INP <= 200ms
3. CLS <= 0.1

## Section A - Codex Runnable Now

### A1. Static Checks
Run:
```bash
cd web
npm run typecheck
```
Expected:
1. Pass with no TypeScript errors

### A2. Scripted Verification
Run:
```bash
cd web
set -a && source .env.local && set +a
npm run verify:student-portal-v1
```
Expected:
1. Script exits `0`
2. Redirect assertions match current post-login policy
3. Goals/simulator/dashboard checks remain healthy

### A3. Auth Guard Smoke
Run app:
```bash
cd web
set -a && source .env.local && set +a
npm run dev
```
In another shell:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/portal
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/student/goals
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/diagnostico
```
Expected:
1. `/portal` -> redirect to `/auth/signin?callbackUrl=/portal`
2. `/api/student/goals` -> `401`
3. `/diagnostico` -> redirect to `/auth/signin?callbackUrl=/diagnostico`

### A4. Legacy Artifact Guard
Run:
```bash
rg -n "MiniFormScreen|mini-form|mini_form_completed|trackMiniFormCompleted" web/app/diagnostico web/lib/analytics web/lib/diagnostic
```
Expected:
1. No matches

### A5. Lifecycle + Milestone Wiring Guard
Run:
```bash
rg -n \
  "evaluateActivationReady(Followup|Confirmation)Policy|LIFECYCLE_DAILY_CAP|LIFECYCLE_WEEKLY_CAP|resolveActivationReadyFollowupSchedule" \
  web/lib/student/lifecycleEmailPolicy.ts
rg -n \
  "\"landing_cta\"|\"auth_success\"|\"planning_saved\"|\"diagnostic_started\"|\"first_sprint_started\"|\"weekly_active\"" \
  web/lib/analytics/types.ts web/lib/analytics/tracker.ts
```
Expected:
1. Lifecycle policy exports include suppression + cap controls
2. Canonical milestone schema and tracker emitters are present

### A6. Lifecycle Dispatch Suppression (Stale Reminder Guard)
Run:
```bash
cd web
set -a && source .env.local && set +a
npm run verify:lifecycle-reminder-dispatch
```
Expected:
1. Dispatcher sends only activation-ready due jobs
2. Dispatcher suppresses stale jobs after journey state changes
3. Dispatcher suppresses jobs when reminder email preference is disabled

## Section B - Human Full E2E (Staging Preferred)

### B1. New Student Journey
1. Start signed out at `/`
2. Click primary CTA
3. Complete Google sign-in
4. Land on planning mode
5. Save planning and start diagnostic
6. Complete diagnostic
7. Start first sprint

Expected:
1. No dead-end screens
2. One dominant CTA on each major step
3. No waitlist/future-launch wording

### B2. Returning Student Journeys
1. Student with in-progress diagnostic -> landing CTA -> auth -> diagnostic resume
2. Student with completed diagnostic and no sprint -> lands in `/portal`
3. Active student -> lands in `/portal` with mission/next action

### B3. Direct URL Matrix
While signed out, open:
1. `/portal`
2. `/portal/goals`
3. `/diagnostico`

Then sign in and validate callback + final route matches journey state.

### B4. Email Deep-Link Validation
1. Open confirmation and follow-up emails in test inbox
2. Click CTA while signed out and signed in
3. Confirm destination is canonical and actionable

### B5. Lifecycle Suppression + Caps Validation
1. Complete diagnostic while `activation_ready` and confirm:
   confirmation send + follow-up reminder job created
2. Disable planning reminder email and repeat diagnostic completion path:
   no new follow-up reminder job created
3. Mark user unsubscribed and repeat diagnostic completion path:
   no confirmation or follow-up is sent
4. Force `active_learning` before profile save replay:
   confirmation/follow-up are suppressed
5. Trigger repeated diagnostic completion attempts in one week:
   no more than 1 lifecycle follow-up in 24h, no more than 3 in 7 days

## Pass/Fail Rules
Release candidate is `PASS` when:
1. Section A fully passes
2. Section B fully passes
3. No blocker issues in routing, auth callback, diagnostic resume, or first sprint
   handoff
4. Pending items are explicitly tracked with owner and target date

Blockers:
1. Auth loops or callback loss
2. Anonymous access to protected diagnostic flow
3. Dead-end screens without primary recovery action
4. Lifecycle emails with waitlist language or wrong CTA destination

## Execution Log Template
- Date:
- Environment: local / staging / production
- Executor:
- Commit SHA:
- A1 static checks: pass/fail
- A2 scripted verification: pass/fail
- A3 guard smoke: pass/fail
- A4 legacy artifact guard: pass/fail
- A5 lifecycle + milestone wiring guard: pass/fail
- A6 lifecycle dispatch suppression: pass/fail
- B1 new student journey: pass/fail
- B2 returning journeys: pass/fail
- B3 direct URL matrix: pass/fail
- B4 email deep links: pass/fail
- Open issues:
- Final decision: GO / NO-GO
