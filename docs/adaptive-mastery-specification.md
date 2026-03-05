# Arbor Adaptive Mastery Specification

Single source of truth for the learning engine powering Arbor's student portal.

---

## 1. Overview

```
Diagnostic (MST-16) → Learning Plan → Mini-clase → Next Concepto / Gap-Fill / Cooldown
```

Students take a 16-question adaptive diagnostic, then learn through personalized "mini-clases" — each focused on one atom (internal term; students see "concepto"). A mini-clase consists of a lesson followed by adaptive questions that adjust difficulty based on performance.

---

## 2. Mini-Clase Structure

Each mini-clase follows this flow:

1. **Lesson** — Paginated HTML content (1-3 worked examples). Split by `<h2>`, `<h3>`, or `<hr>` tags for step-by-step navigation.
2. **Adaptive Questions** — Start at EASY, progress through MEDIUM to HARD based on streaks.
3. **Feedback** — After each answer: choice-level feedback (why selected answer is right/wrong) + expandable general solution.
4. **Outcome** — Mastery (passed), Failure (needs prerequisite review or cooldown), or max questions reached.

---

## 3. Adaptive Difficulty Progression

Students always start at EASY. Difficulty changes based on streaks of 2:

| Current Level | After 2 Correct | After 2 Wrong |
| ------------- | --------------- | ------------- |
| Easy          | → Medium        | Stay at Easy  |
| Medium        | → Hard          | → Easy        |
| Hard          | Stay at Hard    | → Medium      |

Key: transitions are streak-based, not based on individual answers. This reduces noise from one-off correct/incorrect responses.

---

## 4. Mastery Criteria

A student masters an atom when ALL of these are true:

- **3 consecutive correct answers**
- **At least 2 of those 3 are at HARD difficulty**

This ensures the student can consistently solve difficult problems, not just easy ones.

**Example**: Student answers 3 questions in a row correctly. Questions 1 and 3 were HARD, question 2 was MEDIUM. → Only 1 HARD in the streak → NOT mastered yet. Student answers another HARD correctly (now 4 in a row, 2 HARD) → MASTERED.

---

## 5. Failure Criteria

A student fails if ANY of these occur:

- **3 consecutive incorrect answers** — indicates fundamental misunderstanding
- **10+ questions attempted with <70% accuracy** — indicates consistent struggle
- **20 questions reached without mastery** — hard cap to prevent wheel-spinning

No "provisional mastery" exists. High-but-messy performance is not enough.

**Session limits**: Max 20 questions per attempt. Up to 3 attempts per atom. No repeat questions across attempts.

---

## 6. Prerequisite Scan Protocol

Triggered when a mini-clase fails. Purpose: diagnose WHY the student failed.

### Algorithm

1. Get all prerequisite atoms for the failed atom (recursive chain)
2. For each prerequisite (deepest first in dependency order):
   - Present **1 HARD question**
   - If correct → prereq is solid, move to next
   - If incorrect → gap candidate found
     - **First pass**: stop scanning immediately, focus on this prereq
     - **Subsequent passes**: allow up to 3 questions per prereq
3. Max **3 questions per prerequisite** across the entire scan

### Outcomes

- **Gap found** → Mark prerequisite as `not_mastered`. Student's next mini-clase is this prerequisite (gap-fill). After mastering it, re-attempt the original atom.
- **No gap found** → Student's prerequisite knowledge is solid. Apply cooldown to the atom.

---

## 7. Cooldown Mechanism

When an atom fails but all prerequisites are verified solid:

- The learning route algorithm **skips this atom** until **at least 3 other atoms** have been mastered
- Then the student re-attempts with fresh eyes
- Tracked via `cooldownUntilMasteryCount` on `atom_mastery`
- Inspired by Math Academy: "all it takes to rebound is a bit of rest and a fresh pair of eyes"

---

## 8. Spaced Repetition (Activity-Based)

Inspired by Math Academy's FIRe (Fractional Implicit Repetition) system. Pure time-based intervals break down for students with irregular activity.

### Core Principles

- Reviews measured in **sessions**, not days
- Each session has a **review budget** (capped fraction)
- Calendar time is a secondary signal

### Scheduling Algorithm

**Initial interval** (after mastery, based on sturdiness):

| Sturdiness | Criteria                         | First Review |
| ---------- | -------------------------------- | ------------ |
| High       | ≤10 questions, >85% accuracy     | 5 sessions   |
| Medium     | 11-17 questions, 70-85% accuracy | 3 sessions   |
| Low        | 18-20 questions, barely passed   | 2 sessions   |

**Interval growth**: On successful review, multiply by 1.5-2.5x. On failed review, halve.

### Session Budget

| Study Frequency     | Review Budget | New Learning |
| ------------------- | ------------- | ------------ |
| Frequent (3+/week)  | Up to 30%     | 70%          |
| Moderate (1-2/week) | Up to 20%     | 80%          |
| Rare (<1/week)      | Up to 15%     | 85%          |

Hard cap: never more than **5 review items per session**.

### Review Priority (when budget is limited)

1. Most overdue items first
2. Items with shorter intervals (fragile knowledge)
3. Items that are prerequisites for upcoming new atoms

### Implicit Repetition (Simplified FIRe)

When a student masters or reviews an advanced atom, prerequisite atoms receive partial review credit:

| Distance            | Credit |
| ------------------- | ------ |
| Direct prerequisite | 1.0    |
| 2-hop prerequisite  | 0.5    |
| 3-hop prerequisite  | 0.25   |
| Beyond 3 hops       | 0      |

This extends prerequisite review intervals without explicit review.

### Inactivity Decay

If inactive >14 days, apply decay multiplier to all review intervals. First session back gets slightly higher review budget (up to 40%), then normalizes.

### Review Session Construction

- Select atoms where `sessionsSinceLastReview >= reviewIntervalSessions`
- Cap at session budget
- Use **alternate** source questions (different PAES versions the student should dominate)
- Mix atoms for interleaving (desirable difficulty)
- 1 HARD question per review item. Correct = pass, incorrect = fail.

---

## 9. SR Failure Protocol

When a student fails questions during spaced repetition review:

1. Identify all atoms that map to the failed questions (via `question_atoms`)
2. Collect all prerequisite atoms (union, deduplicated)
3. Run the same prerequisite scan: 1 HARD per prereq, stop on first gap, max 3 per prereq
4. **Gap found** → Mark prereqs as `not_mastered`, add to learning path as gap-fill priority
5. **No gap found** → Halve the review interval for the failed atoms

This actively diagnoses root causes rather than blindly re-scheduling.

---

## 10. Question Selection

### For Mini-Clases

- Query `questions` table via `question_atoms` for the target atom
- Filter by `difficultyLevel` matching current session difficulty (low=easy, medium=medium, high=hard)
- Prefer unused questions (never seen by student)
- Then least-recently-used
- Use both `official` and `alternate` source questions

### For Spaced Repetition Reviews

- Same query pattern but filtered to `source = 'alternate'`
- Always at HARD difficulty
- Mix across multiple atoms (interleaving)

---

## 11. Question Feedback

Each question provides learning feedback from the QTI XML:

### Choice-Level Feedback

- From `feedbackInline` / `qti-feedback-inline` elements within each `simpleChoice`
- Shows "Por qué X es correcta" or "Por qué X es incorrecta"
- Displayed for both the selected answer and the correct answer

### General Feedback

- From `feedbackBlock` / `qti-feedback-block` or `modalFeedback` / `qti-modal-feedback` elements
- Contains step-by-step solution ("Solución paso a paso")
- Expandable via "Ver solución completa"

### Math Rendering

- MathML preserved in QTI parsing
- Rendered via native browser MathML with CSS `all: revert` on math elements
- MathJax fallback for older browsers

---

## 12. Question Pool Requirements

Per atom, across up to 3 attempts (20 questions max per attempt, no repeats):

| Difficulty | Max per Attempt | Needed (×2 attempts) | Recommended |
| ---------- | --------------- | -------------------- | ----------- |
| Easy       | 6               | 12                   | **14**      |
| Medium     | 8               | 16                   | **18**      |
| Hard       | 6               | 12                   | **14**      |
| **Total**  | —               | —                    | **46**      |

---

## 13. Student-Facing Terminology

| Internal Term            | Student-Facing (Spanish) | Context                          |
| ------------------------ | ------------------------ | -------------------------------- |
| atom                     | concepto                 | Learning path, study headers     |
| study session            | mini-clase               | CTAs, completion screens, emails |
| spaced repetition review | repaso                   | Learning path badges             |
| learning route           | camino recomendado       | Dashboard                        |
| mastery                  | avance                   | Progress section                 |

Internal code (variable names, DB columns, API paths) uses the internal terms.

---

## 14. Schema Reference

### `atom_study_sessions`

| Column               | Type        | Description                                      |
| -------------------- | ----------- | ------------------------------------------------ |
| id                   | uuid        | Primary key                                      |
| userId               | uuid        | FK to users                                      |
| atomId               | varchar(50) | FK to atoms                                      |
| sessionType          | enum        | mastery, prereq_scan, review                     |
| attemptNumber        | integer     | 1-3                                              |
| status               | enum        | lesson, in_progress, mastered, failed, abandoned |
| currentDifficulty    | enum        | easy, medium, hard                               |
| easyStreak           | integer     | Consecutive correct at easy                      |
| mediumStreak         | integer     | Consecutive correct at medium                    |
| hardStreak           | integer     | Consecutive correct at hard                      |
| consecutiveCorrect   | integer     | Global consecutive correct                       |
| consecutiveIncorrect | integer     | Global consecutive incorrect                     |
| hardCorrectInStreak  | integer     | Hard corrects in current consecutive run         |
| totalQuestions       | integer     | Total questions attempted                        |
| correctQuestions     | integer     | Total correct answers                            |
| lessonViewedAt       | timestamp   | When lesson was viewed                           |
| startedAt            | timestamp   | Session start                                    |
| completedAt          | timestamp   | Session end                                      |

### `atom_study_responses`

| Column              | Type      | Description                |
| ------------------- | --------- | -------------------------- |
| id                  | uuid      | Primary key                |
| sessionId           | uuid      | FK to atom_study_sessions  |
| questionId          | varchar   | FK to questions            |
| position            | integer   | Question order in session  |
| difficultyLevel     | enum      | easy, medium, hard         |
| selectedAnswer      | varchar   | Student's answer           |
| isCorrect           | boolean   | Whether answer was correct |
| responseTimeSeconds | integer   | Time taken                 |
| answeredAt          | timestamp | When answered              |

### Additional fields on `atom_mastery`

| Column                    | Type      | Description                             |
| ------------------------- | --------- | --------------------------------------- |
| cooldownUntilMasteryCount | integer   | Atoms to master before cooldown expires |
| nextReviewAt              | timestamp | Calendar hint for review                |
| reviewIntervalSessions    | integer   | Primary SR interval                     |
| sessionsSinceLastReview   | integer   | Counter per session                     |
| totalReviews              | integer   | Lifetime reviews                        |
| lastReviewResult          | enum      | pass, fail, null                        |

---

## 15. Research Basis

- **3-in-a-row (3CCR)**: Widely used in ASSISTments, Mathia. Reduces guess-based false positives.
- **Requiring HARD items for mastery**: Avoids shallow mastery, promotes transfer and generalization.
- **Failure rules**: Wheel-spinning literature shows 3 consecutive errors or <70% accuracy over 10+ attempts reliably predicts prerequisite gaps.
- **Streak-based transitions**: Used in ALEKS and Direct Instruction. Reduces noise vs one-off answers.
- **No provisional mastery**: Mastery requires clear evidence. High-but-messy performance is not enough.
- **Session-based SR**: Adapted from Math Academy's FIRe system. Prevents review overload for infrequent learners.
- **Implicit repetition**: Advanced topic practice gives credit to prerequisites. Reduces explicit review burden.
- **Cooldown mechanism**: Math Academy: "all it takes to rebound is a bit of rest and a fresh pair of eyes."
- **Prerequisite diagnosis**: Targeted scanning for knowledge gaps, not blind re-teaching.
