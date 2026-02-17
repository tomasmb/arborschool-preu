# Generated Questions — Schema & Migration Spec

This document specifies what the `arborschool-content` pipeline writes
to the database. Use it to create the migration, update the API, and
wire up the frontend.

---

## Overview

The content repo has a question generation pipeline that produces
practice questions for each **atom** (smallest teachable concept).
Today, generated questions are stuffed into the same `questions` table
used for official PAES test questions. This causes column mismatches
and mixed concerns. The fix:

1. Create a new `generated_questions` table for pipeline output.
2. Drop the `question_sets` table (redundant — see below).
3. Ensure `atoms.enrichment` JSONB column exists.
4. Stop writing generated questions to `questions`.
5. Remove generated-question rows from `question_atoms` junction table
   (generated questions link to their atom directly, not via junction).

---

## What Changes

### New table: `generated_questions`

Each row is a single practice question produced by the pipeline. All
questions that reach the DB have passed every validation gate (XSD,
solvability, deduplication, feedback enrichment, final LLM check).

```sql
CREATE TYPE difficulty_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE generated_questions (
  -- Identity
  id               TEXT PRIMARY KEY,
  atom_id          TEXT NOT NULL REFERENCES atoms(id),

  -- Content
  qti_xml          TEXT NOT NULL,
  difficulty_level difficulty_level NOT NULL,

  -- Pipeline metadata
  component_tag           TEXT NOT NULL,
  operation_skeleton_ast  TEXT NOT NULL,
  surface_context         TEXT NOT NULL DEFAULT 'pure_math',
  numbers_profile         TEXT NOT NULL DEFAULT 'small_integers',
  fingerprint             TEXT NOT NULL,

  -- Validation report (all checks that ran)
  validators              JSONB NOT NULL,

  -- Exemplar anchoring (nullable)
  target_exemplar_id      TEXT,
  distance_level          TEXT,

  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_questions_atom
  ON generated_questions(atom_id);
```

**Column details:**

| Column | Example value | Notes |
|---|---|---|
| id | `"A-M1-ALG-01-01-E-003"` | Globally unique, set by pipeline |
| atom_id | `"A-M1-ALG-01-01"` | FK to atoms — 1 atom has N questions |
| qti_xml | (full XML string) | QTI 3.0 with feedback embedded inline |
| difficulty_level | `"medium"` | Enum: `low`, `medium`, `high` |
| component_tag | `"evaluate_expression"` | Which aspect of the atom is tested |
| operation_skeleton_ast | `"add(var,const)"` | Abstract structure for dedup |
| surface_context | `"pure_math"` | Or contextual scenario type |
| numbers_profile | `"small_integers"` | Number types: small_integers, fractions, decimals, mixed |
| fingerprint | `"sha256:a1b2c3..."` | Content hash for dedup across runs |
| validators | (see JSON below) | Pass/fail for each validation check |
| target_exemplar_id | `"PAES-2024-Q42"` or null | Official question this was modeled after |
| distance_level | `"far"` or null | How different from the exemplar |

**validators JSONB shape:**

```json
{
  "xsd": "pass",
  "paes": "pass",
  "solve_check": "pass",
  "scope": "pass",
  "exemplar_copy_check": "pass",
  "feedback": "pass",
  "dedupe": "pass",
  "final_llm_check": "pass"
}
```

Each value is `"pass"`, `"fail"`, or `"pending"`.

### New column: `atoms.enrichment`

The pipeline enriches each atom with pedagogical metadata before
generating questions. This is stored as a JSONB column on the
existing `atoms` table.

```sql
ALTER TABLE atoms
  ADD COLUMN IF NOT EXISTS enrichment JSONB;
```

**enrichment JSONB shape:**

```json
{
  "scope_guardrails": {
    "in_scope": ["linear equations with one variable"],
    "out_of_scope": ["systems of equations"],
    "prerequisites": ["integer arithmetic"],
    "common_traps": ["confusing coefficients with constants"]
  },
  "difficulty_rubric": {
    "easy": ["single operation, small integers"],
    "medium": ["two operations, fractions allowed"],
    "hard": ["multi-step with contextual interpretation"]
  },
  "ambiguity_avoid": ["avoid ambiguous variable naming"],
  "error_families": [
    {
      "name": "sign_error",
      "description": "Forgetting to flip sign when moving terms",
      "how_to_address": "Include distractors with sign errors"
    }
  ],
  "representation_variants": ["algebraic", "tabular", "graphical"],
  "numbers_profiles": ["small_integers", "fractions", "mixed", "decimals"],
  "required_image_types": ["coordinate_plane"],
  "future_targets": ["extend to inequalities"]
}
```

### Drop table: `question_sets`

The `question_sets` table is redundant. It stored per-atom pool
metadata (difficulty counts, status, timestamp) that can be derived:

```sql
-- Difficulty counts
SELECT difficulty_level, COUNT(*)
FROM generated_questions
WHERE atom_id = 'A-M1-ALG-01-01'
GROUP BY difficulty_level;

-- "generated_at" equivalent
SELECT MAX(updated_at)
FROM generated_questions
WHERE atom_id = 'A-M1-ALG-01-01';
```

```sql
DROP TABLE IF EXISTS question_sets;
```

### Clean up: `questions` and `question_atoms`

Remove any rows that were written by the pipeline:

```sql
-- Remove generated questions from the official questions table
DELETE FROM question_atoms
WHERE question_id IN (
  SELECT id FROM questions WHERE source = 'question_set'
);

DELETE FROM questions WHERE source = 'question_set';

-- Drop the question_set_id column (no longer needed)
ALTER TABLE questions DROP COLUMN IF EXISTS question_set_id;
```

The `question_atoms` junction table remains for official questions
(which can map to multiple atoms). Generated questions don't need it
because each one belongs to exactly one atom via `atom_id` directly.

---

## What the Pipeline Writes (and When)

The pipeline runs per atom and has 10 phases. Only two phases write
to the database:

### Phase 1 — Enrichment → `atoms.enrichment`

```sql
UPDATE atoms
SET enrichment = $1::jsonb
WHERE id = $2;
```

Runs early. Updates the enrichment JSONB column on the existing atom
row. Does NOT create or modify any other atom columns.

### Phase 10 — Sync → `generated_questions`

```sql
INSERT INTO generated_questions (
  id, atom_id, qti_xml, difficulty_level, component_tag,
  operation_skeleton_ast, surface_context, numbers_profile,
  fingerprint, validators, target_exemplar_id, distance_level
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (id) DO UPDATE SET
  qti_xml = EXCLUDED.qti_xml,
  difficulty_level = EXCLUDED.difficulty_level,
  component_tag = EXCLUDED.component_tag,
  operation_skeleton_ast = EXCLUDED.operation_skeleton_ast,
  surface_context = EXCLUDED.surface_context,
  numbers_profile = EXCLUDED.numbers_profile,
  fingerprint = EXCLUDED.fingerprint,
  validators = EXCLUDED.validators,
  target_exemplar_id = EXCLUDED.target_exemplar_id,
  distance_level = EXCLUDED.distance_level,
  updated_at = now();
```

Uses upsert so re-running the pipeline for an atom replaces its
questions cleanly.

---

## API Changes Required

### Atoms endpoints

The frontend currently expects a `question_set_count` field on atom
responses. Replace it with `generated_question_count`:

```json
{
  "id": "A-M1-ALG-01-01",
  "titulo": "Ecuaciones lineales con una incógnita",
  "generated_question_count": 47,
  "enrichment_status": "present"
}
```

Where:
- `generated_question_count` = `SELECT COUNT(*) FROM generated_questions WHERE atom_id = $1`
- `enrichment_status` = `"present"` if `atoms.enrichment IS NOT NULL`, else `"missing"`

### Generated questions endpoints (new)

The app needs at minimum:

1. **List generated questions for an atom**
   `GET /atoms/{atom_id}/generated-questions`
   Returns: list with id, difficulty, validators summary, created_at.
   Supports filtering by difficulty_level.

2. **Get a single generated question**
   `GET /generated-questions/{question_id}`
   Returns: full record including qti_xml.

3. **Get difficulty distribution for an atom**
   `GET /atoms/{atom_id}/generated-questions/stats`
   Returns: `{ "low": 12, "medium": 23, "high": 12, "total": 47 }`

### Existing questions endpoints — no change

Official questions (`GET /tests/{test_id}/questions/...`) stay exactly
as they are. They read from the `questions` table which now only
contains official and alternate-source questions.

---

## Frontend Impact

### Replace `question_set_count`

Every reference to `question_set_count` in atom list/detail views
should use `generated_question_count` instead. Current locations
that use it (all reading from atom API responses):

- Atom list views (filtering atoms with generated questions)
- Generation tab (showing generation status per atom)
- Overview tab (statistics/progress)

### Feedback is in QTI XML

Generated questions do NOT have separate `feedback_general` or
`feedback_per_option` columns. All feedback is embedded in the
QTI 3.0 XML as:
- `qti-feedback-inline` inside each `qti-simple-choice` (per-option)
- `qti-feedback-block` at the end of `qti-item-body` (step-by-step solution)

The QTI renderer must parse these from the XML. Official questions
may still have the separate feedback columns populated.

---

## Migration Checklist

1. Add `enrichment JSONB` column to `atoms` (if not present)
2. Create `generated_questions` table with index on `atom_id`
3. Migrate existing `source='question_set'` rows from `questions` →
   `generated_questions` (if any exist from earlier pipeline runs)
4. Clean up `question_atoms` rows for migrated questions
5. Drop `question_sets` table
6. Drop `question_set_id` column from `questions`
7. Optionally drop `question_set` from the `question_source` enum
8. Update API to serve `generated_question_count` on atom endpoints
9. Add generated questions API endpoints
10. Update frontend to use new field name and endpoints
