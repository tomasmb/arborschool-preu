import { relations } from "drizzle-orm";
import {
  subjects,
  standards,
  atoms,
  generatedQuestions,
  lessons,
  questions,
  questionAtoms,
  tests,
  testQuestions,
} from "./content";
import { users, atomMastery, testAttempts, studentResponses } from "./users";

/**
 * Drizzle ORM relations for type-safe queries with joins.
 * These enable the relational query API (db.query.tableName.findMany({ with: { ... } }))
 */

// ------------------------------------------------------------------------------
// CONTENT RELATIONS
// ------------------------------------------------------------------------------

export const subjectsRelations = relations(subjects, ({ many }) => ({
  standards: many(standards),
  atoms: many(atoms),
  tests: many(tests),
}));

export const standardsRelations = relations(standards, ({ one }) => ({
  subject: one(subjects, {
    fields: [standards.subjectId],
    references: [subjects.id],
  }),
}));

export const atomsRelations = relations(atoms, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [atoms.subjectId],
    references: [subjects.id],
  }),
  generatedQuestions: many(generatedQuestions),
  lesson: many(lessons),
  questionAtoms: many(questionAtoms),
  atomMastery: many(atomMastery),
}));

export const generatedQuestionsRelations = relations(
  generatedQuestions,
  ({ one }) => ({
    atom: one(atoms, {
      fields: [generatedQuestions.atomId],
      references: [atoms.id],
    }),
  })
);

export const lessonsRelations = relations(lessons, ({ one }) => ({
  atom: one(atoms, {
    fields: [lessons.atomId],
    references: [atoms.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  parentQuestion: one(questions, {
    fields: [questions.parentQuestionId],
    references: [questions.id],
    relationName: "question_variants",
  }),
  variants: many(questions, { relationName: "question_variants" }),
  questionAtoms: many(questionAtoms),
  testQuestions: many(testQuestions),
  studentResponses: many(studentResponses),
}));

export const questionAtomsRelations = relations(questionAtoms, ({ one }) => ({
  question: one(questions, {
    fields: [questionAtoms.questionId],
    references: [questions.id],
  }),
  atom: one(atoms, {
    fields: [questionAtoms.atomId],
    references: [atoms.id],
  }),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [tests.subjectId],
    references: [subjects.id],
  }),
  testQuestions: many(testQuestions),
  testAttempts: many(testAttempts),
}));

export const testQuestionsRelations = relations(testQuestions, ({ one }) => ({
  test: one(tests, {
    fields: [testQuestions.testId],
    references: [tests.id],
  }),
  question: one(questions, {
    fields: [testQuestions.questionId],
    references: [questions.id],
  }),
}));

// ------------------------------------------------------------------------------
// USER RELATIONS
// ------------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  atomMastery: many(atomMastery),
  testAttempts: many(testAttempts),
  studentResponses: many(studentResponses),
}));

export const atomMasteryRelations = relations(atomMastery, ({ one }) => ({
  user: one(users, {
    fields: [atomMastery.userId],
    references: [users.id],
  }),
  atom: one(atoms, {
    fields: [atomMastery.atomId],
    references: [atoms.id],
  }),
}));

export const testAttemptsRelations = relations(
  testAttempts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [testAttempts.userId],
      references: [users.id],
    }),
    test: one(tests, {
      fields: [testAttempts.testId],
      references: [tests.id],
    }),
    studentResponses: many(studentResponses),
  })
);

export const studentResponsesRelations = relations(
  studentResponses,
  ({ one }) => ({
    user: one(users, {
      fields: [studentResponses.userId],
      references: [users.id],
    }),
    question: one(questions, {
      fields: [studentResponses.questionId],
      references: [questions.id],
    }),
    testAttempt: one(testAttempts, {
      fields: [studentResponses.testAttemptId],
      references: [testAttempts.id],
    }),
  })
);
