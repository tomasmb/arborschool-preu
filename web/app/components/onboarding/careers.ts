export interface CareerOption {
  offeringId: string;
  nombre: string;
  universidad: string;
  puntaje_corte: number | null;
}

export interface CareerGoal extends CareerOption {
  savedAt: string;
}

interface StudentGoalsResponse {
  success: boolean;
  data?: {
    options: {
      offeringId: string;
      careerName: string;
      universityName: string;
      lastCutoff: number | null;
    }[];
    goals: {
      offeringId: string;
      careerName: string;
      universityName: string;
      lastCutoff: number | null;
    }[];
  };
}

type GoalsData = NonNullable<StudentGoalsResponse["data"]>;

function toCareerOption(option: GoalsData["options"][number]): CareerOption {
  return {
    offeringId: option.offeringId,
    nombre: option.careerName,
    universidad: option.universityName,
    puntaje_corte: option.lastCutoff,
  };
}

export async function fetchCareerOptions(): Promise<CareerOption[]> {
  const response = await fetch("/api/student/goals", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as StudentGoalsResponse;
  const options = payload.data?.options ?? [];
  return options
    .map(toCareerOption)
    .sort(
      (a, b) =>
        (b.puntaje_corte ?? Number.NEGATIVE_INFINITY) -
        (a.puntaje_corte ?? Number.NEGATIVE_INFINITY)
    );
}

export async function saveCareerGoal(career: CareerOption): Promise<void> {
  const response = await fetch("/api/student/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      goals: [
        {
          offeringId: career.offeringId,
          priority: 1,
          isPrimary: true,
          bufferPoints: 30,
          bufferSource: "system",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save goal");
  }
}

export async function getCareerGoal(): Promise<CareerGoal | null> {
  const response = await fetch("/api/student/goals", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as StudentGoalsResponse;
  const goal = payload.data?.goals?.[0];
  if (!goal) {
    return null;
  }

  return {
    offeringId: goal.offeringId,
    nombre: goal.careerName,
    universidad: goal.universityName,
    puntaje_corte: goal.lastCutoff,
    savedAt: new Date().toISOString(),
  };
}

export function filterCareers(
  careers: CareerOption[],
  query: string
): CareerOption[] {
  if (!query.trim()) {
    return careers;
  }
  const normalized = query.toLowerCase().trim();
  return careers.filter(
    (career) =>
      career.nombre.toLowerCase().includes(normalized) ||
      career.universidad.toLowerCase().includes(normalized)
  );
}
