# Arbor Learning Method

## Overview

Build personalized courses from a Knowledge Graph where each atom
is taught and mastery is proven before advancing.

```
Diagnostic (MST-16) → Learning Plan → Mini-clase (lesson + adaptive questions)
                                       → Next Concepto or Gap-Fill
```

Each atom = 1 lesson + 1 adaptive question session.
Mastery is binary. Failed atoms trigger a prerequisite scan.

---

## Atom Structure

| Component     | Description                                                           |
| ------------- | --------------------------------------------------------------------- |
| Lesson        | 1-3 worked examples; covers every step required by atom's E/M/H items |
| Question Set  | Questions at 3 difficulty levels (minimum 3 per level per atom)       |
| Prerequisites | Links to atoms whose steps are required but taught elsewhere          |

Lesson is generated AFTER the question set to ensure alignment.

---

## Mini-Clase Algorithm

The mini-clase is the adaptive question session that determines whether
a student has mastered an atom. It replaces the old PP100 system with
tighter mastery criteria and explicit failure rules.

### State

```
difficulty: Easy | Medium | Hard          (start at Easy)
streak[difficulty]: consecutive correct at each difficulty level
consecutive_correct: global consecutive correct count
consecutive_incorrect: global consecutive incorrect count
hard_correct_in_streak: hard-level corrects within current consecutive run
total_questions: count
correct_questions: count
```

### Difficulty Progression

| Current Level | After 2 Correct → | After 2 Wrong → |
| ------------- | ----------------- | --------------- |
| Easy          | Medium            | Stay at Easy    |
| Medium        | Hard              | Easy            |
| Hard          | Stay at Hard      | Medium          |

### On Correct

```
streak[difficulty] += 1
consecutive_correct += 1
consecutive_incorrect = 0
correct_questions += 1
total_questions += 1

if difficulty == Hard:
    hard_correct_in_streak += 1

if difficulty != Hard and streak[difficulty] >= 2:
    difficulty = next_level_up
    streak[difficulty] = 0
```

### On Wrong

```
streak[difficulty] = 0
consecutive_correct = 0
hard_correct_in_streak = 0
consecutive_incorrect += 1
total_questions += 1

if difficulty != Easy:
    difficulty = next_level_down
    streak[difficulty] = 0
```

### Mastery Criteria

All must be true:

- `consecutive_correct >= 3`
- `hard_correct_in_streak >= 2`

### Failure Criteria

Any of:

- `consecutive_incorrect >= 3`
- `total_questions >= 10 AND correct_questions / total_questions < 0.70`
- `total_questions >= 20` (without mastery)

### Session Limits

- Max 20 questions per attempt
- Up to 3 attempts per atom
- No repeat questions across attempts

### Question Pool Per Atom

| Difficulty | Recommended |
| ---------- | ----------- |
| Easy       | 14          |
| Medium     | 18          |
| Hard       | 14          |
| **Total**  | **46**      |

---

## Diagnostic (MST-16)

| Stage   | Questions | Selection                    |
| ------- | --------- | ---------------------------- |
| Stage 1 | 8         | Fixed set covering key atoms |
| Stage 2 | 8         | Adaptive based on Stage 1    |

Outcome per atom:

- Correct → `mastered` with `mastery_source = 'diagnostic'`
- Incorrect → `not_started`

After the diagnostic: generate a learning plan ordered by priority
and prerequisites.

---

## Learning Loop

```
1. TEACH: Present lesson (1-3 worked examples, paginated)
           │
           ▼
2. ASSESS: Run Mini-clase (adaptive questions)
           │
    ┌──────┴──────┐
    ▼             ▼
MASTERED     NOT MASTERED
    │             │
    ▼             ▼
Record       Prerequisite Scan
Schedule SR  → Gap found: mark prereq not_mastered, gap-fill
Advance      → No gap: cooldown (skip until 3 atoms mastered)
             Complete gap-fill or cooldown
             Reteach original atom
             Return to step 2
```

---

## Prerequisite Scan Protocol

Triggered when a mini-clase fails.

```
Failed Atom
    │
    ▼
Get prerequisite chain (recursive)
    │
    ▼
For each prerequisite (deepest first):
    ├── Present 1 HARD question
    ├── If correct: prereq is solid, move to next
    └── If incorrect: gap candidate found
        ├── First pass: stop scanning, focus on this prereq
        └── Max 3 questions per prereq across entire scan
    │
    ▼
Gap found → mark prereq as not_mastered, gap-fill priority
No gap found → cooldown (atom skipped until 3 others mastered)
```

---

## Cooldown Mechanism

- When an atom fails but all prerequisites are solid
- The learning-route algorithm skips this atom until 3 other atoms
  have been mastered
- Then the student re-attempts with fresh eyes
- Tracked via `cooldownUntilMasteryCount` on `atom_mastery`

---

## Dynamic Plan Updates

The plan updates after every mini-clase outcome.

### Signals

| Signal         | Source                                    |
| -------------- | ----------------------------------------- |
| Gap detection  | Mini-clase failure + prereq scan          |
| SR due date    | Session counter + calendar hint           |
| Sturdiness     | Mini-clase accuracy + questions-to-master |
| Cooldown state | `atom_mastery.cooldownUntilMasteryCount`  |

### Rules

| Outcome                       | Action                                |
| ----------------------------- | ------------------------------------- |
| Mastery (fast, high accuracy) | Advance; SR in 5+ sessions            |
| Mastery (moderate accuracy)   | Advance; SR in 3 sessions             |
| Mastery (barely passed)       | Advance; SR in 2 sessions             |
| Failure + gap found           | Freeze atom; gap-fill prereq first    |
| Failure + no gap              | Cooldown; skip until 3 atoms mastered |

---

## Spaced Repetition (Activity-Based)

### Core Principles

- Reviews measured in **sessions**, not days
- Each session has a review budget (capped fraction)
- Calendar time is a secondary signal; long inactivity causes faster decay

### Scheduling

| Sturdiness                       | First Review |
| -------------------------------- | ------------ |
| High (≤10 items, >85%)           | 5 sessions   |
| Medium (11-17 items, 70-85%)     | 3 sessions   |
| Low (18-20 items, barely passed) | 2 sessions   |

### Session Budget

| Study Frequency     | Review Budget | New Learning |
| ------------------- | ------------- | ------------ |
| Frequent (3+/week)  | Up to 30%     | 70%          |
| Moderate (1-2/week) | Up to 20%     | 80%          |
| Rare (<1/week)      | Up to 15%     | 85%          |

Hard cap: max 5 review items per session.

### Implicit Repetition (Simplified FIRe)

When a student masters or reviews an advanced atom, prerequisite atoms
get partial review credit:

| Hop Distance        | Credit |
| ------------------- | ------ |
| Direct prerequisite | 1.0    |
| 2-hop prerequisite  | 0.5    |
| 3-hop prerequisite  | 0.25   |
| Beyond              | 0      |

### Inactivity Decay

If inactive >14 days, apply a decay multiplier to all review intervals.
First session back has higher budget (up to 40%).

### Review Construction

- Select atoms where `sessionsSinceLastReview >= reviewIntervalSessions`
- Cap at session budget (max 5)
- Use alternate questions (different PAES versions)
- Mix atoms for interleaving
- 1 HARD question per review item

### SR Failure Protocol

When a student fails review questions:

1. Identify all atoms mapping to failed questions
2. Collect all prerequisites (union, deduplicated)
3. Run same prereq scan: 1 HARD per prereq, max 3
4. Gap found → mark prereqs `not_mastered`, gap-fill
5. No gap → halve review interval for failed atoms

### Outcomes

| Result           | Action                                   |
| ---------------- | ---------------------------------------- |
| Pass (correct)   | Extend interval ×1.5-2.5                 |
| Fail (incorrect) | Prereq scan → gap-fill or halve interval |

---

## Priority Scoring

Use question-to-atom mappings to prioritize atoms.

```
score = direct_questions + (indirect_questions × decay)
```

- `direct_questions`: test questions with this atom as PRIMARY
- `indirect_questions`: test questions with dependent atoms as PRIMARY
- `decay`: 0.5 per level up the graph

Selection: filter to atoms with prerequisites mastered,
sort by score descending.

Rationale: biggest wins for smallest time — atoms unlocking more test
questions are prioritized.

---

## Mastery States

| State         | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `not_started` | No interaction                                   |
| `in_progress` | Currently in mini-clase                          |
| `mastered`    | Mini-clase completed successfully                |
| `frozen`      | Failed; waiting for prerequisites or in cooldown |

```
not_started → in_progress → mastered
                   │
                   ▼
                frozen → in_progress (when prereqs mastered or cooldown expires)
```

---

## KG Requirements

| Data                        | Used For                                |
| --------------------------- | --------------------------------------- |
| `prerequisite_ids`          | Scan, gap-fill, blocking                |
| `question_atoms`            | Priority scoring, question selection    |
| `questions` (by difficulty) | Mini-clase (3+ per difficulty per atom) |
| `lessons`                   | Teaching (1-3 worked examples)          |

---

## Research Basis

- **3-in-a-row (3CCR):** ASSISTments, Mathia — reduces guess-based
  false positives
- **HARD items for mastery:** avoids shallow mastery, promotes transfer
- **Failure rule:** wheel-spinning literature — 3 consecutive errors
  or <70% over 10+
- **Streak-based transitions:** ALEKS, Direct Instruction — reduce noise
- **Session-based SR:** adapted from Math Academy FIRe
  (Fractional Implicit Repetition)
- **Implicit repetition:** advanced topic practice gives credit
  to prerequisites
- **Activity-based scheduling:** prevents review overload for
  infrequent learners
