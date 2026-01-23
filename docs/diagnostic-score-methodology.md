# Diagnostic Score Methodology

## Overview

This document analyzes and justifies the methodology for calculating diagnostic scores and learning route improvements in Arbor's PAES preparation platform.

**Core Principle:** Transitivity is fundamental. When a student demonstrates mastery of an atom, they implicitly prove mastery of ALL its prerequisites (going DOWN the prerequisite chain). This multiplies the information we extract from each diagnostic question.

---

## 1. Available Data Inventory

### 1.1 Knowledge Graph

| Asset | Count | Notes |
|-------|-------|-------|
| Total atoms | 229 | Knowledge units across 4 axes |
| Atoms with prerequisites | 174 | 76% have prerequisite chains |
| Atoms that ARE prerequisites | 163 | 71% are building blocks for others |
| Foundation atoms (no prereqs) | 50 | Base knowledge units |
| Leaf atoms (most advanced) | 61 | Terminal knowledge units |
| Maximum prerequisite depth | 5 | Deepest knowledge chains |

**Axis Distribution:**
| Axis | Atoms | % of Total |
|------|-------|------------|
| Algebra | 80 | 35% |
| Numbers | 55 | 24% |
| Probability/Stats | 51 | 22% |
| Geometry | 43 | 19% |

### 1.2 Diagnostic Test Coverage

| Asset | Count | Notes |
|-------|-------|-------|
| Total diagnostic questions | 32 | 8 routing + 24 adaptive (8 per route) |
| Questions per student | 16 | 8 routing + 8 from their route |
| Primary atoms tested | 31 | Across all 32 questions |
| Secondary atoms tested | 33 | Additional atoms per question |
| **Total with transitivity** | **184 (80%)** | Primary + Secondary + prereq chains |

### 1.3 Official Questions Bank

| Asset | Count | Notes |
|-------|-------|-------|
| Official PAES questions | 202 | From 4 historical tests (~50/test) |
| Questions with atom mappings | 202 | 100% question coverage |
| Primary atom mappings | 214 | Some questions test multiple atoms |
| Unique atoms in mappings | 96 | 42% of atoms have direct question mappings |

### 1.4 PAES Score Table (Official DEMRE)

The official conversion table maps correct answers (0-60) to PAES scores (100-1000).

**Key characteristics:**
- **Non-linear**: Points per question vary by score range
- **Low range (0-15)**: ~20 pts/question
- **Mid range (15-45)**: ~10-11 pts/question  
- **High range (45-60)**: ~18 pts/question

```
Correct → Score
0  → 100    15 → 403    30 → 567    45 → 723    60 → 1000
5  → 256    20 → 460    35 → 609    50 → 793
10 → 334    25 → 508    40 → 672    55 → 880
```

---

## 2. Transitivity: The Core Multiplier

### 2.1 How Transitivity Works

When a student correctly answers a question, they demonstrate mastery of:
1. **Primary atoms** - the main concepts tested
2. **Secondary atoms** - supporting concepts used
3. **All prerequisites** - recursively DOWN the chain

```
Student answers correctly: "Solve quadratic by factoring"
                                    ↓
Direct mastery:     Primary atom (Quadratic solving)
                    Secondary atom (Checking solutions)
                                    ↓ transitivity DOWN
Implied mastery:    "Factor trinomials" (prereq of primary)
                                    ↓
Implied mastery:    "Find GCF" (prereq)
                                    ↓
Implied mastery:    "Factor integers" (prereq)
                                    ↓
Implied mastery:    "Multiplication facts" (foundation)

Result: 1 correct answer → 2 direct + 4 transitive = 6 atoms mastered
```

### 2.2 Diagnostic Coverage (Primary + Secondary + Transitivity)

Each diagnostic question tests both primary and secondary atoms. With transitivity applied:

| Route | Questions | Direct Atoms | With Transitivity | Coverage |
|-------|-----------|--------------|-------------------|----------|
| Route A (R1+A2) | 16 | 28 | **139** | **61%** |
| Route B (R1+B2) | 16 | 34 | **146** | **64%** |
| Route C (R1+C2) | 16 | 30 | **125** | **55%** |
| All 32 combined | 32 | 58 | **184** | **80%** |

### 2.3 Questions Unlocked Per Route (16/16 Correct)

| Route | Atoms Mastered | Questions Unlocked | Per Test |
|-------|----------------|-------------------|----------|
| Route A | 139 | 144 | **36** |
| Route B | 146 | 146 | **37** |
| Route C | 125 | 128 | **32** |

### 2.4 Full Learning Path

A question is "unlocked" when the student has mastered ALL its primary atoms.

| Scenario | Atoms Mastered | Questions Unlocked | Per Test |
|----------|----------------|-------------------|----------|
| Perfect Route C (16/16) | 125 | 128 | 32 |
| + Learn remaining atoms | +104 | +74 | +19 |
| **Full mastery (all 229)** | **229** | **202** | **51** |

---

## 3. Score Calculation Options

### Option A: Pure Atom-Based (PAES Table Direct)

**Method:** Count unlocked questions → divide by tests → lookup PAES score

```
masteredAtoms = applyTransitivity(primaryAtoms + secondaryAtoms)  // 30 → 125
unlockedQuestions = countWhereAllAtomsAreMastered(masteredAtoms)  // 128
correctPerTest = unlockedQuestions / 4  // 32
score = PAES_TABLE[correctPerTest]  // 587
```

**Example (Route C 16/16 correct):**
- Direct atoms (primary + secondary): 30
- With transitivity: 125 atoms (55%)
- Unlocked: 128 questions
- Per test: 32
- Score: **587 points**

**Pros:**
- Fully grounded in atom data + transitivity
- Uses official PAES conversion
- Conservative and provable

**Cons:**
- Still below what a perfect score "feels like" (587 vs 910)
- Maximum possible score with full mastery = ~807 (51/test)

### Option B: Extrapolation Formula (Current)

**Method:** Weight diagnostic performance and extrapolate to full PAES

```
normalizedScore = weightedCorrect / maxWeightedScore
score = 100 + 900 × normalizedScore × FACTOR_ROUTE × FACTOR_COVERAGE
```

Where:
- `FACTOR_ROUTE`: A=0.7, B=0.85, C=1.0 (based on MST routing)
- `FACTOR_COVERAGE`: 0.9 (assumes 10% unknowable)

**Example (16/16 correct, Route C):**
- normalizedScore = 1.0
- Score = 100 + 900 × 1.0 × 1.0 × 0.9 = **910 points**

**Pros:**
- Reflects diagnostic difficulty appropriately
- Accounts for MST routing (harder route = higher factor)
- Can reach full 1000 point range

**Cons:**
- Not directly tied to atom mastery
- Extrapolates from 16 questions to 60

### Option C: Hybrid with Transitivity (Recommended)

**Method:** 
- **Main score**: Extrapolation formula (accounts for diagnostic design)
- **Score range**: ±5 questions using PAES table (allows reaching 1000)
- **Improvements**: Atom-based with full transitivity (provable gains)

**Why this works:**
1. The diagnostic was *designed* to sample high-value atoms with deep prerequisite chains
2. Primary + Secondary atoms + transitivity = 55-64% coverage per route
3. Extrapolation accounts for the remaining unobserved knowledge
4. Dynamic range using PAES table allows high performers to reach 1000
5. Improvements must be *provable* through specific atom learning

---

## 4. Research-Backed Justification

| Research Area | Our Implementation | Source |
|---------------|-------------------|--------|
| **Item Response Theory (IRT)** | Weighted difficulty scoring, route-based ability estimation | DEMRE PAES methodology |
| **Multi-Stage Testing (MST)** | Stage 1 → Stage 2 routing (A/B/C), route factors | ETS 2024 |
| **Cognitive Diagnostic Modeling** | Q-matrix (question-atom mappings), transitivity (skill hierarchy) | Annals of Applied Statistics 2021 |
| **Knowledge Tracing** | 229-atom graph with prerequisites, personalized learning routes | Graph-based KT research 2024 |

**Key alignment:** Our approach follows established psychometric practices while adding the unique value of prerequisite-based transitivity inference.

---

## 5. Recommended Approach: Full Transitivity Integration

### 5.1 Main Score: Extrapolation Formula

**Justification:**
1. The diagnostic tests 16 carefully selected questions
2. These questions test 28-34 atoms (primary + secondary)
3. With transitivity: 125-146 atoms mastered (55-64% coverage)
4. MST routing (A/B/C) adds additional ability differentiation
5. Extrapolation is standard practice in short-form assessments

**Formula:**
```
score = 100 + 900 × (weightedCorrect / maxWeight) × FACTOR_ROUTE × 0.9
```

**Range Calculation (using PAES table with ±5 questions):**
```javascript
estimatedCorrect = estimateCorrectFromScore(score)
minCorrect = Math.max(0, estimatedCorrect - 5)
maxCorrect = Math.min(60, estimatedCorrect + 5)
min = PAES_TABLE[minCorrect]
max = PAES_TABLE[maxCorrect]
```

| Route | 16/16 Score | Est. Correct | Range (±5 Qs) |
|-------|-------------|--------------|---------------|
| C | 910 | 56 | **807-1000** ✓ |
| B | 809 | 51 | 723-900 |
| A | 708 | 44 | 660-780 |

**Key:** High performers can now reach 1000 at the top of their range!

### 5.2 Improvement Projections: Atom-Based with Full Transitivity

**This is where transitivity becomes critical for improvements:**

```javascript
// Step 1: Current mastery with transitivity (Route C example)
currentMastered = applyTransitivity(primaryAtoms + secondaryAtoms)  // 125 atoms
currentUnlocked = countUnlocked(currentMastered)  // 128 questions

// Step 2: After learning route atoms (must teach prereqs first!)
newDirectAtoms = [...diagnosticAtoms, ...routeAtoms]
newMastered = applyTransitivity(newDirectAtoms)
newUnlocked = countUnlocked(newMastered)

// Step 3: Calculate gain
atomsGained = newMastered.size - currentMastered.size
questionsGained = newUnlocked - currentUnlocked
questionsPerTest = questionsGained / 4

// Step 4: Convert to PAES points
pointsGain = PAES_TABLE[currentCorrect + questionsPerTest] - currentScore
```

**Key insight:** When LEARNING (not proving), student must master prerequisites FIRST. No shortcuts to advanced atoms.

### 5.3 Mastery-Based Learning Constraint (CRITICAL!)

**You cannot skip prerequisites.** A student must master ALL prerequisite atoms BEFORE learning an advanced atom.

This means:
- **For DIAGNOSTIC**: Transitivity is a BONUS (proving you know an advanced atom = proving you know prereqs)
- **For ROUTES**: Transitivity is a COST (you must TEACH all prereqs first)

**Example:**
- `A-M1-NUM-01-25` has +23 transitivity (22 prerequisites)
- To LEARN this atom, student must FIRST learn all 22 prerequisites
- It's at the END of a learning chain, not the beginning!

### 5.4 Learning Waves (Prerequisite-Ordered)

Learning must happen in "waves" - each wave teaches atoms whose prerequisites are already mastered.

**Starting from Route C 16/16 (125 atoms mastered, 128 questions unlocked):**

| Wave | Atoms Learnable | Questions Gained | Cumulative |
|------|-----------------|------------------|------------|
| Start | 125 mastered | 128 unlocked | 128/202 |
| Wave 1 | ~30 atoms | +25 questions | 153/202 |
| Wave 2 | ~25 atoms | +20 questions | 173/202 |
| Wave 3 | ~20 atoms | +15 questions | 188/202 |
| Wave 4+ | ~29 atoms | +14 questions | 202/202 |
| **Full** | **104 to learn** | **+74 total** | **202/202** |

### 5.5 Best Atoms by IMMEDIATE Value (Wave 1)

These atoms are immediately learnable AND unlock the most questions:

| Atom | Prerequisites Met? | Questions Unlocked |
|------|-------------------|-------------------|
| A-M1-ALG-02-06 | ✅ Yes | +12 questions |
| A-M1-ALG-01-01 | ✅ Yes | +10 questions |
| A-M1-NUM-03-01 | ✅ Yes | +6 questions |
| A-M1-ALG-01-02 | ✅ Yes | +4 questions |
| A-M1-PROB-04-01 | ✅ Yes | +3 questions |

**Contrast with "high transitivity" atoms:**

| Atom | Prerequisites Met? | Must Learn First |
|------|-------------------|------------------|
| A-M1-NUM-01-25 | ❌ No | 22 prereqs first |
| A-M1-GEO-03-13 | ❌ No | 12 prereqs first |

### 5.6 Route Calculation (Corrected)

Routes must respect prerequisite order:

```javascript
// WRONG: Just count atoms and calculate improvement
improvement = atomsInRoute × pointsPerAtom  // ❌

// CORRECT: Build prerequisite-ordered learning path
function buildRoute(targetAtoms, currentMastered) {
  const learningPath = [];
  const toLearn = new Set(targetAtoms);
  
  while (toLearn.size > 0) {
    // Find atoms whose prereqs are all mastered
    const learnable = [...toLearn].filter(atomId => {
      const prereqs = getPrereqs(atomId);
      return prereqs.every(p => currentMastered.has(p));
    });
    
    if (learnable.length === 0) {
      // Must add prerequisites first
      addMissingPrereqs(toLearn, currentMastered);
    } else {
      learningPath.push(...learnable);
      learnable.forEach(a => {
        currentMastered.add(a);
        toLearn.delete(a);
      });
    }
  }
  
  return learningPath;  // Properly ordered!
}
```

### 5.7 Capping Rules

1. **Score cap:** Never exceed 1000 points
2. **Question cap:** Never exceed 60 correct per test
3. **Improvement cap:** `currentScore + improvement ≤ 1000`
4. **Atom cap:** Max 229 atoms (full mastery)

---

## 6. Quick Reference for Implementation

### 6.1 Main Score Calculation

```javascript
// INPUT: diagnostic responses with correct/incorrect and difficulty
function calculateMainScore(responses, route) {
  const WEIGHT_LOW = 1.0;
  const WEIGHT_MEDIUM = 1.8;
  const FACTOR_ROUTE = { A: 0.7, B: 0.85, C: 1.0 };
  const FACTOR_COVERAGE = 0.9;
  
  let weightedScore = 0;
  let maxWeightedScore = 0;
  
  for (const r of responses) {
    const weight = r.difficulty <= 0.35 ? WEIGHT_LOW : WEIGHT_MEDIUM;
    maxWeightedScore += weight;
    if (r.correct) weightedScore += weight;
  }
  
  const normalizedScore = weightedScore / maxWeightedScore;
  const score = Math.round(100 + 900 * normalizedScore * FACTOR_ROUTE[route] * FACTOR_COVERAGE);
  
  // Dynamic range using ±5 questions with PAES table
  const estimatedCorrect = estimateCorrectFromScore(score);
  const minCorrect = Math.max(0, estimatedCorrect - 5);
  const maxCorrect = Math.min(60, estimatedCorrect + 5);
  
  return {
    score,
    min: PAES_TABLE[minCorrect],
    max: PAES_TABLE[maxCorrect]
  };
}

// VERIFICATION: 
// - 16/16 Route C → 910 points, range 807-1000 (can reach 1000!)
// - 12/16 Route C → 708 points, range 660-780
```

### 6.2 Route Improvement Calculation

```javascript
// INPUT: current mastered atoms, route atoms to learn
function calculateImprovement(currentMastered, routeAtoms, currentPaesScore) {
  // Step 1: Count currently unlocked questions
  const currentUnlocked = countUnlockedQuestions(currentMastered);
  
  // Step 2: Simulate learning route (with prerequisites!)
  const newMastered = new Set(currentMastered);
  for (const atom of getPrerequisiteOrderedPath(routeAtoms, currentMastered)) {
    newMastered.add(atom);
  }
  
  // Step 3: Count newly unlocked questions
  const newUnlocked = countUnlockedQuestions(newMastered);
  const questionsGained = newUnlocked - currentUnlocked;
  const questionsPerTest = Math.round(questionsGained / 4);
  
  // Step 4: Convert to PAES points using table
  const currentCorrect = estimateCorrectFromScore(currentPaesScore);
  const newCorrect = Math.min(60, currentCorrect + questionsPerTest);
  const newScore = PAES_TABLE[newCorrect];
  const pointsGain = Math.min(newScore - currentPaesScore, 1000 - currentPaesScore);
  
  return {
    atomsToLearn: newMastered.size - currentMastered.size,
    questionsGained,
    questionsPerTest,
    pointsGain,
    newScore: Math.min(1000, currentPaesScore + pointsGain)
  };
}

// VERIFICATION (Route C 16/16):
// - Start: 125 mastered, 128 unlocked (32/test), score 910
// - Learn Wave 1 (~30 atoms): +25 questions, +6/test
// - Improvement from 32→38 correct ≈ +58 points (587→645)
```

### 6.3 Verification Test Cases

| Scenario | Input | Score | Range (±5 Qs) |
|----------|-------|-------|---------------|
| Perfect Route C | 16/16 correct | 910 | **807-1000** ✓ |
| Perfect Route B | 16/16 correct | 809 | 723-900 |
| Perfect Route A | 16/16 correct | 708 | 660-780 |
| 12/16 Route C | 12/16 correct | 708 | 660-780 |

**Coverage Test Cases:**

| Route | Atoms (Direct) | Atoms (w/ Trans) | Questions Unlocked |
|-------|---------------|------------------|-------------------|
| Route C 16/16 | 30 | 125 (55%) | 128 (32/test) |
| Route B 16/16 | 34 | 146 (64%) | 146 (37/test) |
| Route A 16/16 | 28 | 139 (61%) | 144 (36/test) |

### 6.4 Key Functions to Implement

| Function | Purpose | Key Logic |
|----------|---------|-----------|
| `applyTransitivity(atoms)` | Expand mastery via prereqs | Recursive prereq traversal |
| `countUnlockedQuestions(mastered)` | Count answerable questions | All primary atoms mastered |
| `estimateCorrectFromScore(score)` | PAES score → correct count | Reverse table lookup |
| `getPrerequisiteOrderedPath(atoms)` | Order atoms for learning | Topological sort |
| `canLearnImmediately(atom, mastered)` | Check if learnable now | All prereqs in mastered set |

---

## 7. Implementation Checklist

### Transitivity Implementation
- [x] `applyTransitivity(directAtoms)` function exists
- [x] Recursive prerequisite traversal (DOWN the chain)
- [x] Includes BOTH primary AND secondary atoms from questions
- [x] Mastery state tracks: direct, inferred, not_tested
- [x] Applied to diagnostic results (55-64% coverage per route)
- [x] Applied to route improvement calculations

### Mastery-Based Learning (CRITICAL)
- [x] Routes respect prerequisite order (`topologicalSortAtoms`)
- [x] `canLearnImmediately(atomId, mastered)` function exists
- [x] `getUnmasteredPrerequisites(atomId, ...)` calculates full chain
- [x] Efficiency = `score / totalCost` (penalizes deep atoms)
- [x] Route builder includes prerequisites in `atomsToInclude`
- [x] `topologicalSortAtoms` orders atoms correctly

### Current Score Calculation
- [x] Weighted scoring by difficulty
- [x] Route factor (A/B/C)
- [x] Coverage factor (0.9)
- [x] Dynamic range using ±5 questions with PAES table

### Improvement Calculation
- [x] Atom mastery with transitivity
- [x] Question unlock counting (all primary atoms mastered)
- [x] PAES table lookup for point conversion
- [x] Capping to 1000 max
- [x] Per-test averaging (÷4)
- [x] Route builder iterates step-by-step with `simulateQuestionUnlocks`

### Route Optimization (Verified ✅)
- [x] Atoms sorted by efficiency (score / totalCost)
- [x] Routes show prerequisite-ordered learning path
- [x] Efficiency formula penalizes deep atoms (0.52 vs 12.00)
- [x] Routes grouped by axis
- [x] `topologicalSortAtoms` ensures correct learning order

### Data Requirements
- [x] 229 atoms with prerequisites (174 have chains)
- [x] 202 official questions with atom mappings
- [x] PAES conversion table (0-60 → 100-1000)
- [x] Prerequisite depth up to 5 levels
- [ ] Increase atom-question coverage from 42% to 80%+ (future goal)

---

## 8. Summary

| Component | Method | Key Detail |
|-----------|--------|------------|
| **Main score** | Extrapolation formula | Diagnostic covers 55-64% of atoms (with transitivity) |
| **Score range** | ±5 questions via PAES table | High performers can reach 1000 |
| **Atom mastery** | Primary + Secondary + Transitivity | 28-34 direct → 125-146 with transitivity |
| **Route improvements** | Atom-based + PAES table | Must respect prerequisite order |
| **Route ordering** | Wave-based learning | Can only learn atoms with mastered prereqs |

**Key principles:**
1. **Full transitivity** = Primary atoms + Secondary atoms + ALL prerequisites (down the chain)
2. **Transitivity has TWO meanings:**
   - For DIAGNOSTIC: Bonus mastery (proving advanced = proving prereqs)
   - For ROUTES: Study load (must teach all prereqs first)
3. **Routes must be prerequisite-ordered** - can't skip to "high value" atoms
4. **104 atoms to full mastery** from Route C perfect (125 → 229)
5. All calculations cap at 1000 / 60 correct / 229 atoms

**Route C Learning Path (16/16 correct):**
```
Diagnostic: 30 direct → 125 mastered (via transitivity) → 128 questions (32/test)
            Score: 910, Range: 807-1000

To full mastery: +104 atoms → 229 mastered → 202 questions (51/test)
```

---

## Appendix A: PAES Score Table (M1)

```
Correct  Score  │  Correct  Score  │  Correct  Score
───────────────┼──────────────────┼─────────────────
   0     100   │    20     460    │    40     672
   5     256   │    25     508    │    45     723
  10     334   │    30     567    │    50     793
  15     403   │    35     609    │    55     880
                                  │    60    1000
```

## Appendix B: Deepest Prerequisite Chains

| Atom ID | Depth | Prereqs to Learn First |
|---------|-------|------------------------|
| A-M1-ALG-03-15 | 5 | 9 atoms |
| A-M1-NUM-01-18 | 5 | 9 atoms |
| A-M1-NUM-01-25 | 5 | 22 atoms |
| A-M1-PROB-01-18 | 5 | 9 atoms |
| A-M1-GEO-01-14 | 4 | 13 atoms |

These atoms are at the TOP of learning chains - valuable to reach, but require significant prerequisite study.

## Appendix C: Question Unlock Logic

### C.1 Unlock Condition

```
Question is UNLOCKED when:
  ALL primary atoms required by question are in masteredAtoms set
  (masteredAtoms includes both direct and transitivity-inferred)
```

### C.2 Example

```
Question: "Find roots of 2x² - 5x + 3 = 0"
Required atoms: [Q, P] (Quadratic solving, Polynomial factoring)

Student A: Mastered Q directly → P inferred via transitivity → ✅ UNLOCKED
Student B: Mastered P directly, not Q → ❌ LOCKED (missing Q)
Student C: Neither mastered → ❌ LOCKED (missing Q, P)
```

### C.3 Improvement Calculation (Mastery-Based)

```
Before learning route (Route C 16/16):
  masteredAtoms = 125 (primary + secondary + transitivity)
  unlockedQuestions = 128

To reach atom A-M1-NUM-01-25:
  Must first teach: 22 prerequisite atoms (in correct order)
  Then can teach: A-M1-NUM-01-25 itself
  Total atoms to study: 23
  
After completing full prerequisite chain:
  masteredAtoms = 125 + 23 = 148
  unlockedQuestions = 128 + 12 = 140
  
Improvement: +12 questions = +3/test → use PAES table for points

NOTE: Unlike diagnostic (where transitivity is FREE inference),
      learning requires TEACHING all prerequisites first!
```

## Appendix D: Transitivity - Direction and Context

### D.1 Transitivity Direction

Transitivity goes **DOWN** the prerequisite chain (to simpler atoms):

```
Atom mastered: "Solve quadratic equations" (advanced)
        ↓ transitivity DOWN
Inferred:      "Factor polynomials" (prerequisite)
        ↓
Inferred:      "Basic algebra" (foundation)
```

**NOT up the chain.** Knowing basics doesn't prove you know advanced topics.

### D.2 Full Atom Capture

When a question is answered correctly, we capture:
1. **Primary atoms** (main concepts)
2. **Secondary atoms** (supporting concepts)  
3. **All prerequisites** of both (via transitivity DOWN)

This gives us 55-64% coverage from just 16 questions.

### D.3 Diagnostic vs Routes (Quick Reference)

| Context | Transitivity = |
|---------|----------------|
| **Diagnostic** | FREE bonus (proving mastery) |
| **Routes** | Study load (teaching cost) |

See **Section 5.3** for detailed explanation and examples.
