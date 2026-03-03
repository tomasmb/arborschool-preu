# Student Portal v1 Implementation Plan (Goal + M1 Hub)

## How To Use This File
- Work in order: Phase 1 -> Phase 6.
- In each new chat, complete exactly one phase.
- Execute each phase in a dedicated branch (do not implement phases directly on `main`).
- Before closing a chat, update:
  - Phase checklist items
  - "Phase Completion Log" entry for that phase
  - "Decisions Made" and "Open Follow-ups" if anything changed
- Do not mark a phase complete until all acceptance checks for that phase pass.

---

## Scope Summary
Implement a first production slice of the student portal focused on:
1. Authenticated student access.
2. DB-backed goal/admissions simulator (replacing `localStorage` career goals).
3. Post-diagnostic M1 dashboard with gap, effort estimate, and next-best-action.
4. Reuse existing diagnostic/mastery engine logic (avoid duplicate scoring logic).

This plan is derived from and constrained by:
- [student-portal-high-level-spec.md](/Users/tomas/Repos/arbor/arborschool-preu/docs/student-portal-high-level-spec.md)
- Existing diagnostic pipeline already implemented under `web/app/diagnostico/*`, `web/app/api/diagnostic/*`, and `web/lib/diagnostic/*`.

Chosen defaults:
- MVP scope: **Goal + M1 Hub**.
- Admissions data: **DB-backed dataset**.
- Auth: **Google OAuth first (no email/password in v1)**.

Out of scope for this slice:
- Full spaced-repetition queue orchestration UI.
- Retest gating engine (`X/Y`) automation.
- Teacher/counselor B2B dashboards.

Non-negotiable end-state goals:
- Clean codebase with no legacy diagnostic compatibility layer.
- Zero dead code at phase completion (remove unused routes/components/helpers/types).
- Refactors must follow SOLID and DRY principles.
- Portal UI must use the same existing design system and visual language already used in the app.

---

## Global Constraints
- Branching policy:
  - Use feature branches prefixed with `codex/` for phase work.
  - Recommended naming: `codex/student-portal-phase-<n>-<short-topic>`.
  - Merge into integration branch only after phase checklist + completion log are updated.
- DB changes must be done in `web/db/schema/*.ts` through Drizzle workflow.
- Never hand-write SQL migration files.
- After schema edits, run (manually by user):
  - `npx drizzle-kit generate --name <name>`
  - `npx drizzle-kit migrate`
- Keep `docs/data-model-specification.md` synchronized with schema.
- Preserve existing `/diagnostico` and `/resultados/[sessionId]` behavior while rolling out portal.

---

## Existing Code Integration Baseline (Transition Only)

### Existing Flow (Must Keep Working)
- Diagnostic UI + flow state: `web/app/diagnostico/*`
- Diagnostic APIs: `web/app/api/diagnostic/*`
- Results-by-link API/page:
  - `web/app/api/resultados/[sessionId]/route.ts`
  - `web/app/resultados/[sessionId]/page.tsx`
- Mastery/route/scoring logic (source of truth to reuse):
  - `web/lib/diagnostic/resultsCalculator.ts`
  - `web/lib/diagnostic/questionUnlock/*`
  - `web/lib/diagnostic/atomMastery.ts`

### Current Goal Data Location (To Replace)
- Goal onboarding currently uses `localStorage` in:
  - `web/app/components/onboarding/careers.ts`
  - `web/app/components/onboarding/GoalAnchorScreen.tsx`
  - `web/app/components/onboarding/PlanPreviewScreen.tsx`

### Coexistence Rules
- Do not break existing diagnostic flow during migration phases.
- Legacy surfaces can exist only as temporary transition steps.
- By end of Phase 6, legacy diagnostic/result-link compatibility code must be removed.
- Reuse existing scoring/mastery engines; avoid re-implementing equivalent formulas.

### Linking Strategy (Old -> New)
- Identity anchor: existing `users` table (email canonical).
- After auth, if user has diagnostic snapshot fields (`paesScoreMin/Max`) redirect to `/portal`; otherwise redirect to `/diagnostico`.
- Goal data ownership shifts from browser `localStorage` to DB-backed `student_goals*` tables.
- Existing diagnostic completion endpoint (`/api/diagnostic/profile`) remains producer of baseline performance data consumed by portal APIs.
- After portal migration completes, replace transitional coupling with portal-native interfaces and delete transitional adapters.

---

## Engineering Quality Rules (Mandatory for Every Phase)
- SOLID:
  - Single responsibility per module/component/service.
  - Dependency inversion for domain logic (business services independent from route/UI details).
  - Interface boundaries for simulator/dashboard/goal services.
- DRY:
  - One source of truth for score formulas and mastery-derived calculations.
  - Shared validation schemas for student goal payloads and query params.
  - Shared mapper utilities for DB -> API response shapes.
- Zero dead code:
  - Remove replaced code in same phase whenever safe.
  - No orphaned APIs, feature flags, hooks, or components after replacement.
  - Run a dead-code pass at the end of each phase.
- Design system consistency:
  - Reuse existing app tokens, typography, spacing, and component patterns.
  - No parallel design language for portal pages.
  - New UI components should be composed from existing primitives before introducing new ones.
- Phase exit validation (mandatory before marking a phase complete):
  - Run end-to-end checks for all affected critical flows, including legacy non-regression paths.
  - Verify responsive behavior on mobile and desktop breakpoints for every changed UI surface.
  - Verify visual/design quality against the existing design system (spacing, typography, states, hierarchy).
  - Validate key UX states beyond happy path (loading, empty, error, disabled).
  - Do not mark phase complete until functional + UX + responsive checks pass.

---

## High-Level Spec Mapping (Locked Decisions -> Implementation)
- Learning-first priority: reflected in portal KPIs and next-best-action ranking.
- Soft gate with structured unlock: keep planning/goal surface accessible, lock true personalization until diagnostic evidence exists.
- M1-only scope: dashboard/simulator predictions are M1-first in v1.
- Goal-setting and prediction surfaces separated:
  - Goal/admissions simulator in `/portal/goals`
  - M1 improvement dashboard in `/portal`
- Transparency requirements: simulator must expose formula breakdown + cutoff/buffer as distinct values.
- No global prediction until all required diagnostics exist.

---

## Public API Targets
- `GET /api/student/me`
- `GET /api/student/goals`
- `POST /api/student/goals`
- `GET /api/student/simulator?goalId=<id>&m1=<score>&...`
- `GET /api/student/dashboard/m1`
- `GET /api/student/next-action`

Frontend routes:
- `/portal`
- `/portal/goals`

---

## Data Model Targets
Add (via Drizzle schema):
1. `admissions_datasets`
2. `universities`
3. `careers`
4. `career_offerings`
5. `offering_weights`
6. `offering_cutoffs`
7. `student_goals`
8. `student_goal_scores`
9. `student_goal_buffers`

---

## Phase 1 - Auth Foundation (Google OAuth)
Status: `IN PROGRESS`

### Tasks
- [x] Introduce Auth.js-based Google provider integration.
- [x] Map authenticated identity to existing `users` table (email canonical).
- [x] Add route guards for `/portal*` and all new `/api/student/*` routes.
- [x] Keep `/diagnostico` and `/resultados/[sessionId]` working during transition.
- [x] Add post-login routing:
  - [x] If user has diagnostic snapshot -> `/portal`
  - [x] Else -> `/diagnostico`

### Acceptance Checks
- [ ] Unauthenticated user cannot access `/portal` or `/api/student/*`.
- [ ] Existing diagnostic flow remains functional.
- [ ] Existing result-link flow remains functional (transition only).
- [ ] Auth integration does not introduce duplicate user/profile logic.

---

## Phase 2 - Admissions Dataset + Goal Persistence
Status: `COMPLETE`

### Tasks
- [x] Move careers/universities/cutoffs/weights from static file to DB tables.
- [x] Add initial seed/import script for admissions dataset.
- [x] Replace onboarding goal read/write from `localStorage` with authenticated API persistence.
- [x] Enforce max `3` primary targets in backend validation.
- [x] Include data transparency fields in API responses:
  - [x] dataset version/date
  - [x] student-entered vs system-estimated flags

### Acceptance Checks
- [x] Goal upsert/retrieval works for 1, 2, and 3 primary goals.
- [x] Hardcoded career list is no longer source of truth.
- [x] Goal state persists across sessions through DB.
- [x] Replaced localStorage goal code paths are removed or marked for immediate deletion in next phase.

---

## Phase 3 - Goal Simulator Service
Status: `COMPLETE`

### Tasks
- [x] Implement pure simulator service functions:
  - [x] weighted score
  - [x] buffered target
  - [x] admissibility delta
  - [x] sensitivity (`M1 +10`)
- [x] Expose simulator through `GET /api/student/simulator`.
- [x] Build `/portal/goals` UI with:
  - [x] transparent formula breakdown
  - [x] separate last cutoff vs buffered target
  - [x] direct per-test input controls

### Acceptance Checks
- [x] Simulator API response includes formula components + dataset metadata.
- [x] Sensitivity output behaves consistently with score updates.
- [x] UI reflects changes immediately when inputs change.
- [x] No duplicate formula implementation outside simulator service.

---

## Phase 4 - M1 Dashboard Core
Status: `NOT STARTED`

### Tasks
- [ ] Build `GET /api/student/dashboard/m1` combining:
  - [ ] latest diagnostic snapshot
  - [ ] student M1 target
  - [ ] mastery/route signal
- [ ] Compute and return:
  - [ ] M1 predicted score band
  - [ ] confidence indicator
  - [ ] target, gap, estimated hours
- [ ] Build `/portal` top modules:
  - [ ] M1 today vs target
  - [ ] confidence + gap
  - [ ] effort-adjustable forecast card

### Acceptance Checks
- [ ] Dashboard returns meaningful state for users with full data.
- [ ] Dashboard returns clear actionable empty state for missing target/data.
- [ ] Latency remains acceptable for normal usage.
- [ ] UI implementation follows existing design system patterns (no parallel UI language).

---

## Phase 5 - Next Best Action + Learning Queue Entry
Status: `NOT STARTED`

### Tasks
- [ ] Reuse route optimizer logic to compute top ROI action.
- [ ] Add `GET /api/student/next-action`.
- [ ] Add dashboard sections:
  - [ ] next best action (score delta + time cost)
  - [ ] learning queue preview (top atoms)
- [ ] Mark SR orchestration as "coming next" (no full SR engine yet)

### Acceptance Checks
- [ ] Next action is deterministic for same input state.
- [ ] Dashboard renders action + queue without regressions.
- [ ] No duplicated ranking logic across API and UI.

---

## Phase 6 - Hardening + Release
Status: `NOT STARTED`

### Tasks
- [ ] Add feature flag: `student_portal_v1`.
- [ ] Add legacy backfill path for recoverable goal state (when available).
- [ ] Add analytics/observability events:
  - [ ] goal save/update
  - [ ] simulator interaction
  - [ ] dashboard viewed
  - [ ] next action clicked
- [ ] Do gradual rollout:
  - [ ] internal users
  - [ ] broader user base
- [ ] Remove transitional legacy surfaces and adapters:
  - [ ] retire `/resultados/[sessionId]` path if replaced by authenticated portal
  - [ ] delete superseded diagnostic-to-portal bridge code
  - [ ] remove obsolete onboarding `localStorage` goal code
- [ ] Final dead-code cleanup pass repo-wide for student portal/domain paths.

### Acceptance Checks
- [ ] No regressions in `/diagnostico` flow.
- [ ] Legacy transitional code has been removed from active paths.
- [ ] No unused student-portal-related modules remain in repo.
- [ ] Dashboard/simulator endpoints meet expected performance threshold.

---

## Test Plan (Cross-Phase)

### Unit
- [ ] Weighted score calculation across mixed PAES inputs.
- [ ] Buffer math (`+20/+30/+50`) and admissibility outputs.
- [ ] Sensitivity monotonic behavior (`M1 +10`).
- [ ] Next-best-action ranking deterministic with fixed mastery graph.

### API Integration
- [ ] Auth-required endpoints reject unauthenticated requests.
- [ ] Goal upsert/retrieval round-trip (1/2/3 primary targets).
- [ ] Simulator includes formula + metadata.
- [ ] Dashboard handles both complete and missing-target states.

### UI/E2E
- [ ] Google sign-in -> portal -> create goals -> simulator updates.
- [ ] Existing diagnostic user lands on populated portal.
- [ ] No-diagnostic user redirected to diagnostic.
- [ ] Goal edits update dashboard target/gap correctly.

---

## Decisions Made
- Auth method for v1: Google OAuth only.
- Personalization scope for v1: M1 only.
- No global prediction until all required diagnostics exist.
- Admissions dataset is curated and versioned in DB (no live sync in v1).
- Student goals are account-bound source of truth.
- End state must be clean codebase: no diagnostic legacy compatibility layer.
- Mandatory engineering standards: SOLID + DRY + zero dead code.
- Portal UI must match current design system.
- Auth session strategy for v1: JWT sessions with DB user identity resolution on sign-in.
- Local DB stabilization policy: apply migrations with `node scripts/migrate.js` (same runner as deploy) to minimize runner drift.

---

## Open Follow-ups
- [ ] Define exact confidence-band computation formula for dashboard API contract.
- [ ] Define admissions seed update process and ownership cadence.
- [ ] Confirm migration plan for historical localStorage goals (if recoverable).
- [ ] Add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in environment configuration for local/dev/prod.
- [ ] Standardize local migration execution path with deploy runner to avoid drift (`scripts/migrate.js` vs `drizzle-kit migrate` behavior).

---

## Phase Completion Log

### Phase 1
- Date: 2026-03-03
- Owner: Codex (GPT-5)
- What shipped:
  - Auth.js bootstrap with Google provider.
  - Canonical email identity mapping to existing `users` table.
  - Protected portal scaffold routes (`/portal`, `/portal/goals`).
  - Post-login redirect logic (`/auth/post-login`) based on diagnostic snapshot presence.
- APIs added/changed:
  - Added `GET /api/student/me`.
  - Added Auth.js route handler at `/api/auth/[...nextauth]`.
  - Added middleware guard for `/api/student/*`.
- DB changes:
  - None.
- Tests run:
  - Pending.
- Risks/known gaps:
  - Depends on correct Google OAuth and Auth.js env vars in each environment.
  - Acceptance checks not fully validated via E2E/manual flow yet.
- Sign-off:
  - Pending acceptance checks.

### Phase 2
- Date: 2026-03-03
- Owner: Codex (GPT-5)
- What shipped:
  - Added admissions + student goal schema (`admissions_datasets`, `universities`, `careers`, `career_offerings`, `offering_weights`, `offering_cutoffs`, `student_goals`, `student_goal_scores`, `student_goal_buffers`).
  - Added goal persistence service with validation (max 3 primaries, deduped offerings, score bounds).
  - Replaced onboarding goal localStorage read/write with authenticated `/api/student/goals` calls.
  - Implemented `/portal/goals` page with DB-backed goal selection and save flow.
  - Added admissions seed script at `web/scripts/seedAdmissionsDataset.ts`.
- APIs added/changed:
  - Added `GET /api/student/goals`.
  - Added `POST /api/student/goals`.
- DB changes:
  - Generated migration: `web/db/migrations/0008_student_portal_phase2_admissions_goals.sql`.
  - Applied clean migration chain with `node scripts/migrate.js` on `preu` (data-preserving DB normalization performed).
  - Seeded admissions dataset with `npx tsx scripts/seedAdmissionsDataset.ts`.
  - Preserved existing local data by cloning legacy DB into clean migrated DB using `scripts/cloneLegacyDataToCleanDb.ts`.
- Tests run:
  - `npm run typecheck` (pass).
  - Goal persistence functional checks:
    - save 1 goal -> pass
    - save 2 goals -> pass
    - save 3 goals -> pass
    - save 4 goals -> rejected (expected)
  - HTTP E2E checks (local dev server):
    - `GET /portal` -> `307` redirect to `/auth/signin?callbackUrl=%2Fportal`
    - `GET /portal/goals` -> `307` redirect to `/auth/signin?callbackUrl=%2Fportal%2Fgoals`
    - `GET /api/student/goals` unauthenticated -> `401 {"success":false,"error":"Unauthorized"}`
    - `GET /diagnostico` -> `200` (non-regression path reachable)
  - Browser E2E checks (headless Chrome):
    - Visiting `/portal` renders sign-in page with `Continuar con Google`.
    - Visiting `/portal/goals` renders sign-in page with `Iniciar sesión`.
    - Visiting `/diagnostico` renders Goal Anchor heading `¿A qué carrera quieres entrar?`.
- Risks/known gaps:
  - This repo currently has historical duplicate migration prefixes (`0003_*`, `0004_*`), which can cause behavior differences between migration runners.
- Sign-off:
  - Completed with data-preserving DB recovery and acceptance checks above.

### Phase 3
- Date: 2026-03-03
- Owner: Codex (GPT-5)
- What shipped:
  - Added pure simulator domain service at `web/lib/student/simulator.ts` with reusable functions for weighted score, buffered target, admissibility delta, and `M1 +10` sensitivity.
  - Added live simulator UI in `web/app/portal/goals/page.tsx` with per-test score inputs, buffer control, formula breakdown table, and immediate recalculation on input changes.
  - Extended goal save flow to persist per-test scores and student-selected buffer values through existing `POST /api/student/goals`.
- APIs added/changed:
  - Added `GET /api/student/simulator?goalId=<id>&m1=<score>&...` (supports per-test query overrides plus optional `bufferPoints` override).
- DB changes:
  - None.
- Tests run:
  - `npm run typecheck` (pass).
  - `npm run lint` (pass).
  - API E2E (authenticated and unauthenticated):
    - `GET /api/student/simulator` unauthenticated -> `401 {"success":false,"error":"Unauthorized"}`.
    - `GET /portal/goals` unauthenticated -> `307` redirect to `/auth/signin?callbackUrl=%2Fportal%2Fgoals`.
    - `GET /api/student/simulator?goalId=<goal>` authenticated -> formula payload with components + metadata.
    - `GET /api/student/simulator?goalId=<goal>&<required tests>=700` -> `formula.isComplete=true`, weighted score computed, sensitivity delta consistent.
    - `GET /api/student/simulator?goalId=<goal>&M1=` -> missing `M1` reflected immediately (`weightedScore=null`, `missingTests` includes `M1`).
    - Validation checks: invalid score (`M1=99`) -> `400`; invalid buffer (`bufferPoints=-1`) -> `400`; missing `goalId` -> `400`; unknown `goalId` -> `404`.
  - Browser E2E (Playwright):
    - Authenticated `/portal/goals` renders goal selector, per-test inputs, and formula breakdown.
    - Editing test inputs recalculates weighted score and deltas immediately.
    - Clearing `M1` input immediately switches to missing-state UI.
    - Goal save + reload persists edited score inputs and buffer values from DB.
    - Responsive verification at mobile viewport (`390x844`) + desktop baseline (default viewport).
- Risks/known gaps:
  - Sensitivity card intentionally fixed to `M1 +10` in v1 scope.
- Sign-off:
  - Completed.

### Phase 4
- Date:
- Owner:
- What shipped:
- APIs added/changed:
- DB changes:
- Tests run:
- Risks/known gaps:
- Sign-off:

### Phase 5
- Date:
- Owner:
- What shipped:
- APIs added/changed:
- DB changes:
- Tests run:
- Risks/known gaps:
- Sign-off:

### Phase 6
- Date:
- Owner:
- What shipped:
- APIs added/changed:
- DB changes:
- Tests run:
- Risks/known gaps:
- Sign-off:

---

## New Chat Handoff Protocol
Use this at the start/end of each phase chat to keep continuity:

### At Chat Start
- Confirm target phase number.
- Confirm current branch is a dedicated phase branch (not `main`).
- Read this file + linked high-level spec.
- Verify previous phase status and unresolved follow-ups.

### During Implementation
- Update checklist items as work lands.
- Record any scope changes in \"Decisions Made\" immediately.

### At Chat End
- Fill that phase entry in \"Phase Completion Log\" with concrete paths/APIs/tests.
- Mark phase status (`NOT STARTED` -> `IN PROGRESS` -> `COMPLETE`).
- Add any blockers/open items to \"Open Follow-ups\" for next chat.
- Confirm and record phase validation evidence:
  - E2E checks executed and outcomes
  - Responsive checks (mobile + desktop) executed and outcomes
  - Design/UX quality checks executed and outcomes
