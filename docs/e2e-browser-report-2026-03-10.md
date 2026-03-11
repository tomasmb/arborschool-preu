# E2E Browser Report

Run date: March 10, 2026
Environment: local dev server at `http://localhost:3000`
Method: live browser automation with synthetic student sessions plus targeted DB verification

## Scope covered

- Landing page, CTA routing, and legal pages
- Planning flow in `/portal/goals?mode=planning`
- Diagnostic entry and in-progress behavior in `/diagnostico`
- Portal dashboard in `/portal`
- Study flow in `/portal/study`
- Progress page in `/portal/progress`
- Full test flow in `/portal/test`
- Profile/preferences page in `/portal/profile`
- Desktop and quick mobile pass

## Summary

- Major blocker found in the new-student onboarding path
- Diagnostic resume/crash-recovery is currently broken
- Full-test gating rules worked for low-mastery, spacing, and monthly-cap cases
- Study flow, progress history updates, legal pages, and most core portal screens rendered successfully
- All 6 original findings independently verified via source code review (March 10, 2026)
- 2 additional findings added: contract test encoding Issue 1 as expected (#7), and missing server-side deduplication for diagnostic start (#8)

## Confirmed findings

### 1. Critical: new students cannot start the diagnostic after completing planning

- Severity: Critical
- Repro:
  1. Sign in as a brand-new student
  2. Complete planning in `/portal/goals?mode=planning`
  3. Click `Empezar diagnóstico`
  4. The app briefly hits `/diagnostico` and immediately redirects back to planning step 1
- Observed result:
  - The student is trapped in planning and cannot enter the first diagnostic
  - DB verification showed the student already had both a saved planning profile and a saved goal
- Likely root cause:
  - [`web/lib/student/journeyState.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/lib/student/journeyState.ts#L83) sets every no-diagnostic student to `planning_required`, even when planning is already complete
  - [`web/lib/student/journeyRouting.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/lib/student/journeyRouting.ts#L94) sends any `planning_required` student back to planning before checking `hasPlanningProfile`

### 2. High: diagnostic resume creates duplicate attempts and wipes progress

- Severity: High
- Repro:
  1. Open `/diagnostico` as a student with an unfinished diagnostic
  2. Answer question 1 and move to question 2
  3. Refresh the page
- Observed result:
  - The flow restarts at question 1
  - The previous answer is gone
  - Additional unfinished `test_attempts` rows are created for the same student
- Evidence:
  - Browser state reset from question 2 back to question 1
  - DB check showed 3 simultaneous unfinished diagnostic attempts for the same student
- Likely root cause:
  - [`web/app/diagnostico/hooks/useDiagnosticFlow.bootstrap.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/diagnostico/hooks/useDiagnosticFlow.bootstrap.ts#L40) always calls `startTest()` on bootstrap
  - [`web/app/diagnostico/hooks/useDiagnosticFlow.actions.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/diagnostico/hooks/useDiagnosticFlow.actions.ts#L94) clears local diagnostic state before creating a new attempt

### 3. Medium: resumed full tests show fractional seconds in the timer

- Severity: Medium
- Repro:
  1. Start a full test
  2. Answer one question
  3. Refresh
  4. Click `Comenzar Test` to resume
- Observed result:
  - The timer renders values like `02:29:12.759000000000015` instead of `HH:MM:SS`
- Likely root cause:
  - [`web/app/api/student/full-test/start/route.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/api/student/full-test/start/route.ts#L32) calculates `remainingMinutes` as a float
  - [`web/app/portal/test/useFullTestTimer.ts`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/portal/test/useFullTestTimer.ts#L47) uses that value directly as seconds input without normalization

### 4. Medium: profile reminder toggles persist in the DB but load with stale UI state

- Severity: Medium
- Repro:
  1. Open `/portal/profile`
  2. Turn off `Recordatorios por email`
  3. Reload the page
- Observed result:
  - The DB value updates to `false`
  - The checkbox reloads as checked
- Likely root cause:
  - [`web/app/portal/profile/page.tsx`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/portal/profile/page.tsx#L47) fetches only `/api/student/me`
  - The page never loads reminder preferences, and the UI defaults `reminders` to `true` when state is `null` at [`web/app/portal/profile/page.tsx`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/portal/profile/page.tsx#L130)

### 5. Low: weekly mission copy pluralizes `sesión` incorrectly

- Severity: Low
- Repro:
  1. Open the dashboard with more than 1 remaining session in the weekly mission
- Observed result:
  - Copy renders as `5 sesiónes más para completar`
- Likely root cause:
  - [`web/app/portal/DashboardSections.tsx`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/portal/DashboardSections.tsx#L258) builds the plural from `sesión` + `es`

### 6. Low: projection helper note is misleading after the latest result is already a full test

- Severity: Low
- Repro:
  1. Complete a full test
  2. Open `/portal/progress`
- Observed result:
  - The page still says `Un test completo puede subir el techo`
  - That copy is misleading when the latest score already comes from a full test
- Likely root cause:
  - [`web/app/portal/progress/ProgressCharts.tsx`](/Users/tomas/Repos/arbor/arborschool-preu/web/app/portal/progress/ProgressCharts.tsx#L304) renders the note unconditionally

## Notable passes

- Anonymous landing CTA, hero copy, and legal links loaded correctly
- Planning search/select flow worked and saved a goal plus planning profile
- Portal dashboard rendered personalized next-action content for activation-ready and active-learning students
- Study lessons rendered math, correct/incorrect feedback, and explanation gating
- Full-test pre-screen used the real question count
- Full-test partial submit completed and wrote a new history point visible on `/portal/progress`
- Full-test gating error states rendered correctly for:
  - low mastery threshold
  - spacing lockout
  - monthly cap
- Legal pages `/privacidad`, `/terminos`, and `/cookies` all loaded with correct titles and headings
- Mobile landing and mobile progress layouts were usable in a quick viewport pass

### 7. Low: contract test encodes Issue 1 redirect loop as expected behavior

- Severity: Low
- Found during: code review of `web/scripts/verifyPortalJourneyContract.ts`
- Evidence:
  - L121-127 asserts that `resolveDiagnosticEntryRoute({ journeyState: "planning_required", hasPlanningProfile: true })` should return `/portal/goals?mode=planning`
  - This is the exact scenario that causes the redirect loop in Issue 1
- Impact:
  - Fixing Issue 1 without updating this assertion will break the contract test
  - The assertion must be flipped to expect `/diagnostico` for this case

### 8. Medium: `/api/diagnostic/start` has no deduplication guard (server-side aspect of Issue 2)

- Severity: Medium
- Found during: code review comparison with full-test start endpoint
- Evidence:
  - `web/app/api/diagnostic/start/route.ts` inserts a new `testAttempts` row on every POST with no check for existing in-progress attempts
  - `web/app/api/student/full-test/start/route.ts` correctly calls `getInProgressAttempt(userId)` before creating a new attempt (L29-63)
- Impact:
  - Even with client-side resume logic fixed, any duplicate POST (network retry, double-click, StrictMode double mount) still creates orphan rows
  - The diagnostic start endpoint should mirror the full-test endpoint's deduplication pattern

## Residual risks / not fully covered

- Real Google OAuth flow was not exercised end-to-end; authenticated coverage used valid signed local sessions
- Diagnostic completion to real post-diagnostic handoff could not be verified from a true new-student flow because the onboarding blocker stops entry to `/diagnostico`
- Full-test time-up auto-submit was not waited through in real time
- Progress charts emit repeated sizing warnings in the console during render; charts still displayed, but this area deserves a focused follow-up pass
