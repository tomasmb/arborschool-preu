import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Database enums matching the Arbor data model specification.
 */

// Atom classification by knowledge type
export const atomTypeEnum = pgEnum("atom_type", [
  "concepto",
  "procedimiento",
  "representacion",
  "concepto_procedimental",
  "modelizacion",
  "argumentacion",
]);

// Skill types aligned with PAES competencies
export const skillTypeEnum = pgEnum("skill_type", [
  "representar",
  "resolver_problemas",
  "modelar",
  "argumentar",
]);

// Question origin classification (official PAES tests and variations only)
export const questionSourceEnum = pgEnum("question_source", [
  "official", // From official PAES tests
  "alternate", // Variations of official questions
]);

// Question difficulty levels
export const difficultyLevelEnum = pgEnum("difficulty_level", [
  "low",
  "medium",
  "high",
]);

// How strongly a question relates to an atom
export const atomRelevanceEnum = pgEnum("atom_relevance", [
  "primary",
  "secondary",
]);

// Test classification
export const testTypeEnum = pgEnum("test_type", [
  "official",
  "diagnostic",
  "practice",
]);

// Student's mastery progress for an atom
export const masteryStatusEnum = pgEnum("mastery_status", [
  "not_started",
  "in_progress",
  "mastered",
  "needs_verification", // Full test discrepancy detected; pending quick check
  "frozen", // Blocked due to failed PP100
  "blocked_prereq_no_questions", // Prereq scan cannot verify bases (no medium/high items)
  "blocked_cannot_pass_base", // Root atom: student did not reach mastery; do not loop retries
]);

// How mastery was achieved
export const masterySourceEnum = pgEnum("mastery_source", [
  "diagnostic",
  "practice_test",
  "pp100",
  "study",
]);

// User roles in the system
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);

// Study session types (atom study sessions)
export const sessionTypeEnum = pgEnum("session_type", [
  "mastery",
  "prereq_scan",
  "review",
  "verification", // Quick check for full-test discrepancies
]);

// Study session progression status
export const sessionStatusEnum = pgEnum("session_status", [
  "lesson",
  "in_progress",
  "mastered",
  "failed",
  "abandoned",
]);

// Difficulty levels within a study session
export const sessionDifficultyEnum = pgEnum("session_difficulty", [
  "easy",
  "medium",
  "hard",
]);

// Review outcome for spaced-review sessions
export const reviewResultEnum = pgEnum("review_result", ["pass", "fail"]);

// Access grant types for controlling platform access
export const accessGrantTypeEnum = pgEnum("access_grant_type", [
  "email",
  "domain",
]);
