/**
 * Generate Example Results Data - REALISTIC MST SIMULATION
 *
 * This script simulates a real diagnostic flow:
 * 1. Gets the actual R1 + B2 questions from config
 * 2. Queries the DB for atom mappings for those questions
 * 3. Simulates a student answering 13/16 correctly
 * 4. Computes atomResults from those specific answers
 * 5. Runs the real learning routes algorithm
 *
 * This ensures the example shows what a REAL student would see.
 *
 * Usage: DATABASE_URL="..." npx tsx scripts/generateExampleData.ts
 */

import { db } from "@/db";
import { questionAtoms } from "@/db/schema";
import { inArray } from "drizzle-orm";
import {
  MST_QUESTIONS,
  buildQuestionId,
  getRoute,
  getLevel,
  type Route,
} from "@/lib/diagnostic/config";
import {
  analyzeLearningPotential,
  formatRouteForDisplay,
  calculatePAESImprovement,
  DEFAULT_SCORING_CONFIG,
} from "@/lib/diagnostic/questionUnlock";
import { calculateScoreRange } from "@/lib/diagnostic/scoringConstants";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURATION: Example Student Profile
// ============================================================================

/**
 * Target scenario: Good performer on Route B
 *
 * Route B = 4-6 correct in R1 (Stage 1)
 * We'll simulate: 5 correct in R1, 8 correct in B2 = 13 total
 *
 * This gives:
 * - route = "B" (from getRoute(5))
 * - totalCorrect = 13
 * - tier = "high" (11-13 range)
 * - PAES ~650 (range 620-680)
 */
const EXAMPLE_CONFIG = {
  r1Correct: 5, // Stage 1: 5/8 correct → Route B
  b2Correct: 8, // Stage 2: 8/8 correct
  get totalCorrect() {
    return this.r1Correct + this.b2Correct;
  },
  targetScore: 650,
};

// ============================================================================
// HELPER: Get question IDs for MST questions
// ============================================================================

function getMSTQuestionIds(): { r1: string[]; b2: string[] } {
  const r1 = MST_QUESTIONS.R1.map((q) =>
    buildQuestionId(q.exam, q.questionNumber)
  );
  const b2 = MST_QUESTIONS.B2.map((q) =>
    buildQuestionId(q.exam, q.questionNumber)
  );
  return { r1, b2 };
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateExampleData() {
  console.log("🎯 Simulating realistic MST diagnostic flow...\n");

  // Step 1: Get the actual R1 + B2 question IDs
  const { r1, b2 } = getMSTQuestionIds();
  const allQuestionIds = [...r1, ...b2];

  console.log(`📋 MST Questions:`);
  console.log(`   R1 (Stage 1): ${r1.length} questions`);
  console.log(`   B2 (Stage 2): ${b2.length} questions`);
  console.log(`   Total: ${allQuestionIds.length} questions\n`);

  // Verify route calculation
  const route = getRoute(EXAMPLE_CONFIG.r1Correct);
  console.log(`🛤️  Route calculation:`);
  console.log(`   R1 correct: ${EXAMPLE_CONFIG.r1Correct}/8 → Route ${route}`);
  if (route !== "B") {
    console.error(`❌ Expected Route B, got Route ${route}. Adjust r1Correct.`);
    process.exit(1);
  }

  // Step 2: Query atom mappings from DB
  console.log(`\n🔍 Loading atom mappings from database...`);
  const atomMappings = await db
    .select({
      questionId: questionAtoms.questionId,
      atomId: questionAtoms.atomId,
      relevance: questionAtoms.relevance,
    })
    .from(questionAtoms)
    .where(inArray(questionAtoms.questionId, allQuestionIds));

  console.log(
    `   Found ${atomMappings.length} atom mappings for MST questions`
  );

  // Group atoms by question
  const atomsByQuestion = new Map<
    string,
    Array<{ atomId: string; relevance: string }>
  >();
  for (const mapping of atomMappings) {
    if (!atomsByQuestion.has(mapping.questionId)) {
      atomsByQuestion.set(mapping.questionId, []);
    }
    atomsByQuestion.get(mapping.questionId)!.push({
      atomId: mapping.atomId,
      relevance: mapping.relevance,
    });
  }

  // Step 3: Simulate student answers
  console.log(`\n📝 Simulating student answers:`);
  console.log(`   R1: ${EXAMPLE_CONFIG.r1Correct}/8 correct`);
  console.log(`   B2: ${EXAMPLE_CONFIG.b2Correct}/8 correct`);
  console.log(`   Total: ${EXAMPLE_CONFIG.totalCorrect}/16 correct`);

  // Simulate which questions are answered correctly
  // For R1: first r1Correct questions are correct
  // For B2: first b2Correct questions are correct
  const correctR1 = r1.slice(0, EXAMPLE_CONFIG.r1Correct);
  const incorrectR1 = r1.slice(EXAMPLE_CONFIG.r1Correct);
  const correctB2 = b2.slice(0, EXAMPLE_CONFIG.b2Correct);
  const incorrectB2 = b2.slice(EXAMPLE_CONFIG.b2Correct);

  const correctQuestionIds = new Set([...correctR1, ...correctB2]);
  const incorrectQuestionIds = new Set([...incorrectR1, ...incorrectB2]);

  // Step 4: Compute atomResults (same logic as computeAtomMastery)
  console.log(`\n🧮 Computing atom mastery from answers...`);
  const atomMap = new Map<string, boolean>();

  for (const [questionId, atoms] of atomsByQuestion) {
    const isCorrect = correctQuestionIds.has(questionId);

    for (const atom of atoms) {
      const current = atomMap.get(atom.atomId);

      if (current === undefined) {
        atomMap.set(atom.atomId, isCorrect);
      } else if (isCorrect && !current) {
        atomMap.set(atom.atomId, true);
      }
    }
  }

  const atomResults = Array.from(atomMap.entries()).map(
    ([atomId, mastered]) => ({
      atomId,
      mastered,
    })
  );

  const masteredCount = atomResults.filter((a) => a.mastered).length;
  console.log(`   Atoms from MST questions: ${atomResults.length}`);
  console.log(`   Mastered (from correct answers): ${masteredCount}`);
  console.log(
    `   Not mastered (from wrong/untested): ${atomResults.length - masteredCount}`
  );

  // Step 5: Run the real learning routes algorithm
  console.log(`\n🧮 Running learning routes algorithm...`);
  const analysis = await analyzeLearningPotential(atomResults, {
    currentPaesScore: EXAMPLE_CONFIG.targetScore,
  });

  const numTests = DEFAULT_SCORING_CONFIG.numOfficialTests;
  const topRoutes = analysis.routes.slice(0, 4);

  // Calculate total questions that could be unlocked
  const totalPotentialUnlocks = topRoutes.reduce(
    (sum, r) => sum + r.totalQuestionsUnlocked,
    0
  );

  // Format routes for frontend display
  const formattedRoutes = topRoutes.map((route) => ({
    ...formatRouteForDisplay(route),
    axis: route.axis,
    atoms: route.atoms.map((a) => ({
      id: a.atomId,
      title: a.title,
      questionsUnlocked: Math.round(a.questionsUnlockedHere / numTests),
      isPrerequisite: a.isPrerequisite,
    })),
  }));

  // Calculate improvement
  const improvement = calculatePAESImprovement(
    EXAMPLE_CONFIG.targetScore,
    totalPotentialUnlocks,
    numTests
  );

  // Build the final data structure
  const exampleRoutesData = {
    summary: analysis.summary,
    masteryByAxis: analysis.masteryByAxis,
    routes: formattedRoutes,
    quickWins: analysis.topAtomsByEfficiency
      .filter((a) => a.immediateUnlocks.length > 0 && a.totalCost === 1)
      .slice(0, 5)
      .map((a) => ({
        atomId: a.atomId,
        title: a.axis,
        axis: a.axis,
        questionsUnlocked: Math.round(a.immediateUnlocks.length / numTests),
      })),
    improvement,
    lowHangingFruit: {
      oneAway: Math.round(
        analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 1).length /
          numTests
      ),
      twoAway: Math.round(
        analysis.lowHangingFruit.filter((q) => q.atomsToUnlock === 2).length /
          numTests
      ),
    },
  };

  console.log(`\n📈 Generated routes:`);
  for (const route of formattedRoutes) {
    console.log(
      `   - ${route.axis}: +${route.pointsGain} pts, ${route.questionsUnlocked} questions`
    );
  }
  console.log(
    `\n💡 Low hanging fruit: ${exampleRoutesData.lowHangingFruit.oneAway} questions 1 atom away`
  );

  // Build next concepts from the recommended route
  const recommendedRoute = formattedRoutes[0];
  const nextConcepts = recommendedRoute
    ? recommendedRoute.atoms
        .filter((a) => a.questionsUnlocked > 0 && !a.isPrerequisite)
        .slice(0, 3)
        .map((a, i) => ({
          atomId: a.id,
          title: a.title,
          reasonKey: "wrong_answer" as const,
          unlocksQuestionsCount: a.questionsUnlocked,
          evidence: {
            source: "direct" as const,
            mastered: false as const,
            // Use actual wrong answer question IDs
            questionId: Array.from(incorrectQuestionIds)[i] || "unknown",
          },
        }))
    : [];

  // Calculate axis performance based on which questions were correct
  const axisPerformance = {
    ALG: { correct: 0, total: 0 },
    NUM: { correct: 0, total: 0 },
    GEO: { correct: 0, total: 0 },
    PROB: { correct: 0, total: 0 },
  };

  // Count from R1
  for (const q of MST_QUESTIONS.R1) {
    const qId = buildQuestionId(q.exam, q.questionNumber);
    axisPerformance[q.axis].total++;
    if (correctQuestionIds.has(qId)) {
      axisPerformance[q.axis].correct++;
    }
  }
  // Count from B2
  for (const q of MST_QUESTIONS.B2) {
    const qId = buildQuestionId(q.exam, q.questionNumber);
    axisPerformance[q.axis].total++;
    if (correctQuestionIds.has(qId)) {
      axisPerformance[q.axis].correct++;
    }
  }

  // Add percentages
  const axisPerformanceWithPercentage = {
    ALG: {
      ...axisPerformance.ALG,
      percentage: Math.round(
        (axisPerformance.ALG.correct / axisPerformance.ALG.total) * 100
      ),
    },
    NUM: {
      ...axisPerformance.NUM,
      percentage: Math.round(
        (axisPerformance.NUM.correct / axisPerformance.NUM.total) * 100
      ),
    },
    GEO: {
      ...axisPerformance.GEO,
      percentage: Math.round(
        (axisPerformance.GEO.correct / axisPerformance.GEO.total) * 100
      ),
    },
    PROB: {
      ...axisPerformance.PROB,
      percentage: Math.round(
        (axisPerformance.PROB.correct / axisPerformance.PROB.total) * 100
      ),
    },
  };

  console.log(`\n📊 Axis performance (from simulated answers):`);
  for (const [axis, perf] of Object.entries(axisPerformanceWithPercentage)) {
    console.log(
      `   ${axis}: ${perf.correct}/${perf.total} (${perf.percentage}%)`
    );
  }

  // Calculate score range using REAL formula (±5 questions via PAES table)
  const scoreRange = calculateScoreRange(EXAMPLE_CONFIG.targetScore);
  const level = getLevel(EXAMPLE_CONFIG.targetScore);

  console.log(`\n📈 Score calculation (using real PAES table):`);
  console.log(`   Target score: ${EXAMPLE_CONFIG.targetScore}`);
  console.log(`   Range (±5 questions): ${scoreRange.min}-${scoreRange.max}`);
  console.log(`   Level: ${level}`);

  // Generate the output file
  const outputPath = path.resolve(
    process.cwd(),
    "app/diagnostico/data/exampleResultsData.ts"
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileContent = `/**
 * Pre-computed Example Results Data - REALISTIC MST SIMULATION
 *
 * This data was generated by simulating a real diagnostic flow:
 * 1. R1 (Stage 1): ${EXAMPLE_CONFIG.r1Correct}/8 correct → Route B
 * 2. B2 (Stage 2): ${EXAMPLE_CONFIG.b2Correct}/8 correct
 * 3. Total: ${EXAMPLE_CONFIG.totalCorrect}/16 correct
 *
 * Atom mastery computed from the SPECIFIC atoms tested by R1+B2 questions.
 * Routes calculated using the real learning algorithm.
 *
 * Generated: ${new Date().toISOString()}
 *
 * To regenerate: DATABASE_URL="..." npx tsx scripts/generateExampleData.ts
 */

import type { LearningRoutesResponse } from "../hooks/useLearningRoutes";
import type { Axis } from "@/lib/diagnostic/config";
import type { AxisPerformance } from "../components/ResultsComponents";
import type { NextConcept } from "@/lib/config";

// ============================================================================
// EXAMPLE STUDENT PROFILE
// ============================================================================

/**
 * Simulated diagnostic flow:
 * - R1: ${EXAMPLE_CONFIG.r1Correct}/8 correct → Route B
 * - B2: ${EXAMPLE_CONFIG.b2Correct}/8 correct
 * - Total: ${EXAMPLE_CONFIG.totalCorrect}/16 (tier "high")
 */
export const EXAMPLE_TOTAL_CORRECT = ${EXAMPLE_CONFIG.totalCorrect};

/** Example results - axis performance from simulated answers */
export const EXAMPLE_RESULTS: {
  paesMin: number;
  paesMax: number;
  level: string;
  axisPerformance: Record<Axis, AxisPerformance>;
} = {
  paesMin: ${scoreRange.min},
  paesMax: ${scoreRange.max},
  level: "${level}",
  axisPerformance: ${JSON.stringify(axisPerformanceWithPercentage, null, 4).replace(/\n/g, "\n  ")},
};

// ============================================================================
// PRE-COMPUTED NEXT CONCEPTS (from recommended route)
// ============================================================================

export const EXAMPLE_NEXT_CONCEPTS: NextConcept[] = ${JSON.stringify(nextConcepts, null, 2)};

// ============================================================================
// PRE-COMPUTED ROUTES DATA (from real algorithm with simulated atomResults)
// ============================================================================

export const EXAMPLE_ROUTES_DATA: LearningRoutesResponse = ${JSON.stringify(exampleRoutesData, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent);
  console.log(`\n✅ Generated: ${outputPath}`);
  console.log(
    `\n🎯 This example now simulates EXACTLY what a real student would see!`
  );

  process.exit(0);
}

// Run the generator
generateExampleData().catch((error) => {
  console.error("❌ Error generating example data:", error);
  process.exit(1);
});
