# E2E Test Plan — Comprehensive Browser Testing

## Infrastructure: what we need to build first

### Problem

Google OAuth is the only auth path. Browser automation cannot complete a real
Google sign-in flow (CAPTCHA, 2FA, consent screens). Every existing test script
creates users directly in the DB, but none expose an HTTP endpoint the browser
can hit.

### Solution: dev-only test harness API

Create a single **dev-only** API route that lets the browser automation:

1. **Create** a fresh test user at any journey state
2. **Mint** a valid session cookie for that user
3. **Seed** specific data states (mastery, sprints, missions, etc.)
4. **Tear down** the user and all related data after the test

#### Route: `POST /api/dev/test-harness`

Blocked unless `NODE_ENV === "development"`.

```
POST /api/dev/test-harness
Content-Type: application/json

{
  "action": "create_user" | "seed_state" | "cleanup",
  "payload": { ... }
}
```

##### `create_user`

Creates a user, mints a NextAuth session, and sets the session cookie on the
response so subsequent browser requests are authenticated.

```json
{
  "action": "create_user",
  "payload": {
    "email": "e2e-test-<timestamp>@arbor.local",
    "firstName": "Test",
    "lastName": "Student",
    "journeyPreset": "fresh | planning_done | diagnostic_done | active"
  }
}
```

Journey presets seed the minimum data for each state:

| Preset | What it seeds |
|--------|--------------|
| `fresh` | User row only — `planning_required`, no profile, no diagnostic |
| `planning_done` | User + planning profile + goal — ready to enter diagnostic |
| `diagnostic_done` | User + profile + goal + completed diagnostic + PAES scores |
| `active` | All above + completed sprint + weekly mission + some atom mastery |

##### `seed_state`

Seeds additional data for specific test scenarios:

```json
{
  "action": "seed_state",
  "payload": {
    "userId": "<uuid>",
    "seed": "mastery_atoms_18 | mastery_atoms_30 | full_test_completed
           | cooldown_atom | sr_review_due | streak_5 | mission_complete
           | multiple_history_points | reminders_off"
  }
}
```

##### `cleanup`

Deletes the user and all associated data (cascading through all related tables):

```json
{
  "action": "cleanup",
  "payload": { "userId": "<uuid>" }
}
```

#### Files to create / change

| File | Purpose |
|------|---------|
| `web/app/api/dev/test-harness/route.ts` | The endpoint (dev-only guard) |
| `web/lib/dev/testSeeder.ts` | Seeding logic for each preset and state |
| `web/lib/dev/testSession.ts` | Mint a NextAuth JWT and set session cookie |
| `web/lib/dev/testCleanup.ts` | Cascading delete across all user tables |

#### Safety

- Hard `NODE_ENV !== "development"` guard at the top of the route — returns 404
  in any other environment.
- All test emails use `@arbor.local` domain so they can never collide with real
  users.
- Cleanup deletes all rows across every user-linked table.

---

## Test cases

### A. Landing page and public routes

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| A1 | Anonymous landing CTA | Open `/` not signed in | CTA says "Crear mi plan y empezar diagnóstico", links to auth |
| A2 | Signed-in landing — planning needed | Sign in as `fresh` user, open `/` | CTA says "Continuar planificación" |
| A3 | Signed-in landing — diagnostic in progress | Sign in as user mid-diagnostic, open `/` | CTA says "Retomar diagnóstico" |
| A4 | Signed-in landing — active student | Sign in as `active` user, open `/` | CTA says "Ir a mi portal" |
| A5 | Legal pages load | Visit `/terminos`, `/privacidad`, `/cookies` | Titles and headings render |
| A6 | Mobile landing layout | Viewport 375×812, open `/` | No overflow, CTA visible |

### B. Auth and post-login routing

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| B1 | Unauthenticated portal redirect | Open `/portal` without session | Redirect to sign-in with callback |
| B2 | Unauthenticated API returns 401 | `GET /api/student/me` without session | 401 JSON |
| B3 | Post-login → planning | Create `fresh` user, hit `/auth/post-login` | Redirect to `/portal/goals?mode=planning` |
| B4 | Post-login → diagnostic | Create `planning_done` user with in-progress attempt, hit `/auth/post-login` | Redirect to `/diagnostico` |
| B5 | Post-login → portal | Create `active` user, hit `/auth/post-login` | Redirect to `/portal` |

### C. Planning flow

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| C1 | Full planning wizard | As `fresh` user: open `/portal/goals?mode=planning` → search university → select career → confirm schedule → click "Empezar diagnóstico" | Each step renders, goal saved in DB, redirect to `/diagnostico` |
| C2 | Save for later | Complete planning steps → click "Guardar y continuar después" | Success message, stay on page |
| C3 | Resume planning | Complete step 1, reload page | State preserved, can continue from where left off |
| C4 | Planning → diagnostic transition | Complete planning → click start diagnostic | No redirect loop, `/diagnostico` loads (Issue 1 regression) |
| C5 | Planning validation | Try to start diagnostic without selecting a career | Error message shown |
| C6 | Mobile planning | Viewport 375×812, complete wizard | All steps usable |

### D. Diagnostic flow

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| D1 | Full diagnostic completion | As `planning_done` user: start diagnostic → answer all 16 questions → view results | Stage 1 (8q) → transition → stage 2 (8q) → results screen |
| D2 | Diagnostic resume on refresh | Start diagnostic, answer 2 questions, refresh page | Resumes at question 3, answers preserved (Issue 2 regression) |
| D3 | Diagnostic resume — no duplicate attempts | Start diagnostic, refresh 3 times | Only 1 `test_attempts` row in DB (Issue 2/8 regression) |
| D4 | Stage 1 → stage 2 transition | Answer all 8 stage 1 questions | Transition screen shows, stage 2 loads with correct route |
| D5 | Timer runs and displays correctly | Start diagnostic | Timer counts down from 30:00 in MM:SS format |
| D6 | Timer expiry | Start diagnostic, let timer expire (or set low time) | Time-up modal appears |
| D7 | "No sé" / skip answer | Click "No sé" on a question, then next | Answer recorded as skip, next question loads |
| D8 | Results screen content | Complete diagnostic | PAES score band, axis performance, learning route shown |
| D9 | Profiling screen | Complete diagnostic as student portal user | Profiling form appears, can submit or skip |
| D10 | Post-diagnostic → portal | Complete diagnostic + profiling → navigate | Portal dashboard loads with diagnostic data |
| D11 | Math rendering | Open questions with math notation | LaTeX renders correctly (no raw `\frac{}{}` visible) |
| D12 | Mobile diagnostic | Viewport 375×812, complete diagnostic | Questions readable, answers tappable |

### E. Portal dashboard

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| E1 | Dashboard loads — activation ready | As `diagnostic_done` user, open `/portal` | Score, band, next action CTA visible |
| E2 | Dashboard loads — active learning | As `active` user, open `/portal` | Score, mission ring, progress section all render |
| E3 | Score display | Open dashboard | PAES M1 score, min–max band, gap to target |
| E4 | Diagnostic source label — short | As user with only short diagnostic | Shows "Estimado desde diagnóstico corto" |
| E5 | Diagnostic source label — full test | As user with completed full test | Shows "Basado en test completo" |
| E6 | Mission ring progress | As user with 3/5 sessions complete | Ring shows 3/5, "2 sesiones más para completar" (Issue 5 regression) |
| E7 | Mission ring complete | As user with 5/5 sessions | Ring full, "Misión completada esta semana" |
| E8 | Progress section | Open dashboard | Conceptos dominados, % avance, preguntas desbloqueadas |
| E9 | Next action CTA | As activation_ready user | Shows recommended study action |
| E10 | Retest recommendation banner | As user with 30+ mastered atoms | Strong retest recommendation shown |
| E11 | Streak badge | As user with 5-day streak | Streak badge shows 5 |
| E12 | Confidence badge | Open dashboard | Confidence badge renders with level |
| E13 | Mobile dashboard | Viewport 375×812 | All sections usable, no overflow |

### F. Study flow — mini-clase

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| F1 | Start first study sprint | As `diagnostic_done` user, click study CTA | Sprint created, first atom lesson loads |
| F2 | Lesson pages render | Start a lesson | HTML lesson content renders with worked examples |
| F3 | Lesson pagination | Multi-page lesson | Can navigate between pages |
| F4 | First question after lesson | Complete lesson | First question appears at EASY difficulty |
| F5 | Correct answer feedback | Answer correctly | Green feedback, explanation available |
| F6 | Incorrect answer feedback | Answer incorrectly | Red feedback, explanation gated until viewed |
| F7 | Difficulty progression up | Answer 2 correct in a row | Next question is higher difficulty |
| F8 | Difficulty progression down | Answer 2 wrong in a row | Next question is lower difficulty |
| F9 | Mastery achieved | Get 3 correct in a row (2+ at HARD) | Mastery celebration screen, atom marked mastered |
| F10 | Failure — 3 wrong in a row | Answer 3 consecutive wrong | Failure outcome triggered |
| F11 | Failure — low accuracy | 10+ questions, <70% accuracy | Failure outcome triggered |
| F12 | Failure — max questions | 20 questions without mastery | Session ends |
| F13 | Sprint completion | Complete all atoms in sprint | Sprint marked complete, return to dashboard |
| F14 | Math rendering in questions | Open a math question | LaTeX renders correctly |
| F15 | Mobile study flow | Viewport 375×812, complete a lesson + questions | Usable |

### G. Prerequisite scan and cooldown

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| G1 | Failure triggers prereq scan | Fail an atom that has prereqs | "Vamos a verificar tus bases" screen |
| G2 | Prereq scan — gap found | Fail prereq scan question | "Detectamos un vacío" message, prereq becomes next target |
| G3 | Prereq scan — no gap | Pass prereq scan question | Cooldown applied, "concepto en pausa" message |
| G4 | Failure without prereqs → cooldown | Fail an atom with no prereqs | Cooldown message directly |
| G5 | Cooldown expiry | Master 3 atoms after cooldown | Previously cooled atom becomes eligible again |

### H. Spaced repetition

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| H1 | SR schedule initialized on mastery | Master an atom | Review scheduled after N sessions |
| H2 | Review appears when due | Complete enough sessions for review | Review block appears in study flow |
| H3 | Review pass | Answer review correctly | Interval grows, review rescheduled |
| H4 | Review fail with prereqs | Fail review on atom with prereqs | Prereq scan triggered |
| H5 | Review fail without prereqs | Fail review on atom without prereqs | Interval halved |
| H6 | Session budget cap | Have many reviews due | Max 5 review items per session |

### I. Full test

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| I1 | Pre-screen — retest locked | As user with <18 mastered atoms | Gating message, cannot start |
| I2 | Pre-screen — eligible | As user with 18+ mastered atoms | Can start test |
| I3 | Pre-screen — spacing lockout | As user who took test <7 days ago | Spacing message shown |
| I4 | Pre-screen — monthly cap | As user who took 3 tests this month | Monthly cap message |
| I5 | Start full test | Click start | Timer starts at correct time, questions load |
| I6 | Answer and navigate | Answer questions, move forward | Answers saved, can navigate between questions |
| I7 | Resume full test on refresh | Answer some questions, refresh | Resumes with correct remaining time (Issue 3 regression) |
| I8 | Timer format on resume | Refresh mid-test | Timer shows HH:MM:SS with no fractional seconds |
| I9 | Submit partial test | Answer some questions, click submit | Test completes, results visible on progress page |
| I10 | Time-up auto-complete | Let timer expire | Auto-submit triggers |
| I11 | Full test results | Complete test | New history point on `/portal/progress` |
| I12 | Score source updates | Complete full test, check dashboard | Source label changes to "Basado en test completo" |
| I13 | Mobile full test | Viewport 375×812 | Timer visible, questions readable |

### J. Goals and simulator

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| J1 | Goals tab — view current goals | Open `/portal/goals` | Current goals displayed |
| J2 | Goals tab — edit and save | Change career preference, click save | Success confirmation |
| J3 | Goals tab — up to 3 priorities | Add 3 goals | All 3 saved and displayed |
| J4 | Goals tab — unsaved changes warning | Edit goal, navigate away | Warning dialog |
| J5 | Simulator tab | Switch to simulador | Score inputs render, results compute on change |
| J6 | Simulator — no persistence | Change simulator values, switch tab and back | Values reset (not saved) |

### K. Progress page

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| K1 | Score history chart | As user with multiple test points | Chart renders with correct data points |
| K2 | Score history — diagnostic vs full test markers | As user with both types | Different markers for each type |
| K3 | Projection section | Open progress page | Projection chart renders with atoms-per-week slider |
| K4 | Projection note — after short diagnostic | Latest test is short diagnostic | Note says "Un test completo puede subir el techo" |
| K5 | Projection note — after full test | Latest test is full test | Note is hidden (Issue 6 regression) |
| K6 | Atoms-per-week slider | Click different atom counts | Projection updates with debounce |
| K7 | Retest CTA section | As user with 18+ atoms | Retest CTA visible |
| K8 | Test history table | As user with multiple tests | Table with dates, types, scores, correctas |
| K9 | Empty state | As user with no completed tests | "Aún no tienes tests completados" message |
| K10 | Mobile progress | Viewport 375×812 | Charts usable, no horizontal overflow |

### L. Profile page

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| L1 | Profile loads | Open `/portal/profile` | Name, email, avatar initial displayed |
| L2 | Reminder toggles — initial state | Open profile with reminders off in DB | Checkboxes reflect DB state (Issue 4 regression) |
| L3 | Toggle reminder off | Uncheck "Recordatorios por email" | DB updates, checkbox stays unchecked on reload |
| L4 | Toggle reminder on | Check "Recordatorios en la app" | DB updates, persists on reload |
| L5 | Help section | Open profile | Email link to contacto@arbor.school visible |
| L6 | Sign out | Click "Cerrar sesión" | Session cleared, redirect to landing |

### M. Navigation and portal chrome

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| M1 | Bottom nav links | Click each nav item | Correct page loads, active state updates |
| M2 | Back navigation | Use browser back button from study | Returns to previous page without errors |
| M3 | Deep link — authenticated | Open `/portal/progress` directly while signed in | Page loads directly |
| M4 | Deep link — unauthenticated | Open `/portal/progress` while signed out | Redirect to sign-in, then back to progress |
| M5 | 404 / unknown route | Open `/portal/nonexistent` | Graceful error or redirect |

### N. Cross-cutting concerns

| # | Test case | Steps | Expected |
|---|-----------|-------|----------|
| N1 | Session expiry during use | Invalidate session mid-flow | Graceful redirect to sign-in |
| N2 | Network error during sprint answer | Disconnect network mid-answer | Error state shown, can retry |
| N3 | Double-click protection | Double-click submit buttons | Only one request sent |
| N4 | Console errors | Navigate through all main pages | No uncaught errors in console |
| N5 | Chart sizing warnings | Open progress page | No repeated sizing warnings |
| N6 | Concurrent tabs | Open portal in two tabs | No state corruption |

---

## Test user matrix

Each test case above requires a user at a specific journey state. These are the
personas the harness needs to produce:

| Persona | Journey state | Key data |
|---------|--------------|----------|
| `new_anonymous` | Not signed in | No user row |
| `fresh_student` | `planning_required` | User row, no planning profile |
| `planning_complete` | `planning_required` + profile | User + planning profile + goal |
| `diagnostic_in_progress` | `diagnostic_in_progress` | User + profile + goal + unfinished attempt |
| `activation_ready` | `activation_ready` | User + profile + goal + PAES scores |
| `active_student` | `active_learning` | All above + sprint + mission + some mastery |
| `retest_eligible` | `active_learning` + 18 mastered | Above + 18 mastered atoms |
| `retest_recommended` | `active_learning` + 30 mastered | Above + 30 mastered atoms |
| `retest_spacing_blocked` | `active_learning` + recent test | Above + full test completed <7 days ago |
| `retest_monthly_capped` | `active_learning` + 3 tests/month | Above + 3 full tests this month |
| `has_cooldown_atom` | `active_learning` + cooldown | Above + 1 atom in cooldown |
| `has_sr_review_due` | `active_learning` + review due | Above + 1 atom with review due |
| `has_streak` | `active_learning` + streak | Above + currentStreak = 5 |
| `mission_complete` | `active_learning` + mission done | Above + weekly mission completed |
| `full_test_source` | `active_learning` + full test | Above + latest test is full test |
| `multi_history` | `active_learning` + history | Above + 3+ score history points |
| `reminders_off` | Any + reminders disabled | Above + reminderEmail = false |

---

## Execution approach

### Phase 1 — Build the harness

1. Create `POST /api/dev/test-harness` with the `create_user`, `seed_state`,
   and `cleanup` actions
2. Implement session minting (encode a NextAuth JWT and set the cookie)
3. Implement persona seeding for all presets in the matrix above
4. Implement cascading cleanup

### Phase 2 — Run the tests

Use browser automation (browser-use subagent) to:

1. Hit the harness to create a user at the right state
2. Navigate to the target page
3. Interact with UI elements
4. Assert visual output and behavior
5. Hit the harness to clean up

### Phase 3 — Report

Write a findings report with:

- Pass/fail per test case
- Screenshots of failures
- New bugs discovered
- Console errors captured
