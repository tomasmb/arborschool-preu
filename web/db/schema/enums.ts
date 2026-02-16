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

// Question origin classification
export const questionSourceEnum = pgEnum("question_source", [
  "official", // From official PAES tests
  "alternate", // Variations of official questions
  "question_set", // Generated for PP100 practice
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
  "frozen", // Blocked due to failed PP100
]);

// How mastery was achieved
export const masterySourceEnum = pgEnum("mastery_source", [
  "diagnostic",
  "practice_test",
  "pp100",
]);

// Question set generation workflow status
export const questionSetStatusEnum = pgEnum("question_set_status", [
  "pending",
  "generated",
  "reviewed",
]);

// User roles in the system
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
