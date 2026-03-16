import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  userRoleEnum,
  masteryStatusEnum,
  masterySourceEnum,
  reviewResultEnum,
} from "./enums";
import { atoms } from "./content";
import { questions, tests } from "./content";
import { schools } from "./access";

/**
 * User tables: Users, Atom Mastery, Test Attempts, Student Responses
 * These track student progress and learning history.
 */

// ------------------------------------------------------------------------------
// USERS
// ------------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  schoolId: uuid("school_id").references(() => schools.id, {
    onDelete: "set null",
  }),
  subscriptionStatus: varchar("subscription_status", { length: 50 })
    .notNull()
    .default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  // Email preferences (for waitlist/launch notifications)
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

  // Results snapshot for email notifications (stored at signup)
  paesScoreMin: integer("paes_score_min"),
  paesScoreMax: integer("paes_score_max"),
  performanceTier: varchar("performance_tier", { length: 20 }),
  topRouteName: varchar("top_route_name", { length: 100 }),
  topRouteQuestionsUnlocked: integer("top_route_questions_unlocked"),
  topRoutePointsGain: integer("top_route_points_gain"),

  // Mini-form fields (collected before test)
  userType: varchar("user_type", { length: 20 }),
  curso: varchar("curso", { length: 20 }),

  // Profiling fields (collected after results, optional)
  paesGoal: varchar("paes_goal", { length: 20 }),
  paesDate: varchar("paes_date", { length: 20 }),
  inPreu: boolean("in_preu"),
  schoolType: varchar("school_type", { length: 30 }),

  // Platform launch notification tracking
  notifiedPlatformLaunch: boolean("notified_platform_launch")
    .notNull()
    .default(false),
  notifiedPlatformLaunchAt: timestamp("notified_platform_launch_at", {
    withTimezone: true,
  }),

  // 24h follow-up email tracking (deduplication)
  followupEmailScheduledAt: timestamp("followup_email_scheduled_at", {
    withTimezone: true,
  }),

  // Daily streak tracking (consecutive days with ≥1 mastery)
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  lastStreakDate: date("last_streak_date"),
});

// ------------------------------------------------------------------------------
// ATOM MASTERY - Tracks student's mastery of each atom
// ------------------------------------------------------------------------------

export const atomMastery = pgTable(
  "atom_mastery",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    atomId: varchar("atom_id", { length: 50 })
      .references(() => atoms.id)
      .notNull(),
    status: masteryStatusEnum("status").notNull().default("not_started"),
    isMastered: boolean("is_mastered").notNull().default(false),
    masterySource: masterySourceEnum("mastery_source"),
    firstMasteredAt: timestamp("first_mastered_at", { withTimezone: true }),
    lastDemonstratedAt: timestamp("last_demonstrated_at", {
      withTimezone: true,
    }),
    currentStreak: integer("current_streak").default(0),
    totalAttempts: integer("total_attempts").default(0),
    correctAttempts: integer("correct_attempts").default(0),
    cooldownUntilMasteryCount: integer("cooldown_until_mastery_count").default(
      0
    ),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    reviewIntervalSessions: integer("review_interval_sessions"),
    sessionsSinceLastReview: integer("sessions_since_last_review").default(0),
    totalReviews: integer("total_reviews").default(0),
    lastReviewResult: reviewResultEnum("last_review_result"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.atomId] }),
    index("idx_atom_mastery_user").on(table.userId),
    index("idx_atom_mastery_status").on(table.status),
  ]
);

// ------------------------------------------------------------------------------
// TEST ATTEMPTS - Records of student test sessions
// Supports anonymous attempts (userId nullable) that can be linked later
// ------------------------------------------------------------------------------

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    testId: varchar("test_id", { length: 100 }).references(() => tests.id),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalQuestions: integer("total_questions"),
    correctAnswers: integer("correct_answers"),
    scorePercentage: decimal("score_percentage", { precision: 5, scale: 2 }),
    stage1Score: integer("stage_1_score"),
    stage2Difficulty: varchar("stage_2_difficulty", { length: 20 }),
    paesScoreMin: integer("paes_score_min"),
    paesScoreMax: integer("paes_score_max"),
    resolvedQuestions: jsonb("resolved_questions"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_test_attempts_user").on(table.userId)]
);

// ------------------------------------------------------------------------------
// STUDENT RESPONSES - Individual question answers
// Supports anonymous responses (userId nullable) linked via testAttemptId
// ------------------------------------------------------------------------------

export const studentResponses = pgTable(
  "student_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    questionId: varchar("question_id", { length: 100 }).references(
      () => questions.id
    ),
    testAttemptId: uuid("test_attempt_id")
      .references(() => testAttempts.id)
      .notNull(),
    selectedAnswer: varchar("selected_answer", { length: 50 }).notNull(),
    isCorrect: boolean("is_correct").notNull(),
    responseTimeSeconds: integer("response_time_seconds"),
    stage: integer("stage").default(1),
    questionIndex: integer("question_index"),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_student_responses_user").on(table.userId),
    index("idx_student_responses_attempt").on(table.testAttemptId),
    uniqueIndex("uq_student_responses_attempt_question").on(
      table.testAttemptId,
      table.questionId
    ),
  ]
);
