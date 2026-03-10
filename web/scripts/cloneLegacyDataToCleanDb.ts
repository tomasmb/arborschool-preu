import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";

type AnyRecord = Record<string, unknown>;

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;

if (!SOURCE_DATABASE_URL || !TARGET_DATABASE_URL) {
  throw new Error(
    "Missing SOURCE_DATABASE_URL or TARGET_DATABASE_URL environment variables"
  );
}

const sourceClient = postgres(SOURCE_DATABASE_URL, { max: 1 });
const targetClient = postgres(TARGET_DATABASE_URL, { max: 1 });

const sourceDb = drizzle(sourceClient, { schema });
const targetDb = drizzle(targetClient, { schema });

const CHUNK_SIZE = 500;

async function insertInChunks(table: any, rows: AnyRecord[], label: string) {
  if (rows.length === 0) {
    console.log(`[clone] ${label}: 0 rows`);
    return;
  }

  for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
    const chunk = rows.slice(index, index + CHUNK_SIZE);
    await targetDb.insert(table).values(chunk);
  }

  console.log(`[clone] ${label}: ${rows.length} rows`);
}

async function clearTargetData() {
  // Child -> parent delete order to satisfy FKs.
  await targetDb.delete(schema.studentResponses);
  await targetDb.delete(schema.atomMastery);
  await targetDb.delete(schema.testQuestions);
  await targetDb.delete(schema.questionAtoms);
  await targetDb.delete(schema.generatedQuestions);
  await targetDb.delete(schema.lessons);
  await targetDb.delete(schema.testAttempts);
  await targetDb.delete(schema.studentGoalScores);
  await targetDb.delete(schema.studentGoalBuffers);
  await targetDb.delete(schema.studentGoals);
  await targetDb.delete(schema.offeringWeights);
  await targetDb.delete(schema.offeringCutoffs);
  await targetDb.delete(schema.careerOfferings);
  await targetDb.delete(schema.careers);
  await targetDb.delete(schema.universities);
  await targetDb.delete(schema.admissionsDatasets);
  await targetDb.delete(schema.questions);
  await targetDb.delete(schema.tests);
  await targetDb.delete(schema.atoms);
  await targetDb.delete(schema.standards);
  await targetDb.delete(schema.subjects);
  await targetDb.delete(schema.users);
}

async function run() {
  console.log("[clone] clearing target DB data...");
  await clearTargetData();

  const subjects = await sourceDb.select().from(schema.subjects);
  await insertInChunks(schema.subjects, subjects, "subjects");

  const standards = await sourceDb.select().from(schema.standards);
  await insertInChunks(schema.standards, standards, "standards");

  const atoms = await sourceDb.select().from(schema.atoms);
  await insertInChunks(schema.atoms, atoms, "atoms");

  const questions = await sourceDb.select().from(schema.questions);
  await insertInChunks(schema.questions, questions, "questions");

  const tests = await sourceDb.select().from(schema.tests);
  await insertInChunks(schema.tests, tests, "tests");

  const lessons = await sourceDb.select().from(schema.lessons);
  await insertInChunks(schema.lessons, lessons, "lessons");

  const generatedQuestions = await sourceDb
    .select()
    .from(schema.generatedQuestions);
  await insertInChunks(
    schema.generatedQuestions,
    generatedQuestions,
    "generated_questions"
  );

  const questionAtoms = await sourceDb.select().from(schema.questionAtoms);
  await insertInChunks(schema.questionAtoms, questionAtoms, "question_atoms");

  const testQuestions = await sourceDb.select().from(schema.testQuestions);
  await insertInChunks(schema.testQuestions, testQuestions, "test_questions");

  // Source DB is legacy and may not include latest columns (e.g. followup_email_scheduled_at).
  const users = await sourceDb
    .select({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      subscriptionStatus: schema.users.subscriptionStatus,
      subscriptionExpiresAt: schema.users.subscriptionExpiresAt,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      unsubscribed: schema.users.unsubscribed,
      unsubscribedAt: schema.users.unsubscribedAt,
      paesScoreMin: schema.users.paesScoreMin,
      paesScoreMax: schema.users.paesScoreMax,
      performanceTier: schema.users.performanceTier,
      topRouteName: schema.users.topRouteName,
      topRouteQuestionsUnlocked: schema.users.topRouteQuestionsUnlocked,
      topRoutePointsGain: schema.users.topRoutePointsGain,
      userType: schema.users.userType,
      curso: schema.users.curso,
      paesGoal: schema.users.paesGoal,
      paesDate: schema.users.paesDate,
      inPreu: schema.users.inPreu,
      schoolType: schema.users.schoolType,
      notifiedPlatformLaunch: schema.users.notifiedPlatformLaunch,
      notifiedPlatformLaunchAt: schema.users.notifiedPlatformLaunchAt,
    })
    .from(schema.users);
  await insertInChunks(schema.users, users, "users");

  const testAttempts = await sourceDb.select().from(schema.testAttempts);
  await insertInChunks(schema.testAttempts, testAttempts, "test_attempts");

  const studentResponses = await sourceDb
    .select()
    .from(schema.studentResponses);
  await insertInChunks(
    schema.studentResponses,
    studentResponses,
    "student_responses"
  );

  const atomMastery = await sourceDb.select().from(schema.atomMastery);
  await insertInChunks(schema.atomMastery, atomMastery, "atom_mastery");

  console.log("[clone] complete");
}

run()
  .catch((error) => {
    console.error("[clone] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sourceClient.end();
    await targetClient.end();
  });
