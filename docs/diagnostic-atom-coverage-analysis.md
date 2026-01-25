# Diagnostic Atom Coverage Analysis

**Generated:** January 2026  
**Purpose:** Document all possible diagnostic outcomes and their atom mastery profiles.

---

## Overview

The diagnostic test consists of **16 questions**:
- **Stage 1 (R1):** 8 routing questions (same for everyone)
- **Stage 2:** 8 adaptive questions based on R1 performance
  - Route A (easy): R1 score 0-3
  - Route B (medium): R1 score 4-6
  - Route C (hard): R1 score 7-8

---

## Atom Inventory

### Total Atoms: 229

| Axis | Count | % |
|------|-------|---|
| Álgebra y Funciones | 80 | 34.9% |
| Números | 55 | 24.0% |
| Probabilidad y Estadística | 51 | 22.3% |
| Geometría | 43 | 18.8% |

### Prerequisite Structure

- Atoms with prerequisites: 174 (76%)
- Total prerequisite links: 317
- Average prerequisites per atom: 1.38

---

## Simulation Results (65,536 Outcomes)

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total possible answer combinations | 65,536 |
| Unique mastery profiles | 29,296 |
| Atoms always mastered | 0 |
| **Atoms never reachable** | **45 (19.7%)** |
| Atoms sometimes mastered | 184 (80.3%) |

### Route Distribution

| Route | R1 Score | Outcomes | % | Unique Profiles |
|-------|----------|----------|---|-----------------|
| A (easy) | 0-3 | 23,808 | 36.3% | 3,120 |
| B (medium) | 4-6 | 39,424 | 60.2% | 24,384 |
| C (hard) | 7-8 | 2,304 | 3.5% | 1,792 |

### Score Distribution (Binomial)

| Score | Outcomes | % | Visual |
|-------|----------|---|--------|
| 0/16 | 1 | 0.00% | |
| 1/16 | 16 | 0.02% | |
| 2/16 | 120 | 0.18% | |
| 3/16 | 560 | 0.85% | █ |
| 4/16 | 1,820 | 2.78% | ██ |
| 5/16 | 4,368 | 6.67% | ████ |
| 6/16 | 8,008 | 12.22% | ████████ |
| 7/16 | 11,440 | 17.46% | ███████████ |
| **8/16** | **12,870** | **19.64%** | █████████████ |
| 9/16 | 11,440 | 17.46% | ███████████ |
| 10/16 | 8,008 | 12.22% | ████████ |
| 11/16 | 4,368 | 6.67% | ████ |
| 12/16 | 1,820 | 2.78% | ██ |
| 13/16 | 560 | 0.85% | █ |
| 14/16 | 120 | 0.18% | |
| 15/16 | 16 | 0.02% | |
| 16/16 | 1 | 0.00% | |

---

## Mastery Coverage Analysis

### Coverage Range

- **Minimum:** 0 atoms (0%) - all 16 questions wrong
- **Maximum:** 137 atoms (59.8%) - Route B, 14/16 correct

### Coverage Distribution

| Atoms Mastered | Outcomes | % of Total |
|----------------|----------|------------|
| 0 | 44 | 0.07% |
| 1-10 | 372 | 0.57% |
| 11-25 | 3,557 | 5.43% |
| 26-50 | 14,841 | 22.65% |
| **51-75** | **20,600** | **31.43%** |
| **76-100** | **21,129** | **32.24%** |
| 101-125 | 4,932 | 7.53% |
| 126-150 | 61 | 0.09% |

**Key insight:** ~64% of outcomes result in 51-100 atoms being marked as mastered.

---

## Per-Route Coverage Details

### Route A (Easy Path)
- **Triggers when:** R1 score 0-3 correct
- **Direct atoms tested:** 28
- **Best case (all correct):** 139 atoms (60.7%)
- **Worst case (all wrong):** 28 atoms scanned, 0 mastered (12.2% coverage)

### Route B (Medium Path)
- **Triggers when:** R1 score 4-6 correct
- **Direct atoms tested:** 34
- **Best case (all correct):** 146 atoms (63.8%)
- **Worst case (all wrong):** 34 atoms scanned, 0 mastered (14.8% coverage)

### Route C (Hard Path)
- **Triggers when:** R1 score 7-8 correct
- **Direct atoms tested:** 30
- **Best case (all correct):** 125 atoms (54.6%)
- **Worst case (all wrong):** 30 atoms scanned, 0 mastered (13.1% coverage)

### Why Route C Has Less Coverage

Route C tests "advanced" atoms that share prerequisites with R1. The prerequisite chains overlap significantly, so fewer NEW atoms are inferred via transitivity.

| Route | Stage 2 Direct Atoms | NEW Prerequisites (not from R1) | Total Added |
|-------|----------------------|---------------------------------|-------------|
| A | 14 | 29 | +37 |
| B | 20 | 32 | +44 |
| C | 18 | 14 | +23 |

---

## Sample Mastery Profiles by Score

| Score | Route | Direct Mastered | Direct Not Mastered | Inferred | Total Mastered | Coverage |
|-------|-------|-----------------|---------------------|----------|----------------|----------|
| 0/16 | A | 0 | 28 | 0 | 0 | 0.0% |
| 1/16 | A | 2 | 26 | 6 | 8 | 3.5% |
| 2/16 | A | 5 | 23 | 10 | 15 | 6.6% |
| 3/16 | A | 10 | 18 | 12 | 22 | 9.6% |
| 4/16 | A | 10 | 18 | 12 | 22 | 9.6% |
| 5/16 | A | 10 | 18 | 12 | 22 | 9.6% |
| 6/16 | A | 11 | 17 | 23 | 34 | 14.8% |
| 7/16 | A | 11 | 17 | 23 | 34 | 14.8% |
| 8/16 | A | 13 | 15 | 29 | 42 | 18.3% |
| 9/16 | A | 13 | 15 | 29 | 42 | 18.3% |
| 10/16 | A | 15 | 13 | 39 | 54 | 23.6% |
| 11/16 | A | 20 | 8 | 57 | 77 | 33.6% |
| 12/16 | B | 27 | 7 | 82 | 109 | 47.6% |
| 13/16 | B | 29 | 5 | 82 | 111 | 48.5% |
| 14/16 | B | 30 | 4 | 92 | 122 | 53.3% |
| 15/16 | C | 28 | 2 | 79 | 107 | 46.7% |
| 16/16 | C | 30 | 0 | 95 | 125 | 54.6% |

---

## Atoms Never Reachable (45 total)

These atoms cannot be determined as mastered/not-mastered through the diagnostic, regardless of which route or answers.

| Axis | Count | % of Axis Unreachable |
|------|-------|----------------------|
| Álgebra y Funciones | 26 | 32.5% |
| Probabilidad y Estadística | 10 | 19.6% |
| Geometría | 6 | 14.0% |
| Números | 3 | 5.5% |

**Implication:** These atoms will always be marked as `not_tested` in the mastery state.

---

## Transitivity Rules

The mastery algorithm applies these rules:

1. **Direct mastery:** If a question is answered correctly, all its atoms (primary + secondary) are marked as mastered.
2. **Direct non-mastery:** If a question is answered incorrectly, its atoms are marked as not mastered.
3. **Transitivity:** If atom X is mastered, ALL prerequisites of X are also mastered (recursively).
4. **No negative transitivity:** If atom X is not mastered, prerequisites are NOT marked as not mastered.
5. **Direct results never overridden:** If an atom was directly tested, transitivity cannot change its status.

---

## Key Insights for Product Decisions

### 1. Maximum Observable Coverage is ~60%
Even with perfect diagnostic performance, we can only determine mastery for ~60% of atoms. This is a fundamental limitation of a 16-question test.

### 2. Route B Provides Best Signal
Route B (medium difficulty) provides the highest coverage (up to 63.8%) because its questions branch into more diverse prerequisite chains.

### 3. 45 Atoms Require Future Testing
These atoms will need to be assessed through:
- Practice questions during learning
- Additional diagnostic modules
- Lesson completion indicators

### 4. Most Students Will Have 51-100 Atoms Determined
~64% of all possible outcomes result in this range, which is the "typical" diagnostic signal.

### 5. Mastery Percentages by Axis Are Misleading
Since we only test a subset of atoms per axis, showing "X% mastered in Algebra" understates real mastery (untested atoms default to not mastered).

---

## Appendix: Mastery State Types

```typescript
type MasterySource = "direct" | "inferred" | "not_tested";

interface MasteryState {
  atomId: string;
  mastered: boolean;
  source: MasterySource;
}
```

- **direct:** Atom was tested via a diagnostic question
- **inferred:** Atom was marked mastered via transitivity (prerequisite of a mastered atom)
- **not_tested:** Atom was not tested and not inferred — status unknown
