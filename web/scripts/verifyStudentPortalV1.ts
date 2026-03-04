import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atoms,
  studentGoalScores,
  studentGoals,
  users,
} from "@/db/schema";
import { resolvePostLoginRedirect } from "@/lib/auth/postLoginRedirect";
import { getM1Dashboard } from "@/lib/student/dashboardM1";
import {
  getStudentGoalsView,
  saveStudentGoalsView,
  type StudentGoalInput,
} from "@/lib/student/goals";
import {
  runGoalSimulator,
  getStudentGoalSimulation,
} from "@/lib/student/simulator";

type PerfStat = {
  p95: number;
  avg: number;
  max: number;
  min: number;
};

type CreatedUser = {
  id: string;
  email: string;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function nowMs(): number {
  return Number(process.hrtime.bigint() / BigInt(1_000_000));
}

function computePerfStats(samplesMs: number[]): PerfStat {
  assert(samplesMs.length > 0, "No performance samples");
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    p95: sorted[p95Index],
    avg: Math.round((total / sorted.length) * 100) / 100,
    max: sorted[sorted.length - 1],
    min: sorted[0],
  };
}

async function createTempUser(
  hasDiagnosticSnapshot: boolean
): Promise<CreatedUser> {
  const email = `portal-v1-check-${Date.now()}-${Math.random().toString(16).slice(2)}@arbor.local`;
  const [created] = await db
    .insert(users)
    .values({
      email,
      role: "student",
      paesScoreMin: hasDiagnosticSnapshot ? 620 : null,
      paesScoreMax: hasDiagnosticSnapshot ? 700 : null,
    })
    .returning({ id: users.id, email: users.email });

  assert(created, "Failed to create verification user");
  return created;
}

async function cleanupUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

async function seedMastery(userId: string, count = 30): Promise<void> {
  const atomRows = await db.select({ id: atoms.id }).from(atoms).limit(count);
  assert(atomRows.length > 0, "No atoms available to seed mastery");

  await db.insert(atomMastery).values(
    atomRows.map((row, index) => {
      const status: "mastered" | "in_progress" =
        index % 3 === 0 ? "mastered" : "in_progress";
      return {
        userId,
        atomId: row.id,
        isMastered: index % 3 === 0,
        status,
        masterySource: "diagnostic" as const,
        totalAttempts: 1,
        correctAttempts: index % 3 === 0 ? 1 : 0,
      };
    })
  );
}

function verifyUnitSimulatorMath(): void {
  const simulation = runGoalSimulator({
    goal: {
      id: "g-1",
      offeringId: "off-1",
      buffer: { points: 30 },
      scores: [
        { testCode: "M1", score: 700, source: "student" },
        { testCode: "NEM", score: 780, source: "student" },
      ],
    },
    option: {
      offeringId: "off-1",
      careerName: "Ingenieria",
      universityName: "Arbor U",
      lastCutoff: 720,
      cutoffYear: 2025,
      weights: [
        { testCode: "M1", weightPercent: 60 },
        { testCode: "NEM", weightPercent: 40 },
      ],
    },
    dataset: {
      version: "test",
      source: "test",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    query: {
      scoreOverrides: {},
      bufferPointsOverride: 30,
    },
  });

  assert(simulation.formula.weightedScore === 732, "Weighted score mismatch");
  assert(simulation.targets.bufferedTarget === 750, "Buffered target mismatch");
  assert(
    simulation.admissibility.deltaVsBufferedTarget === -18,
    "Delta mismatch"
  );
  assert(
    simulation.sensitivity.adjustedWeightedScore === 738,
    "Sensitivity mismatch"
  );
  assert(
    simulation.sensitivity.weightedDelta !== null &&
      simulation.sensitivity.weightedDelta > 0,
    "Sensitivity must be monotonic for M1 +10"
  );
}

async function findCandidateOfferings(userId: string): Promise<string[]> {
  const view = await getStudentGoalsView(userId);
  const withM1 = view.options.filter((option) =>
    option.weights.some(
      (weight) => weight.testCode.trim().toUpperCase() === "M1"
    )
  );

  const selected = (withM1.length >= 3 ? withM1 : view.options).slice(0, 3);
  assert(
    selected.length >= 3,
    "Need at least 3 admissions offerings for checks"
  );
  return selected.map((option) => option.offeringId);
}

function buildGoalInput(
  offeringId: string,
  priority: number,
  m1Score: number
): StudentGoalInput {
  return {
    offeringId,
    priority,
    isPrimary: true,
    bufferPoints: 30,
    bufferSource: "student",
    scores: [{ testCode: "M1", score: m1Score, source: "student" }],
  };
}

async function verifyGoalRoundTrip(
  userId: string,
  offerings: string[]
): Promise<void> {
  const one = [buildGoalInput(offerings[0], 1, 700)];
  const two = [...one, buildGoalInput(offerings[1], 2, 710)];
  const three = [...two, buildGoalInput(offerings[2], 3, 720)];

  const savedOne = await saveStudentGoalsView(userId, one);
  assert(savedOne.goals.length === 1, "Expected 1 goal after first save");

  const savedTwo = await saveStudentGoalsView(userId, two);
  assert(savedTwo.goals.length === 2, "Expected 2 goals after second save");

  const savedThree = await saveStudentGoalsView(userId, three);
  assert(savedThree.goals.length === 3, "Expected 3 goals after third save");
  assert(savedThree.dataset !== null, "Dataset metadata must be present");
}

async function verifySimulatorPayload(userId: string): Promise<string> {
  const view = await getStudentGoalsView(userId);
  const goal = view.goals[0];
  assert(goal, "Missing saved goal for simulator checks");

  const simulation = await getStudentGoalSimulation(userId, goal.id, {
    scoreOverrides: {},
    bufferPointsOverride: 30,
  });
  assert(simulation !== null, "Simulator payload should exist");
  assert(simulation.dataset !== null, "Simulator dataset metadata missing");
  assert(
    simulation.formula.components.length > 0,
    "Simulator formula missing components"
  );
  return goal.id;
}

async function verifyDashboardCoupling(
  userId: string,
  offeringId: string
): Promise<void> {
  await saveStudentGoalsView(userId, [buildGoalInput(offeringId, 1, 700)]);
  const first = await getM1Dashboard(userId);
  assert(first.target.score === 700, "Initial dashboard target should be 700");

  await saveStudentGoalsView(userId, [buildGoalInput(offeringId, 1, 760)]);
  const second = await getM1Dashboard(userId);
  assert(second.target.score === 760, "Updated dashboard target should be 760");
}

async function benchmark(
  iterations: number,
  run: () => Promise<unknown>
): Promise<PerfStat> {
  for (let index = 0; index < 10; index += 1) {
    await run();
  }

  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = nowMs();
    await run();
    samples.push(nowMs() - start);
  }

  return computePerfStats(samples);
}

async function verifyPostLoginRedirectPolicy(): Promise<void> {
  const planningRequired = resolvePostLoginRedirect({
    journeyState: "planning_required",
  });
  const diagnosticInProgress = resolvePostLoginRedirect({
    journeyState: "diagnostic_in_progress",
  });
  const activeLearning = resolvePostLoginRedirect({
    journeyState: "active_learning",
  });

  assert(
    planningRequired === "/portal/goals?mode=planning",
    "Expected planning users to route to planning mode"
  );
  assert(
    diagnosticInProgress === "/diagnostico",
    "Expected in-progress users to route to diagnostic"
  );
  assert(
    activeLearning === "/portal",
    "Expected active users to route to portal"
  );
}

async function verifyReadyUserForPerf(): Promise<{
  userId: string;
  goalId: string;
}> {
  const rows = await db
    .select({
      userId: users.id,
      goalId: studentGoals.id,
    })
    .from(users)
    .innerJoin(studentGoals, eq(studentGoals.userId, users.id))
    .innerJoin(studentGoalScores, eq(studentGoalScores.goalId, studentGoals.id))
    .where(
      and(
        isNotNull(users.paesScoreMin),
        isNotNull(users.paesScoreMax),
        eq(studentGoalScores.testCode, "M1")
      )
    )
    .limit(1);

  if (rows[0]) {
    return { userId: rows[0].userId, goalId: rows[0].goalId };
  }

  const tempUser = await createTempUser(true);
  await seedMastery(tempUser.id);
  const offerings = await findCandidateOfferings(tempUser.id);
  await saveStudentGoalsView(tempUser.id, [
    buildGoalInput(offerings[0], 1, 710),
  ]);
  const view = await getStudentGoalsView(tempUser.id);
  assert(view.goals[0], "Missing temp goal for perf checks");
  return { userId: tempUser.id, goalId: view.goals[0].id };
}

async function main() {
  const createdUsers: string[] = [];
  try {
    verifyUnitSimulatorMath();
    await verifyPostLoginRedirectPolicy();

    const validationUser = await createTempUser(true);
    createdUsers.push(validationUser.id);
    await seedMastery(validationUser.id);

    const offerings = await findCandidateOfferings(validationUser.id);
    await verifyGoalRoundTrip(validationUser.id, offerings);
    const goalId = await verifySimulatorPayload(validationUser.id);
    await verifyDashboardCoupling(validationUser.id, offerings[0]);

    const perfTargetMs = 300;
    const perfSubject = await verifyReadyUserForPerf();
    if (!createdUsers.includes(perfSubject.userId)) {
      // Existing user was selected; no cleanup required.
    } else if (perfSubject.userId !== validationUser.id) {
      createdUsers.push(perfSubject.userId);
    }

    const dashboardPerf = await benchmark(60, async () => {
      await getM1Dashboard(perfSubject.userId);
    });
    const simulatorPerf = await benchmark(60, async () => {
      await getStudentGoalSimulation(perfSubject.userId, perfSubject.goalId, {
        scoreOverrides: {},
      });
    });

    assert(
      dashboardPerf.p95 < perfTargetMs,
      `Dashboard perf target failed: p95=${dashboardPerf.p95}ms`
    );
    assert(
      simulatorPerf.p95 < perfTargetMs,
      `Simulator perf target failed: p95=${simulatorPerf.p95}ms`
    );

    const result = {
      status: "ok",
      checks: {
        unitSimulatorMath: "pass",
        postLoginRedirect: "pass",
        goalsRoundTrip123: "pass",
        simulatorPayloadMetadata: "pass",
        dashboardGoalCoupling: "pass",
      },
      performance: {
        targetP95Ms: perfTargetMs,
        dashboard: dashboardPerf,
        simulator: simulatorPerf,
      },
      context: {
        verificationGoalId: goalId,
        verificationUserId: validationUser.id,
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    for (const userId of createdUsers) {
      await cleanupUser(userId);
    }
  }
}

main().catch((error) => {
  console.error("[verifyStudentPortalV1] failed", error);
  process.exit(1);
});
