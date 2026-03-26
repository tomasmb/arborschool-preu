import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  decimal,
  boolean,
  date,
  text,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { atoms, questions } from "./content";
import {
  sessionTypeEnum,
  sessionStatusEnum,
  sessionDifficultyEnum,
} from "./enums";

/**
 * Student portal tables for admissions datasets, score objectives,
 * career interests, and account-bound planning profiles.
 */

export const admissionsDatasets = pgTable(
  "admissions_datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: varchar("version", { length: 40 }).notNull().unique(),
    source: varchar("source", { length: 120 }).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_admissions_datasets_active").on(table.isActive)]
);

export const universities = pgTable(
  "universities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 30 }).notNull().unique(),
    name: varchar("name", { length: 180 }).notNull(),
    shortName: varchar("short_name", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_universities_name").on(table.name)]
);

export const careers = pgTable(
  "careers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 180 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_careers_name").on(table.name)]
);

export const careerOfferings = pgTable(
  "career_offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    datasetId: uuid("dataset_id")
      .references(() => admissionsDatasets.id, { onDelete: "cascade" })
      .notNull(),
    universityId: uuid("university_id")
      .references(() => universities.id, { onDelete: "restrict" })
      .notNull(),
    careerId: uuid("career_id")
      .references(() => careers.id, { onDelete: "restrict" })
      .notNull(),
    location: varchar("location", { length: 120 }),
    externalCode: varchar("external_code", { length: 60 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_career_offerings_dataset_uni_career_loc").on(
      table.datasetId,
      table.universityId,
      table.careerId,
      table.location
    ),
    index("idx_career_offerings_dataset").on(table.datasetId),
  ]
);

export const offeringWeights = pgTable(
  "offering_weights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .references(() => careerOfferings.id, { onDelete: "cascade" })
      .notNull(),
    testCode: varchar("test_code", { length: 20 }).notNull(),
    weightPercent: decimal("weight_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_offering_weights_offering_test").on(
      table.offeringId,
      table.testCode
    ),
    index("idx_offering_weights_offering").on(table.offeringId),
  ]
);

export const offeringCutoffs = pgTable(
  "offering_cutoffs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .references(() => careerOfferings.id, { onDelete: "cascade" })
      .notNull(),
    admissionYear: integer("admission_year").notNull(),
    cutoffScore: decimal("cutoff_score", { precision: 7, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_offering_cutoffs_offering_year").on(
      table.offeringId,
      table.admissionYear
    ),
    index("idx_offering_cutoffs_offering").on(table.offeringId),
  ]
);

export const studentGoals = pgTable(
  "student_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    offeringId: uuid("offering_id")
      .references(() => careerOfferings.id, { onDelete: "restrict" })
      .notNull(),
    priority: integer("priority").notNull(),
    isPrimary: boolean("is_primary").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_goals_user_priority").on(
      table.userId,
      table.priority
    ),
    index("idx_student_goals_user").on(table.userId),
  ]
);

export const studentGoalScores = pgTable(
  "student_goal_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .references(() => studentGoals.id, { onDelete: "cascade" })
      .notNull(),
    testCode: varchar("test_code", { length: 20 }).notNull(),
    score: decimal("score", { precision: 7, scale: 2 }).notNull(),
    source: varchar("source", { length: 20 }).notNull().default("student"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_goal_scores_goal_test").on(
      table.goalId,
      table.testCode
    ),
    index("idx_student_goal_scores_goal").on(table.goalId),
  ]
);

export const studentGoalBuffers = pgTable(
  "student_goal_buffers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .references(() => studentGoals.id, { onDelete: "cascade" })
      .notNull(),
    bufferPoints: integer("buffer_points").notNull().default(30),
    source: varchar("source", { length: 20 }).notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_goal_buffers_goal").on(table.goalId),
    index("idx_student_goal_buffers_goal").on(table.goalId),
  ]
);

// ---------------------------------------------------------------------------
// STUDENT-CENTRIC SCORE OBJECTIVES
// ---------------------------------------------------------------------------

/**
 * General PAES score targets owned by the student (M1, CL, ELECTIVO, etc.).
 * One row per user + test. These are NOT per-career -- the student sets their
 * own objectives and the career positioning engine evaluates them against
 * any career offering.
 */
export const studentScoreTargets = pgTable(
  "student_score_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    testCode: varchar("test_code", { length: 20 }).notNull(),
    score: decimal("score", { precision: 7, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_score_targets_user_test").on(
      table.userId,
      table.testCode
    ),
    index("idx_student_score_targets_user").on(table.userId),
  ]
);

/**
 * Academic profile estimates (NEM, Ranking) that come from school
 * performance. Evolving values the student updates as their school year
 * progresses. Feed into career positioning formulas.
 */
export const studentProfileScores = pgTable(
  "student_profile_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    scoreType: varchar("score_type", { length: 20 }).notNull(),
    score: decimal("score", { precision: 7, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_profile_scores_user_type").on(
      table.userId,
      table.scoreType
    ),
    index("idx_student_profile_scores_user").on(table.userId),
  ]
);

export const studentPlanningProfiles = pgTable(
  "student_planning_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    examDate: date("exam_date"),
    weeklyMinutesTarget: integer("weekly_minutes_target")
      .notNull()
      .default(360),
    timezone: varchar("timezone", { length: 80 })
      .notNull()
      .default("America/Santiago"),
    reminderInApp: boolean("reminder_in_app").notNull().default(true),
    reminderEmail: boolean("reminder_email").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_planning_profiles_user").on(table.userId),
    index("idx_student_planning_profiles_user").on(table.userId),
  ]
);

export const studentTestHours = pgTable(
  "student_test_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    testCode: varchar("test_code", { length: 10 }).notNull(),
    weeklyMinutes: integer("weekly_minutes").notNull().default(180),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_test_hours_user_test").on(
      table.userId,
      table.testCode
    ),
    index("idx_student_test_hours_user").on(table.userId),
  ]
);

export const studentWeeklyMissions = pgTable(
  "student_weekly_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weekStartDate: date("week_start_date").notNull(),
    weekEndDate: date("week_end_date").notNull(),
    targetSessions: integer("target_sessions").notNull().default(5),
    completedSessions: integer("completed_sessions").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    lastProgressAt: timestamp("last_progress_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_weekly_missions_user_week_start").on(
      table.userId,
      table.weekStartDate
    ),
    index("idx_student_weekly_missions_user").on(table.userId),
    index("idx_student_weekly_missions_status").on(table.status),
  ]
);

export const studentStudySprints = pgTable(
  "student_study_sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"),
    source: varchar("source", { length: 30 }).notNull().default("next_action"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(25),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_student_study_sprints_user").on(table.userId),
    index("idx_student_study_sprints_status").on(table.status),
    index("idx_student_study_sprints_user_status").on(
      table.userId,
      table.status
    ),
  ]
);

export const studentStudySprintItems = pgTable(
  "student_study_sprint_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sprintId: uuid("sprint_id")
      .references(() => studentStudySprints.id, { onDelete: "cascade" })
      .notNull(),
    position: integer("position").notNull(),
    atomId: varchar("atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    questionId: varchar("question_id", { length: 100 })
      .references(() => questions.id)
      .notNull(),
    promptLabel: varchar("prompt_label", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_study_sprint_items_sprint_position").on(
      table.sprintId,
      table.position
    ),
    index("idx_student_study_sprint_items_sprint").on(table.sprintId),
  ]
);

export const studentStudySprintResponses = pgTable(
  "student_study_sprint_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sprintId: uuid("sprint_id")
      .references(() => studentStudySprints.id, { onDelete: "cascade" })
      .notNull(),
    sprintItemId: uuid("sprint_item_id")
      .references(() => studentStudySprintItems.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    selectedAnswer: varchar("selected_answer", { length: 50 }).notNull(),
    isCorrect: boolean("is_correct").notNull(),
    responseTimeSeconds: integer("response_time_seconds"),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_study_sprint_responses_item_user").on(
      table.sprintItemId,
      table.userId
    ),
    index("idx_student_study_sprint_responses_sprint").on(table.sprintId),
    index("idx_student_study_sprint_responses_user").on(table.userId),
  ]
);

export const studentReminderJobs = pgTable(
  "student_reminder_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    channel: varchar("channel", { length: 20 }).notNull().default("email"),
    jobType: varchar("job_type", { length: 40 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    dedupeKey: varchar("dedupe_key", { length: 180 }).notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_student_reminder_jobs_dedupe_key").on(table.dedupeKey),
    index("idx_student_reminder_jobs_user").on(table.userId),
    index("idx_student_reminder_jobs_status").on(table.status),
    index("idx_student_reminder_jobs_schedule").on(table.scheduledFor),
    index("idx_student_reminder_jobs_dispatch").on(
      table.channel,
      table.status,
      table.scheduledFor
    ),
  ]
);

// ------------------------------------------------------------------------------
// ATOM STUDY SESSIONS - Individual mastery/review sessions per atom
// ------------------------------------------------------------------------------

export const atomStudySessions = pgTable(
  "atom_study_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    atomId: varchar("atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    sessionType: sessionTypeEnum("session_type").notNull().default("mastery"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: sessionStatusEnum("status").notNull().default("lesson"),
    currentDifficulty: sessionDifficultyEnum("current_difficulty")
      .notNull()
      .default("easy"),
    easyStreak: integer("easy_streak").notNull().default(0),
    mediumStreak: integer("medium_streak").notNull().default(0),
    hardStreak: integer("hard_streak").notNull().default(0),
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
    consecutiveIncorrect: integer("consecutive_incorrect").notNull().default(0),
    hardCorrectInStreak: integer("hard_correct_in_streak").notNull().default(0),
    totalQuestions: integer("total_questions").notNull().default(0),
    correctQuestions: integer("correct_questions").notNull().default(0),
    lessonViewedAt: timestamp("lesson_viewed_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_atom_study_sessions_user").on(table.userId),
    index("idx_atom_study_sessions_user_atom").on(table.userId, table.atomId),
    index("idx_atom_study_sessions_status").on(table.status),
    index("idx_atom_study_sessions_user_type").on(
      table.userId,
      table.sessionType
    ),
  ]
);

// ------------------------------------------------------------------------------
// ATOM STUDY RESPONSES - Individual answers within a study session
// ------------------------------------------------------------------------------

export const atomStudyResponses = pgTable(
  "atom_study_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .references(() => atomStudySessions.id)
      .notNull(),
    questionId: text("question_id").notNull(),
    atomId: varchar("atom_id", { length: 50 }).references(() => atoms.id),
    position: integer("position").notNull(),
    difficultyLevel: sessionDifficultyEnum("difficulty_level").notNull(),
    selectedAnswer: varchar("selected_answer", { length: 10 }),
    isCorrect: boolean("is_correct"),
    responseTimeSeconds: integer("response_time_seconds"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_atom_study_responses_session").on(table.sessionId),
    uniqueIndex("ux_atom_study_responses_session_position").on(
      table.sessionId,
      table.position
    ),
  ]
);
