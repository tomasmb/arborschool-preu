# Arbor Data Model

> **NOTE**: For learning algorithm details and methodology, see [arbor-learning-system-spec.md](./arbor-learning-system-spec.md).

## System Context

Test preparation platform for PAES Chile. Content repo manages atoms, questions, lessons. Student app serves content and tracks progress.

Core flow: Diagnostic → Learning plan → Mini-clase mastery → Practice tests → Spaced repetition

---

## Enums

```sql
CREATE TYPE atom_type AS ENUM (
    'concepto',
    'procedimiento',
    'representacion',
    'concepto_procedimental',
    'modelizacion',
    'argumentacion'
);

CREATE TYPE skill_type AS ENUM (
    'representar',
    'resolver_problemas',
    'modelar',
    'argumentar'
);

CREATE TYPE question_source AS ENUM (
    'official',
    'alternate'
);

CREATE TYPE difficulty_level AS ENUM ('low', 'medium', 'high');

CREATE TYPE atom_relevance AS ENUM ('primary', 'secondary');

CREATE TYPE test_type AS ENUM ('official', 'diagnostic', 'practice');

CREATE TYPE mastery_status AS ENUM ('not_started', 'in_progress', 'mastered', 'frozen');

CREATE TYPE mastery_source AS ENUM ('diagnostic', 'practice_test', 'study');

CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Session enums (for atom_study_sessions)
CREATE TYPE session_type AS ENUM ('mastery', 'prereq_scan', 'review');
CREATE TYPE session_status AS ENUM ('lesson', 'in_progress', 'mastered', 'failed', 'abandoned');
CREATE TYPE session_difficulty AS ENUM ('easy', 'medium', 'hard');
```

---

## Schema

### Content Tables

```sql
CREATE TABLE subjects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    description TEXT,
    admission_year INTEGER,
    application_types VARCHAR(100)[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE standards (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES subjects(id),
    axis VARCHAR(50) NOT NULL,
    unit VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    includes JSONB,
    excludes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atoms (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES subjects(id),
    axis VARCHAR(50) NOT NULL,
    standard_ids VARCHAR(50)[] NOT NULL,
    atom_type atom_type NOT NULL,
    primary_skill skill_type NOT NULL,
    secondary_skills skill_type[],
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mastery_criteria JSONB NOT NULL,
    conceptual_examples JSONB,
    scope_notes JSONB,
    prerequisite_ids VARCHAR(50)[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_questions (
    id VARCHAR PRIMARY KEY,
    atom_id VARCHAR(50) REFERENCES atoms(id) NOT NULL,
    difficulty_level difficulty_level NOT NULL,
    qti_xml TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE lessons (
    id VARCHAR(100) PRIMARY KEY,
    atom_id VARCHAR(50) REFERENCES atoms(id) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    lesson_html TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id VARCHAR(100) PRIMARY KEY,
    source question_source NOT NULL,
    parent_question_id VARCHAR(100) REFERENCES questions(id),
    qti_xml TEXT NOT NULL,
    title VARCHAR(255),
    correct_answer VARCHAR(50) NOT NULL,
    difficulty_level difficulty_level NOT NULL,
    difficulty_score DECIMAL(3,2),
    difficulty_analysis TEXT,
    general_analysis TEXT,
    feedback_general TEXT,
    feedback_per_option JSONB,
    source_test_id VARCHAR(100),
    source_question_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_atoms (
    question_id VARCHAR(100) REFERENCES questions(id) ON DELETE CASCADE,
    atom_id VARCHAR(50) REFERENCES atoms(id),
    relevance atom_relevance NOT NULL,
    reasoning TEXT,
    PRIMARY KEY (question_id, atom_id)
);

CREATE TABLE tests (
    id VARCHAR(100) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES subjects(id),
    test_type test_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    admission_year INTEGER,
    application_type VARCHAR(50),
    question_count INTEGER NOT NULL,
    time_limit_minutes INTEGER,
    is_adaptive BOOLEAN DEFAULT FALSE,
    stages INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE test_questions (
    test_id VARCHAR(100) REFERENCES tests(id) ON DELETE CASCADE,
    question_id VARCHAR(100) REFERENCES questions(id),
    position INTEGER NOT NULL,
    stage INTEGER DEFAULT 1,
    PRIMARY KEY (test_id, question_id)
);
```

### User Tables

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    subscription_status VARCHAR(50),
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE atom_mastery (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    atom_id VARCHAR(50) REFERENCES atoms(id),
    status mastery_status NOT NULL DEFAULT 'not_started',
    is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
    mastery_source mastery_source,
    first_mastered_at TIMESTAMPTZ,
    last_demonstrated_at TIMESTAMPTZ,
    current_streak INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, atom_id)
);

CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    test_id VARCHAR(100) REFERENCES tests(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_questions INTEGER,
    correct_answers INTEGER,
    score_percentage DECIMAL(5,2),
    stage_1_score INTEGER,
    stage_2_difficulty VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id VARCHAR(100) REFERENCES questions(id),
    test_attempt_id UUID REFERENCES test_attempts(id),
    selected_answer VARCHAR(50) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Student Portal Tables (Goal + Admissions v1)

```sql
CREATE TABLE admissions_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(40) UNIQUE NOT NULL,
    source VARCHAR(120) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(180) NOT NULL,
    short_name VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(180) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE career_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES admissions_datasets(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES universities(id) NOT NULL,
    career_id UUID REFERENCES careers(id) NOT NULL,
    external_code VARCHAR(60),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dataset_id, university_id, career_id)
);

CREATE TABLE offering_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID REFERENCES career_offerings(id) ON DELETE CASCADE NOT NULL,
    test_code VARCHAR(20) NOT NULL,
    weight_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(offering_id, test_code)
);

CREATE TABLE offering_cutoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID REFERENCES career_offerings(id) ON DELETE CASCADE NOT NULL,
    admission_year INTEGER NOT NULL,
    cutoff_score DECIMAL(7,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(offering_id, admission_year)
);

CREATE TABLE student_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    offering_id UUID REFERENCES career_offerings(id) NOT NULL,
    priority INTEGER NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, priority)
);

CREATE TABLE student_goal_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES student_goals(id) ON DELETE CASCADE NOT NULL,
    test_code VARCHAR(20) NOT NULL,
    score DECIMAL(7,2) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, test_code)
);

CREATE TABLE student_goal_buffers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES student_goals(id) ON DELETE CASCADE NOT NULL,
    buffer_points INTEGER NOT NULL DEFAULT 30,
    source VARCHAR(20) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id)
);

CREATE TABLE student_planning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    exam_date DATE,
    weekly_minutes_target INTEGER NOT NULL DEFAULT 360,
    timezone VARCHAR(80) NOT NULL DEFAULT 'America/Santiago',
    reminder_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE student_weekly_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    target_sessions INTEGER NOT NULL DEFAULT 5,
    completed_sessions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_progress_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE TABLE student_study_sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    source VARCHAR(30) NOT NULL DEFAULT 'next_action',
    estimated_minutes INTEGER NOT NULL DEFAULT 25,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_study_sprint_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID REFERENCES student_study_sprints(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    atom_id VARCHAR(50) REFERENCES atoms(id) NOT NULL,
    question_id VARCHAR(100) REFERENCES questions(id) NOT NULL,
    prompt_label VARCHAR(160),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sprint_id, position)
);

CREATE TABLE student_study_sprint_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id UUID REFERENCES student_study_sprints(id) ON DELETE CASCADE NOT NULL,
    sprint_item_id UUID REFERENCES student_study_sprint_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    selected_answer VARCHAR(50) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sprint_item_id, user_id)
);

CREATE TABLE student_reminder_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    job_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    dedupe_key VARCHAR(180) NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    payload JSONB,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dedupe_key)
);

-- Atom study sessions (mastery engine)
CREATE TABLE atom_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    atom_id VARCHAR(50) REFERENCES atoms(id) NOT NULL,
    session_type session_type NOT NULL DEFAULT 'mastery',
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status session_status NOT NULL DEFAULT 'lesson',
    current_difficulty session_difficulty NOT NULL DEFAULT 'easy',
    easy_streak INTEGER NOT NULL DEFAULT 0,
    medium_streak INTEGER NOT NULL DEFAULT 0,
    hard_streak INTEGER NOT NULL DEFAULT 0,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    consecutive_incorrect INTEGER NOT NULL DEFAULT 0,
    hard_correct_in_streak INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_questions INTEGER NOT NULL DEFAULT 0,
    lesson_viewed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE atom_study_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES atom_study_sessions(id) NOT NULL,
    question_id VARCHAR REFERENCES generated_questions(id) NOT NULL,
    position INTEGER NOT NULL,
    difficulty_level session_difficulty NOT NULL,
    selected_answer VARCHAR(10),
    is_correct BOOLEAN,
    response_time_seconds INTEGER,
    answered_at TIMESTAMPTZ,
    UNIQUE(session_id, position)
);
```

### Indexes

```sql
CREATE INDEX idx_atoms_subject ON atoms(subject_id);
CREATE INDEX idx_atoms_axis ON atoms(axis);
CREATE INDEX idx_atoms_prerequisites ON atoms USING GIN(prerequisite_ids);
CREATE INDEX idx_questions_source ON questions(source);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_generated_questions_atom ON generated_questions(atom_id);
CREATE INDEX idx_question_atoms_atom ON question_atoms(atom_id);
CREATE INDEX idx_test_questions_position ON test_questions(test_id, position);
CREATE INDEX idx_atom_mastery_user ON atom_mastery(user_id);
CREATE INDEX idx_atom_mastery_status ON atom_mastery(status);
CREATE INDEX idx_atom_mastery_spaced_rep ON atom_mastery(last_demonstrated_at) WHERE is_mastered = TRUE;
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_student_responses_user ON student_responses(user_id);
CREATE INDEX idx_student_responses_question ON student_responses(question_id);
CREATE INDEX idx_admissions_datasets_active ON admissions_datasets(is_active);
CREATE INDEX idx_student_goals_user ON student_goals(user_id);
CREATE INDEX idx_student_planning_profiles_user ON student_planning_profiles(user_id);
CREATE INDEX idx_student_weekly_missions_user ON student_weekly_missions(user_id);
CREATE INDEX idx_student_weekly_missions_status ON student_weekly_missions(status);
CREATE INDEX idx_student_study_sprints_user ON student_study_sprints(user_id);
CREATE INDEX idx_student_study_sprints_status ON student_study_sprints(status);
CREATE INDEX idx_student_study_sprint_items_sprint ON student_study_sprint_items(sprint_id);
CREATE INDEX idx_student_study_sprint_responses_sprint ON student_study_sprint_responses(sprint_id);
CREATE INDEX idx_student_study_sprint_responses_user ON student_study_sprint_responses(user_id);
CREATE INDEX idx_student_reminder_jobs_user ON student_reminder_jobs(user_id);
CREATE INDEX idx_student_reminder_jobs_status ON student_reminder_jobs(status);
CREATE INDEX idx_student_reminder_jobs_schedule ON student_reminder_jobs(scheduled_for);
CREATE INDEX idx_atom_study_sessions_user ON atom_study_sessions(user_id);
CREATE INDEX idx_atom_study_sessions_user_atom ON atom_study_sessions(user_id, atom_id);
CREATE INDEX idx_atom_study_sessions_status ON atom_study_sessions(status);
CREATE INDEX idx_atom_study_responses_session ON atom_study_responses(session_id);
```

---

## Relationships

```
subjects ──1:N──▶ atoms ──1:1──▶ lessons
                    │
                    ├──1:N──▶ generated_questions (AI-generated per atom)
                    │
                    ├──N:N──▶ atoms (prerequisites)
                    │
                    └──N:N──▶ questions (via question_atoms)

tests ──N:N──▶ questions (via test_questions)

users ──N:N──▶ atoms (via atom_mastery)
  │
  ├──1:N──▶ atom_study_sessions ──1:N──▶ atom_study_responses ──N:1──▶ generated_questions
  │
  ├──1:N──▶ test_attempts ──1:N──▶ student_responses
  │
  └──1:N──▶ student_responses ──N:1──▶ questions
```

---

## ID Formats

| Entity               | Format                           | Example                           |
| -------------------- | -------------------------------- | --------------------------------- |
| Subject              | `paes_{test}`                    | `paes_m1`                         |
| Standard             | `{subject}-{axis}-{seq}`         | `M1-ALG-01`                       |
| Atom                 | `A-{subject}-{axis}-{std}-{seq}` | `A-M1-ALG-01-01`                  |
| Lesson               | `lesson-{atom_id}`               | `lesson-A-M1-ALG-01-01`           |
| Question (official)  | `{test_id}-Q{num}`               | `prueba-invierno-2026-Q1`         |
| Question (alternate) | `alt-{parent_id}-{seq}`          | `alt-prueba-invierno-2026-Q1-001` |
| Generated question   | (pipeline-assigned)              | varies                            |

---

## Business Rules

### Mastery

- Binary: `is_mastered` is TRUE or FALSE
- Mini-clase mastery: 3 consecutive correct, at least 2 at HARD difficulty
- Mini-clase failure: 3 consecutive incorrect OR <70% accuracy after 10 questions OR 20 questions without mastery → status = `frozen`, trigger prerequisite scan
- Auto-unfreeze: when all prerequisites become mastered, frozen → in_progress
- `mastery_source`: records how mastery was achieved (diagnostic, practice_test, study)
- `last_demonstrated_at`: used for spaced repetition scheduling

### Question Generation

- AI-generated questions stored in `generated_questions` per atom (replaces legacy `question_sets` table)
- Minimum 3 questions per difficulty level (9+ total per atom)

### Prerequisites

- `prerequisite_ids` array defines direct dependencies
- Use recursive CTE for full prerequisite chain
- Cannot start atom until all prerequisites mastered

---

## Key Queries

```sql
-- Get questions for atom (official/alternate)
SELECT q.* FROM questions q
JOIN question_atoms qa ON q.id = qa.question_id
WHERE qa.atom_id = $1
ORDER BY q.difficulty_level;

-- Get generated questions for atom study (mastery engine)
SELECT * FROM generated_questions
WHERE atom_id = $1
ORDER BY CASE difficulty_level
    WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3
END;

-- Get prerequisites (recursive)
WITH RECURSIVE prereqs AS (
    SELECT id, prerequisite_ids, 0 as depth FROM atoms WHERE id = $1
    UNION ALL
    SELECT a.id, a.prerequisite_ids, p.depth + 1
    FROM atoms a JOIN prereqs p ON a.id = ANY(p.prerequisite_ids)
    WHERE p.depth < 10
)
SELECT DISTINCT id FROM prereqs WHERE id != $1;

-- Check if should unfreeze
SELECT BOOL_AND(COALESCE(am.is_mastered, FALSE)) as all_prereqs_mastered
FROM atoms a
CROSS JOIN LATERAL unnest(a.prerequisite_ids) AS prereq_id
LEFT JOIN atom_mastery am ON am.atom_id = prereq_id AND am.user_id = $1
WHERE a.id = $2;

-- Atoms due for spaced repetition (session-based: sessionsSinceLastReview >= reviewIntervalSessions)
SELECT a.id, a.title, am.last_demonstrated_at
FROM atom_mastery am
JOIN atoms a ON am.atom_id = a.id
WHERE am.user_id = $1 AND am.is_mastered = TRUE
  AND am.last_demonstrated_at < NOW() - INTERVAL '7 days'
ORDER BY am.last_demonstrated_at LIMIT 10;

-- Update mastery from mini-clase
UPDATE atom_mastery SET
    status = 'mastered',
    is_mastered = TRUE,
    mastery_source = 'study',
    first_mastered_at = COALESCE(first_mastered_at, NOW()),
    last_demonstrated_at = NOW(),
    current_streak = $streak,
    total_attempts = total_attempts + $attempts,
    correct_attempts = correct_attempts + $correct,
    updated_at = NOW()
WHERE user_id = $1 AND atom_id = $2;
```

---

## Sample Data

### Atom

```json
{
  "id": "A-M1-ALG-01-01",
  "subject_id": "paes_m1",
  "axis": "algebra_y_funciones",
  "standard_ids": ["M1-ALG-01"],
  "atom_type": "representacion",
  "primary_skill": "representar",
  "title": "Traducción bidireccional entre lenguaje natural y algebraico",
  "mastery_criteria": [
    "Traduce enunciados con operaciones básicas",
    "Representa relaciones de cantidad"
  ],
  "prerequisite_ids": []
}
```

### Question feedback_per_option

```json
{
  "ChoiceA": "Error: applied operations in wrong order...",
  "ChoiceB": "Correct: parentheses first, then multiplication...",
  "ChoiceC": "Error: miscalculated inside parentheses...",
  "ChoiceD": "Error: treated multiplication as addition..."
}
```

### Atom Mastery

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "atom_id": "A-M1-ALG-01-01",
  "status": "mastered",
  "is_mastered": true,
  "mastery_source": "study",
  "first_mastered_at": "2026-01-10T14:30:00Z",
  "last_demonstrated_at": "2026-01-10T14:30:00Z",
  "current_streak": 3
}
```
