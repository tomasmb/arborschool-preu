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
import { schools, accessGrants } from "./access";
import {
  admissionsDatasets,
  universities,
  careers,
  careerOfferings,
  offeringWeights,
  offeringCutoffs,
  studentGoals,
  studentGoalScores,
  studentGoalBuffers,
  studentPlanningProfiles,
  studentWeeklyMissions,
  studentStudySprints,
  studentStudySprintItems,
  studentStudySprintResponses,
  studentReminderJobs,
} from "./studentPortal";

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

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  atomMastery: many(atomMastery),
  testAttempts: many(testAttempts),
  studentResponses: many(studentResponses),
  studentGoals: many(studentGoals),
  planningProfiles: many(studentPlanningProfiles),
  weeklyMissions: many(studentWeeklyMissions),
  studySprints: many(studentStudySprints),
  studySprintResponses: many(studentStudySprintResponses),
  reminderJobs: many(studentReminderJobs),
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

// ------------------------------------------------------------------------------
// STUDENT PORTAL RELATIONS
// ------------------------------------------------------------------------------

export const admissionsDatasetsRelations = relations(
  admissionsDatasets,
  ({ many }) => ({
    careerOfferings: many(careerOfferings),
  })
);

export const universitiesRelations = relations(universities, ({ many }) => ({
  careerOfferings: many(careerOfferings),
}));

export const careersRelations = relations(careers, ({ many }) => ({
  careerOfferings: many(careerOfferings),
}));

export const careerOfferingsRelations = relations(
  careerOfferings,
  ({ one, many }) => ({
    dataset: one(admissionsDatasets, {
      fields: [careerOfferings.datasetId],
      references: [admissionsDatasets.id],
    }),
    university: one(universities, {
      fields: [careerOfferings.universityId],
      references: [universities.id],
    }),
    career: one(careers, {
      fields: [careerOfferings.careerId],
      references: [careers.id],
    }),
    weights: many(offeringWeights),
    cutoffs: many(offeringCutoffs),
    studentGoals: many(studentGoals),
  })
);

export const offeringWeightsRelations = relations(
  offeringWeights,
  ({ one }) => ({
    offering: one(careerOfferings, {
      fields: [offeringWeights.offeringId],
      references: [careerOfferings.id],
    }),
  })
);

export const offeringCutoffsRelations = relations(
  offeringCutoffs,
  ({ one }) => ({
    offering: one(careerOfferings, {
      fields: [offeringCutoffs.offeringId],
      references: [careerOfferings.id],
    }),
  })
);

export const studentGoalsRelations = relations(
  studentGoals,
  ({ one, many }) => ({
    user: one(users, {
      fields: [studentGoals.userId],
      references: [users.id],
    }),
    offering: one(careerOfferings, {
      fields: [studentGoals.offeringId],
      references: [careerOfferings.id],
    }),
    scores: many(studentGoalScores),
    buffer: many(studentGoalBuffers),
  })
);

export const studentGoalScoresRelations = relations(
  studentGoalScores,
  ({ one }) => ({
    goal: one(studentGoals, {
      fields: [studentGoalScores.goalId],
      references: [studentGoals.id],
    }),
  })
);

export const studentGoalBuffersRelations = relations(
  studentGoalBuffers,
  ({ one }) => ({
    goal: one(studentGoals, {
      fields: [studentGoalBuffers.goalId],
      references: [studentGoals.id],
    }),
  })
);

export const studentPlanningProfilesRelations = relations(
  studentPlanningProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [studentPlanningProfiles.userId],
      references: [users.id],
    }),
  })
);

export const studentWeeklyMissionsRelations = relations(
  studentWeeklyMissions,
  ({ one }) => ({
    user: one(users, {
      fields: [studentWeeklyMissions.userId],
      references: [users.id],
    }),
  })
);

export const studentStudySprintsRelations = relations(
  studentStudySprints,
  ({ one, many }) => ({
    user: one(users, {
      fields: [studentStudySprints.userId],
      references: [users.id],
    }),
    items: many(studentStudySprintItems),
    responses: many(studentStudySprintResponses),
  })
);

export const studentStudySprintItemsRelations = relations(
  studentStudySprintItems,
  ({ one, many }) => ({
    sprint: one(studentStudySprints, {
      fields: [studentStudySprintItems.sprintId],
      references: [studentStudySprints.id],
    }),
    atom: one(atoms, {
      fields: [studentStudySprintItems.atomId],
      references: [atoms.id],
    }),
    question: one(questions, {
      fields: [studentStudySprintItems.questionId],
      references: [questions.id],
    }),
    responses: many(studentStudySprintResponses),
  })
);

export const studentStudySprintResponsesRelations = relations(
  studentStudySprintResponses,
  ({ one }) => ({
    sprint: one(studentStudySprints, {
      fields: [studentStudySprintResponses.sprintId],
      references: [studentStudySprints.id],
    }),
    sprintItem: one(studentStudySprintItems, {
      fields: [studentStudySprintResponses.sprintItemId],
      references: [studentStudySprintItems.id],
    }),
    user: one(users, {
      fields: [studentStudySprintResponses.userId],
      references: [users.id],
    }),
  })
);

export const studentReminderJobsRelations = relations(
  studentReminderJobs,
  ({ one }) => ({
    user: one(users, {
      fields: [studentReminderJobs.userId],
      references: [users.id],
    }),
  })
);

// ------------------------------------------------------------------------------
// ACCESS CONTROL RELATIONS
// ------------------------------------------------------------------------------

export const schoolsRelations = relations(schools, ({ many }) => ({
  accessGrants: many(accessGrants),
  users: many(users),
}));

export const accessGrantsRelations = relations(accessGrants, ({ one }) => ({
  school: one(schools, {
    fields: [accessGrants.schoolId],
    references: [schools.id],
  }),
  grantedByUser: one(users, {
    fields: [accessGrants.grantedBy],
    references: [users.id],
  }),
}));
