import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  primaryKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import {
  atomTypeEnum,
  skillTypeEnum,
  questionSourceEnum,
  difficultyLevelEnum,
  atomRelevanceEnum,
  testTypeEnum,
  questionSetStatusEnum,
} from "./enums";

/**
 * Content tables: Subjects, Standards, Atoms, Questions, Tests, Lessons
 * These define the educational content structure for PAES preparation.
 */

// ------------------------------------------------------------------------------
// SUBJECTS
// ------------------------------------------------------------------------------

export const subjects = pgTable("subjects", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 50 }).notNull(),
  description: text("description"),
  admissionYear: integer("admission_year"),
  applicationTypes: varchar("application_types", { length: 100 }).array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// STANDARDS
// ------------------------------------------------------------------------------

export const standards = pgTable("standards", {
  id: varchar("id", { length: 50 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 50 }).references(
    () => subjects.id
  ),
  axis: varchar("axis", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  includes: jsonb("includes"),
  excludes: jsonb("excludes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// ATOMS - Core learning units
// ------------------------------------------------------------------------------

export const atoms = pgTable(
  "atoms",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    subjectId: varchar("subject_id", { length: 50 }).references(
      () => subjects.id
    ),
    axis: varchar("axis", { length: 50 }).notNull(),
    standardIds: varchar("standard_ids", { length: 50 }).array().notNull(),
    atomType: atomTypeEnum("atom_type").notNull(),
    primarySkill: skillTypeEnum("primary_skill").notNull(),
    secondarySkills: skillTypeEnum("secondary_skills").array(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    masteryCriteria: jsonb("mastery_criteria").notNull(),
    conceptualExamples: jsonb("conceptual_examples"),
    scopeNotes: jsonb("scope_notes"),
    prerequisiteIds: varchar("prerequisite_ids", { length: 50 }).array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_atoms_subject").on(table.subjectId),
    index("idx_atoms_axis").on(table.axis),
  ]
);

// ------------------------------------------------------------------------------
// QUESTION SETS - Groups of questions for PP100 practice
// ------------------------------------------------------------------------------

export const questionSets = pgTable("question_sets", {
  id: varchar("id", { length: 100 }).primaryKey(),
  atomId: varchar("atom_id", { length: 50 })
    .references(() => atoms.id)
    .unique()
    .notNull(),
  status: questionSetStatusEnum("status").notNull().default("pending"),
  lowCount: integer("low_count").default(0),
  mediumCount: integer("medium_count").default(0),
  highCount: integer("high_count").default(0),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// LESSONS - Educational content for each atom
// ------------------------------------------------------------------------------

export const lessons = pgTable("lessons", {
  id: varchar("id", { length: 100 }).primaryKey(),
  atomId: varchar("atom_id", { length: 50 })
    .references(() => atoms.id)
    .unique()
    .notNull(),
  questionSetId: varchar("question_set_id", { length: 100 }).references(
    () => questionSets.id
  ),
  title: varchar("title", { length: 255 }).notNull(),
  workedExampleHtml: text("worked_example_html").notNull(),
  explanationHtml: text("explanation_html"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// QUESTIONS
// ------------------------------------------------------------------------------

export const questions = pgTable(
  "questions",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    source: questionSourceEnum("source").notNull(),
    parentQuestionId: varchar("parent_question_id", { length: 100 }),
    questionSetId: varchar("question_set_id", { length: 100 }).references(
      () => questionSets.id
    ),
    qtiXml: text("qti_xml").notNull(),
    title: varchar("title", { length: 255 }),
    correctAnswer: varchar("correct_answer", { length: 50 }).notNull(),
    difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
    difficultyScore: decimal("difficulty_score", { precision: 3, scale: 2 }),
    difficultyAnalysis: text("difficulty_analysis"),
    generalAnalysis: text("general_analysis"),
    feedbackGeneral: text("feedback_general"),
    feedbackPerOption: jsonb("feedback_per_option"),
    sourceTestId: varchar("source_test_id", { length: 100 }),
    sourceQuestionNumber: integer("source_question_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_questions_source").on(table.source),
    index("idx_questions_difficulty").on(table.difficultyLevel),
    index("idx_questions_question_set").on(table.questionSetId),
  ]
);

// ------------------------------------------------------------------------------
// QUESTION-ATOM MAPPING - Many-to-many relationship
// ------------------------------------------------------------------------------

export const questionAtoms = pgTable(
  "question_atoms",
  {
    questionId: varchar("question_id", { length: 100 })
      .references(() => questions.id, { onDelete: "cascade" })
      .notNull(),
    atomId: varchar("atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    relevance: atomRelevanceEnum("relevance").notNull(),
    reasoning: text("reasoning"),
  },
  (table) => [
    primaryKey({ columns: [table.questionId, table.atomId] }),
    index("idx_question_atoms_atom").on(table.atomId),
  ]
);

// ------------------------------------------------------------------------------
// TESTS
// ------------------------------------------------------------------------------

export const tests = pgTable("tests", {
  id: varchar("id", { length: 100 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 50 }).references(
    () => subjects.id
  ),
  testType: testTypeEnum("test_type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  admissionYear: integer("admission_year"),
  applicationType: varchar("application_type", { length: 50 }),
  questionCount: integer("question_count").notNull(),
  timeLimitMinutes: integer("time_limit_minutes"),
  isAdaptive: boolean("is_adaptive").default(false),
  stages: integer("stages"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ------------------------------------------------------------------------------
// TEST-QUESTION MAPPING - Ordered questions within a test
// ------------------------------------------------------------------------------

export const testQuestions = pgTable(
  "test_questions",
  {
    testId: varchar("test_id", { length: 100 })
      .references(() => tests.id, { onDelete: "cascade" })
      .notNull(),
    questionId: varchar("question_id", { length: 100 })
      .references(() => questions.id)
      .notNull(),
    position: integer("position").notNull(),
    stage: integer("stage").default(1),
  },
  (table) => [
    primaryKey({ columns: [table.testId, table.questionId] }),
    index("idx_test_questions_position").on(table.testId, table.position),
  ]
);
