# Student Portal v1 E2E Test Plan

## Purpose
Provide one execution checklist for final Student Portal v1 validation before production launch, with clear ownership for:
- tests Codex can run autonomously
- tests requiring human credentials/environment access (Google OAuth, staging/prod controls)

---

## Scope
- In scope:
  - `/portal`
  - `/portal/goals`
  - `/api/student/*`
  - `/diagnostico` non-regression
  - feature flag behavior (`STUDENT_PORTAL_V1`)
  - post-login routing (`/auth/post-login`)
- Out of scope:
  - full spaced-repetition orchestration (v2+)

---

## Prerequisites
- Branch: `codex/student-portal-v1`
- Env vars available where applicable:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `STUDENT_PORTAL_V1`
- Install deps:
  - `cd web && npm ci` (or `npm install`)

---

## Test Ownership Matrix
- `Codex runnable now (local, no credentials)`
  - static checks (`typecheck`, `lint`, `format:check`)
  - scripted verification (`verify:student-portal-v1`)
  - unauthenticated route/API guards
  - `/diagnostico` reachability regression
- `Requires human credentials or environment control`
  - full Google OAuth browser journey
  - staging/prod feature-flag rollout
  - analytics validation in real PostHog/Sentry dashboards
  - production smoke + rollback drills

---

## Section A - Codex Runnable (Local)

### A1. Static Quality Gates
Run:
```bash
cd web
npm run typecheck
npm run lint
npm run format:check
```
Expected:
- all pass

### A2. Functional + Performance Script
Run:
```bash
cd web
set -a && source .env.local && set +a
npm run verify:student-portal-v1
```
Expected:
- JSON output with `"status": "ok"`
- checks include:
  - `unitSimulatorMath: pass`
  - `postLoginRedirect: pass`
  - `goalsRoundTrip123: pass`
  - `simulatorPayloadMetadata: pass`
  - `dashboardGoalCoupling: pass`
- performance:
  - dashboard `p95 < 300ms`
  - simulator `p95 < 300ms`

### A3. Unauthenticated Guard + Regression Smoke
Start dev server:
```bash
cd web
set -a && source .env.local && set +a
npm run dev
```
In another shell:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/portal
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/student/goals
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/diagnostico
```
Expected:
- `/portal` -> `307` redirect to `/auth/signin?...`
- `/api/student/goals` -> `401`
- `/diagnostico` -> `200`

---

## Section B - Requires Human OAuth Credentials

### B1. Full Browser Happy Path (Staging Preferred)
1. Go to `/auth/signin`
2. Sign in with Google test student account
3. Validate post-login redirect:
   - with diagnostic snapshot -> `/portal`
4. Go to `/portal/goals`
5. Save 1, then 2, then 3 goals
6. Edit M1 score and buffer in simulator UI
7. Return to `/portal` and verify target/gap updates

Expected:
- no auth loops/errors
- save operations persist
- simulator recalculates instantly
- dashboard reflects updated target/gap

### B2. No-Diagnostic User Redirect
1. Sign in with test account that has no diagnostic snapshot
2. Navigate to `/auth/post-login`

Expected:
- redirected to `/diagnostico`

---

## Section C - Feature Flag Rollout Validation

### C1. Staging Internal Rollout
Set `STUDENT_PORTAL_V1=true` in staging.

Run B1 and B2 in staging with internal test accounts.

Expected:
- all pass
- analytics events emitted for:
  - `student_goals_saved`
  - `student_simulator_interaction`
  - `student_dashboard_viewed`
  - `student_next_action_clicked`

### C2. Production Broad Rollout
1. Keep rollback plan ready: set `STUDENT_PORTAL_V1=false`
2. Enable `STUDENT_PORTAL_V1=true` in production
3. Run quick smoke:
   - sign in
   - `/portal` loads
   - save goal
   - simulator updates
4. Watch logs/analytics for first 30-60 min

Expected:
- no critical auth or API failures
- rollback not required

---

## Pass/Fail Rules
- Release candidate is **PASS** when:
  - Section A all pass
  - Section B all pass
  - Section C1 pass
  - Production smoke in C2 pass
- Any failure in auth redirect, goal persistence, simulator output, or portal availability is a **BLOCKER**.

---

## Evidence Template (fill per run)
- Date:
- Environment: local / staging / production
- Executor:
- Commit SHA:
- Section A:
  - A1: pass/fail
  - A2: pass/fail (attach JSON output)
  - A3: pass/fail (attach HTTP codes)
- Section B:
  - B1: pass/fail (notes + screenshots if needed)
  - B2: pass/fail
- Section C:
  - C1: pass/fail
  - C2: pass/fail
- Final decision: GO / NO-GO
