import type { SimulatorPayload, StudentGoalsPayload } from "./types";
import {
  resolveApiErrorMessage,
  type ApiEnvelope,
} from "@/lib/student/apiClientEnvelope";

export const DEFAULT_PLANNING_PROFILE = {
  examDate: "",
  weeklyMinutesTarget: "360",
  reminderInApp: true,
  reminderEmail: true,
};

export function planningProfileToApi(draft: {
  examDate: string;
  weeklyMinutesTarget: string;
  reminderInApp: boolean;
  reminderEmail: boolean;
}) {
  const weeklyMinutesTarget = Number(draft.weeklyMinutesTarget);
  if (
    !Number.isInteger(weeklyMinutesTarget) ||
    weeklyMinutesTarget < 30 ||
    weeklyMinutesTarget > 600
  ) {
    throw new Error("Horas por semana debe estar entre 0.5 y 10");
  }

  if (draft.examDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.examDate.trim())) {
    throw new Error("La fecha PAES debe tener formato YYYY-MM-DD");
  }

  return {
    examDate: draft.examDate.trim().length > 0 ? draft.examDate.trim() : null,
    weeklyMinutesTarget,
    timezone: "America/Santiago",
    reminderInApp: draft.reminderInApp,
    reminderEmail: draft.reminderEmail,
  };
}

export async function saveGoals(params: {
  goals: unknown[];
  planningProfile: ReturnType<typeof planningProfileToApi>;
}) {
  const response = await fetch("/api/student/goals", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goals: params.goals,
      planningProfile: params.planningProfile,
    }),
  });

  const payload = (await response.json()) as ApiEnvelope<StudentGoalsPayload>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos guardar tus metas")
    );
  }

  return payload.data;
}

export async function simulateGoal(query: string): Promise<SimulatorPayload> {
  const response = await fetch(`/api/student/simulator?${query}`, {
    method: "GET",
    credentials: "include",
  });

  const payload = (await response.json()) as ApiEnvelope<SimulatorPayload>;
  if (!response.ok || !payload.success) {
    throw new Error(
      resolveApiErrorMessage(payload, "No pudimos calcular la simulación")
    );
  }

  return payload.data;
}
