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

/**
 * Student portal tables for admissions datasets and account-bound goals.
 * v1 scope: M1-first simulation and up to 3 primary targets per student.
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
    code: varchar("code", { length: 60 }).notNull().unique(),
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
    externalCode: varchar("external_code", { length: 60 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_career_offerings_dataset_uni_career").on(
      table.datasetId,
      table.universityId,
      table.careerId
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
  ]
);
