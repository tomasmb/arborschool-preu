import { ProgressRail } from "./ProgressRail";

type MissionCardProps = {
  targetSessions: number;
  completedSessions: number;
  weekStartDate: string;
  weekEndDate: string;
};

export function MissionCard({
  targetSessions,
  completedSessions,
  weekStartDate,
  weekEndDate,
}: MissionCardProps) {
  const remaining = Math.max(0, targetSessions - completedSessions);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-serif font-semibold text-primary">
          Misión semanal
        </h2>
        <p className="text-sm text-gray-600">
          Semana {weekStartDate} a {weekEndDate}
        </p>
      </div>

      <ProgressRail
        label="Sesiones completadas"
        current={completedSessions}
        total={targetSessions}
      />

      <p className="text-sm text-gray-700">
        {remaining === 0
          ? "Objetivo semanal completado. Mantén el ritmo."
          : `Te faltan ${remaining} sesiones para cerrar la misión de esta semana.`}
      </p>
    </article>
  );
}
