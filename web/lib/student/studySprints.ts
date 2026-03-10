import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  atomMastery,
  atoms,
  questionAtoms,
  questions,
  studentStudySprintItems,
  studentStudySprintResponses,
  studentStudySprints,
  users,
} from "@/db/schema";
import { parseQtiXml } from "@/lib/diagnostic/qtiParser";
import { analyzeLearningPotential } from "@/lib/diagnostic/questionUnlock";
import {
  getOrCreateCurrentMission,
  incrementMissionProgress,
} from "@/lib/student/missions";
import { getDailyStreak } from "@/lib/student/streakTracker";
import type {
  StudySprintCreatePayload,
  StudySprintItemPayload,
  StudySprintPayload,
} from "./studySprint.types";

const DEFAULT_SPRINT_ITEMS = 5;

type CandidateAtom = {
  atomId: string;
  title: string;
  axis: string;
};

function normalizeAnswer(value: string): string {
  return value.trim().toUpperCase();
}
async function getUserSnapshot(userId: string) {
  const [row] = await db
    .select({
      paesScoreMin: users.paesScoreMin,
      paesScoreMax: users.paesScoreMax,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.paesScoreMin === null || row.paesScoreMax === null) {
    return null;
  }
  return {
    score: Math.round((row.paesScoreMin + row.paesScoreMax) / 2),
  };
}
async function getMasteryRows(userId: string) {
  return db
    .select({ atomId: atomMastery.atomId, isMastered: atomMastery.isMastered })
    .from(atomMastery)
    .where(eq(atomMastery.userId, userId));
}
async function getTopAtomsForStudySprint(
  userId: string,
  limit = DEFAULT_SPRINT_ITEMS
): Promise<CandidateAtom[]> {
  const [snapshot, masteryRows] = await Promise.all([
    getUserSnapshot(userId),
    getMasteryRows(userId),
  ]);
  if (!snapshot) {
    throw new Error("Diagnostic snapshot is required before starting a sprint");
  }
  if (masteryRows.length === 0) {
    throw new Error("Mastery signals are required before starting a sprint");
  }
  const analysis = await analyzeLearningPotential(
    masteryRows.map((row) => ({
      atomId: row.atomId,
      mastered: row.isMastered,
    })),
    { currentPaesScore: snapshot.score }
  );
  const sorted = [...analysis.topAtomsByEfficiency].sort((a, b) => {
    if (b.efficiency !== a.efficiency) {
      return b.efficiency - a.efficiency;
    }
    if (b.unlockScore !== a.unlockScore) {
      return b.unlockScore - a.unlockScore;
    }
    if (a.totalCost !== b.totalCost) {
      return a.totalCost - b.totalCost;
    }
    return a.atomId.localeCompare(b.atomId);
  });
  return sorted.slice(0, limit).map((atom) => ({
    atomId: atom.atomId,
    title: atom.title,
    axis: atom.axis,
  }));
}
async function pickQuestionForAtom(
  atomId: string,
  userId: string
): Promise<{ questionId: string; qtiXml: string } | null> {
  const rows = await db
    .select({
      questionId: questions.id,
      qtiXml: questions.qtiXml,
    })
    .from(questionAtoms)
    .innerJoin(questions, eq(questions.id, questionAtoms.questionId))
    .leftJoin(
      studentStudySprintItems,
      eq(studentStudySprintItems.questionId, questions.id)
    )
    .leftJoin(
      studentStudySprints,
      eq(studentStudySprints.id, studentStudySprintItems.sprintId)
    )
    .where(
      and(eq(questionAtoms.atomId, atomId), eq(questions.source, "official"))
    )
    .orderBy(desc(questions.createdAt))
    .limit(20);
  if (rows.length === 0) {
    return null;
  }
  const usedByUser = new Set<string>();
  for (const row of rows) {
    if (row.questionId && row.qtiXml) {
      const linkedSprintRows = await db
        .select({ id: studentStudySprints.id })
        .from(studentStudySprints)
        .innerJoin(
          studentStudySprintItems,
          eq(studentStudySprintItems.sprintId, studentStudySprints.id)
        )
        .where(
          and(
            eq(studentStudySprints.userId, userId),
            eq(studentStudySprintItems.questionId, row.questionId)
          )
        )
        .limit(1);
      if (linkedSprintRows.length > 0) {
        usedByUser.add(row.questionId);
      }
    }
  }
  const fresh = rows.find((row) => !usedByUser.has(row.questionId));
  if (fresh) {
    return { questionId: fresh.questionId, qtiXml: fresh.qtiXml };
  }
  const fallback = rows[0];
  return { questionId: fallback.questionId, qtiXml: fallback.qtiXml };
}
async function buildSprintQuestions(userId: string, itemCount: number) {
  const candidateAtoms = await getTopAtomsForStudySprint(userId, itemCount + 5);
  const selected: {
    atomId: string;
    atomTitle: string;
    questionId: string;
  }[] = [];
  for (const atom of candidateAtoms) {
    if (selected.length >= itemCount) {
      break;
    }
    const question = await pickQuestionForAtom(atom.atomId, userId);
    if (!question) {
      continue;
    }
    const duplicate = selected.some(
      (item) => item.questionId === question.questionId
    );
    if (duplicate) {
      continue;
    }
    selected.push({
      atomId: atom.atomId,
      atomTitle: atom.title,
      questionId: question.questionId,
    });
  }
  return selected;
}
async function getSprintOwnership(sprintId: string, userId: string) {
  const rows = await db
    .select({
      id: studentStudySprints.id,
      status: studentStudySprints.status,
      estimatedMinutes: studentStudySprints.estimatedMinutes,
    })
    .from(studentStudySprints)
    .where(
      and(
        eq(studentStudySprints.id, sprintId),
        eq(studentStudySprints.userId, userId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}
export async function createStudySprintForUser(
  userId: string,
  itemCount = DEFAULT_SPRINT_ITEMS
): Promise<StudySprintCreatePayload> {
  const [existingSprint] = await db
    .select({ id: studentStudySprints.id })
    .from(studentStudySprints)
    .where(eq(studentStudySprints.userId, userId))
    .limit(1);
  const hasAnyPriorSprint = Boolean(existingSprint);

  const [existingInProgress] = await db
    .select({
      id: studentStudySprints.id,
      estimatedMinutes: studentStudySprints.estimatedMinutes,
    })
    .from(studentStudySprints)
    .where(
      and(
        eq(studentStudySprints.userId, userId),
        eq(studentStudySprints.status, "in_progress")
      )
    )
    .orderBy(desc(studentStudySprints.startedAt))
    .limit(1);
  if (existingInProgress) {
    const [itemCountRow] = await db
      .select({
        totalItems: sql<number>`count(*)`,
      })
      .from(studentStudySprintItems)
      .where(eq(studentStudySprintItems.sprintId, existingInProgress.id));
    const totalItems = Number(itemCountRow?.totalItems ?? 0);
    if (totalItems > 0) {
      return {
        sprintId: existingInProgress.id,
        estimatedMinutes: existingInProgress.estimatedMinutes,
        itemCount: totalItems,
        isFirstSprintStarted: false,
      };
    }
  }
  const selected = await buildSprintQuestions(userId, itemCount);
  if (selected.length === 0) {
    throw new Error("No sprint items available for this student");
  }
  const estimatedMinutes = Math.max(10, selected.length * 5);
  const [sprint] = await db
    .insert(studentStudySprints)
    .values({
      userId,
      status: "in_progress",
      estimatedMinutes,
      source: "next_action",
      updatedAt: new Date(),
    })
    .returning({ id: studentStudySprints.id });
  await db.insert(studentStudySprintItems).values(
    selected.map((item, index) => ({
      sprintId: sprint.id,
      position: index + 1,
      atomId: item.atomId,
      questionId: item.questionId,
      promptLabel: item.atomTitle,
    }))
  );
  return {
    sprintId: sprint.id,
    estimatedMinutes,
    itemCount: selected.length,
    isFirstSprintStarted: !hasAnyPriorSprint,
  };
}
export async function getStudySprint(
  userId: string,
  sprintId: string
): Promise<StudySprintPayload | null> {
  const sprint = await getSprintOwnership(sprintId, userId);
  if (!sprint) {
    return null;
  }
  const rows = await db
    .select({
      itemId: studentStudySprintItems.id,
      position: studentStudySprintItems.position,
      atomId: studentStudySprintItems.atomId,
      atomTitle: atoms.title,
      questionId: questions.id,
      qtiXml: questions.qtiXml,
      selectedAnswer: studentStudySprintResponses.selectedAnswer,
      isCorrect: studentStudySprintResponses.isCorrect,
    })
    .from(studentStudySprintItems)
    .innerJoin(questions, eq(questions.id, studentStudySprintItems.questionId))
    .innerJoin(atoms, eq(atoms.id, studentStudySprintItems.atomId))
    .leftJoin(
      studentStudySprintResponses,
      and(
        eq(
          studentStudySprintResponses.sprintItemId,
          studentStudySprintItems.id
        ),
        eq(studentStudySprintResponses.userId, userId)
      )
    )
    .where(eq(studentStudySprintItems.sprintId, sprintId))
    .orderBy(asc(studentStudySprintItems.position));
  const items: StudySprintItemPayload[] = rows.map((row) => {
    const parsed = parseQtiXml(row.qtiXml);
    return {
      itemId: row.itemId,
      position: row.position,
      atomId: row.atomId,
      atomTitle: row.atomTitle,
      questionId: row.questionId,
      questionHtml: parsed.html,
      options: parsed.options,
      selectedAnswer: row.selectedAnswer,
      isCorrect: row.isCorrect,
    };
  });
  const answered = items.filter((item) => item.selectedAnswer !== null).length;
  return {
    sprintId,
    status: sprint.status,
    estimatedMinutes: sprint.estimatedMinutes,
    progress: {
      answered,
      total: items.length,
      remaining: Math.max(0, items.length - answered),
    },
    items,
  };
}
export async function submitStudySprintAnswer(params: {
  userId: string;
  sprintId: string;
  sprintItemId: string;
  selectedAnswer: string;
  responseTimeSeconds?: number;
}) {
  const sprint = await getSprintOwnership(params.sprintId, params.userId);
  if (!sprint) {
    throw new Error("Sprint not found");
  }
  if (sprint.status !== "in_progress") {
    throw new Error("Sprint is no longer accepting answers");
  }
  const itemRows = await db
    .select({
      itemId: studentStudySprintItems.id,
      questionId: questions.id,
      qtiXml: questions.qtiXml,
    })
    .from(studentStudySprintItems)
    .innerJoin(questions, eq(questions.id, studentStudySprintItems.questionId))
    .where(
      and(
        eq(studentStudySprintItems.id, params.sprintItemId),
        eq(studentStudySprintItems.sprintId, params.sprintId)
      )
    )
    .limit(1);
  const item = itemRows[0];
  if (!item) {
    throw new Error("Sprint item not found");
  }
  const parsed = parseQtiXml(item.qtiXml);
  const correctAnswer = parsed.correctAnswer
    ? normalizeAnswer(parsed.correctAnswer)
    : null;
  if (!correctAnswer) {
    throw new Error("Question does not include a valid correct answer");
  }
  const normalizedAnswer = normalizeAnswer(params.selectedAnswer);
  const isCorrect = normalizedAnswer === correctAnswer;
  const existing = await db
    .select({ id: studentStudySprintResponses.id })
    .from(studentStudySprintResponses)
    .where(
      and(
        eq(studentStudySprintResponses.sprintItemId, params.sprintItemId),
        eq(studentStudySprintResponses.userId, params.userId)
      )
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(studentStudySprintResponses)
      .set({
        selectedAnswer: normalizedAnswer,
        isCorrect,
        responseTimeSeconds: params.responseTimeSeconds,
        answeredAt: new Date(),
      })
      .where(eq(studentStudySprintResponses.id, existing[0].id));
  } else {
    await db.insert(studentStudySprintResponses).values({
      sprintId: params.sprintId,
      sprintItemId: params.sprintItemId,
      userId: params.userId,
      selectedAnswer: normalizedAnswer,
      isCorrect,
      responseTimeSeconds: params.responseTimeSeconds,
    });
  }
  const sprintPayload = await getStudySprint(params.userId, params.sprintId);
  return {
    sprintItemId: params.sprintItemId,
    selectedAnswer: normalizedAnswer,
    correctAnswer,
    isCorrect,
    progress: sprintPayload?.progress ?? null,
  };
}
export async function completeStudySprint(userId: string, sprintId: string) {
  const sprint = await getSprintOwnership(sprintId, userId);
  if (!sprint) {
    throw new Error("Sprint not found");
  }
  if (sprint.status === "completed") {
    const [mission, streak] = await Promise.all([
      getOrCreateCurrentMission(userId),
      getDailyStreak(userId),
    ]);
    return {
      sprintId,
      status: "completed",
      mission,
      streak,
      alreadyCompleted: true,
    };
  }
  const [counts] = await db
    .select({
      totalItems: sql<number>`count(*)`,
    })
    .from(studentStudySprintItems)
    .where(eq(studentStudySprintItems.sprintId, sprintId));
  const [answered] = await db
    .select({
      answeredItems: sql<number>`count(*)`,
    })
    .from(studentStudySprintResponses)
    .where(
      and(
        eq(studentStudySprintResponses.sprintId, sprintId),
        eq(studentStudySprintResponses.userId, userId)
      )
    );
  const totalItems = Number(counts?.totalItems ?? 0);
  const answeredItems = Number(answered?.answeredItems ?? 0);
  if (totalItems === 0 || answeredItems < totalItems) {
    throw new Error("Sprint cannot be completed before all items are answered");
  }
  const markedCompleted = await db
    .update(studentStudySprints)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(studentStudySprints.id, sprintId),
        eq(studentStudySprints.status, "in_progress")
      )
    )
    .returning({ id: studentStudySprints.id });
  if (markedCompleted.length === 0) {
    const [mission, streak] = await Promise.all([
      getOrCreateCurrentMission(userId),
      getDailyStreak(userId),
    ]);
    return {
      sprintId,
      status: "completed",
      mission,
      streak,
      alreadyCompleted: true,
    };
  }
  const [mission, streak] = await Promise.all([
    incrementMissionProgress(userId),
    getDailyStreak(userId),
  ]);
  return {
    sprintId,
    status: "completed",
    mission,
    streak,
    alreadyCompleted: false,
  };
}
