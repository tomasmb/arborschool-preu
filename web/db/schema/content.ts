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
} from "./enums";

/**
 * Content tables: Subjects, Standards, Atoms, Questions, Tests, Lessons
 * These define the educational content structure for PAES preparation.
 */

// ------------------------------------------------------------------------------
// JSONB TYPE DEFINITIONS
// ------------------------------------------------------------------------------

/** Error family describing a common student mistake */
type ErrorFamily = {
  name: string;
  description: string;
  howToAddress: string;
};

/** AI-generated enrichment metadata for an atom (written by content pipeline) */
export type AtomEnrichment = {
  /** Guardrails defining what is in/out of scope for this atom */
  scopeGuardrails: {
    inScope: string[];
    outOfScope: string[];
    prerequisites: string[];
    commonTraps: string[];
  };
  /** Criteria describing what makes a question easy/medium/hard */
  difficultyRubric: {
    easy: string[];
    medium: string[];
    hard: string[];
  };
  /** Phrases or topics to avoid due to ambiguity */
  ambiguityAvoid: string[];
  /** Common error families students make on this atom */
  errorFamilies: ErrorFamily[];
  /** Ways the atom can be represented (e.g. "algebraic", "tabular") */
  representationVariants: string[];
  /** Number profiles for question generation */
  numbersProfiles: string[];
  /** Image types required for this atom (e.g. "coordinate_plane") */
  requiredImageTypes: string[];
  /** Future directions for extending this atom's coverage */
  futureTargets: string[];
};

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
    enrichment: jsonb("enrichment").$type<AtomEnrichment>(),
    prerequisiteIds: varchar("prerequisite_ids", { length: 50 }).array(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_atoms_subject").on(table.subjectId),
    index("idx_atoms_axis").on(table.axis),
  ]
);

// ------------------------------------------------------------------------------
// GENERATED QUESTIONS - Pipeline-produced practice questions per atom
// ------------------------------------------------------------------------------

/** Validation report shape: each gate is "pass", "fail", or "pending" */
export type ValidatorsReport = {
  xsd: "pass" | "fail" | "pending";
  paes: "pass" | "fail" | "pending";
  solve_check: "pass" | "fail" | "pending";
  scope: "pass" | "fail" | "pending";
  exemplar_copy_check: "pass" | "fail" | "pending";
  feedback: "pass" | "fail" | "pending";
  dedupe: "pass" | "fail" | "pending";
  final_llm_check: "pass" | "fail" | "pending";
};

export const generatedQuestions = pgTable(
  "generated_questions",
  {
    id: text("id").primaryKey(),
    atomId: text("atom_id")
      .notNull()
      .references(() => atoms.id),
    qtiXml: text("qti_xml").notNull(),
    difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
    componentTag: text("component_tag").notNull(),
    operationSkeletonAst: text("operation_skeleton_ast").notNull(),
    surfaceContext: text("surface_context").notNull().default("pure_math"),
    numbersProfile: text("numbers_profile").notNull().default("small_integers"),
    fingerprint: text("fingerprint").notNull(),
    validators: jsonb("validators").$type<ValidatorsReport>().notNull(),
    targetExemplarId: text("target_exemplar_id"),
    distanceLevel: text("distance_level"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_generated_questions_atom").on(table.atomId),
    index("idx_generated_questions_atom_diff").on(
      table.atomId,
      table.difficultyLevel
    ),
  ]
);

// ------------------------------------------------------------------------------
// LESSONS - Educational content for each atom
// ------------------------------------------------------------------------------

export const lessons = pgTable("lessons", {
  id: varchar("id", { length: 100 }).primaryKey(),
  atomId: varchar("atom_id", { length: 50 })
    .references(() => atoms.id)
    .unique()
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lessonHtml: text("lesson_html").notNull(),
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
    // qtiXml is the single source of truth for question content and correct answer
    qtiXml: text("qti_xml").notNull(),
    title: varchar("title", { length: 255 }),
    difficultyLevel: difficultyLevelEnum("difficulty_level").notNull(),
    difficultyScore: decimal("difficulty_score", { precision: 3, scale: 2 }),
    sourceTestId: varchar("source_test_id", { length: 100 }),
    sourceQuestionNumber: integer("source_question_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_questions_source").on(table.source),
    index("idx_questions_difficulty").on(table.difficultyLevel),
    index("idx_questions_parent").on(table.parentQuestionId),
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
    index("idx_question_atoms_question").on(table.questionId),
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
