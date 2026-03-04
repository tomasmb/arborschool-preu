"use client";

import Link from "next/link";
import { trackStudentNextActionClicked } from "@/lib/analytics";
import { ActionCard, InlineRecoveryPanel } from "./components";

export type NextActionPayload = {
  status: "ready" | "missing_diagnostic" | "missing_mastery";
  nextAction: {
    axis: string;
    pointsGain: number;
    studyMinutes: number;
    questionsUnlocked: number;
    firstAtom: {
      atomId: string;
      title: string;
    } | null;
  } | null;
  queuePreview: {
    atomId: string;
    title: string;
    axis: string;
    efficiency: number;
    unlockScore: number;
    totalCost: number;
    prerequisitesNeeded: string[];
  }[];
  emptyState: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  sprintHint: {
    ctaHref: string;
    suggestedItemCount: number;
    estimatedMinutes: number;
  };
};

type NextActionSectionProps = {
  loading: boolean;
  error: string | null;
  data: NextActionPayload | null;
};

type QueuePreviewItem = NextActionPayload["queuePreview"][number];
type MaybeNextAction = NextActionPayload["nextAction"] | undefined;

function formatMinutes(value: number | null): string {
  if (value === null) {
    return "-";
  }

  if (value === 0) {
    return "0 min";
  }

  if (value < 60) {
    return `${value.toLocaleString("es-CL")} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (minutes === 0) {
    return `${hours.toLocaleString("es-CL")} h`;
  }

  return `${hours.toLocaleString("es-CL")} h ${minutes.toLocaleString("es-CL")} min`;
}

function NextActionLoadingState() {
  return <p className="text-sm text-gray-600">Cargando siguiente acción...</p>;
}

function NextActionErrorState({ message }: { message: string }) {
  return (
    <InlineRecoveryPanel
      message={message}
      onRetry={() => window.location.reload()}
      showSecondaryAction={false}
    />
  );
}

function NextActionEmptyState({
  ctaHref,
  ctaLabel,
  description,
}: {
  ctaHref: string;
  ctaLabel: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">{description}</p>
      <Link
        href={ctaHref}
        className="btn-primary text-sm"
        onClick={() => trackStudentNextActionClicked(ctaHref, false)}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function QueuePreviewList({ queue }: { queue: QueuePreviewItem[] }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Cola recomendada (ROI)
      </p>
      <div className="space-y-2">
        {queue.slice(0, 4).map((item, index) => (
          <div
            key={item.atomId}
            className="rounded-lg border border-gray-100 px-3 py-2"
          >
            <p className="text-sm font-medium text-primary">
              {index + 1}. {item.title}
            </p>
            <p className="text-xs text-gray-600">
              {item.axis} · eficiencia {item.efficiency.toLocaleString("es-CL")}
            </p>
          </div>
        ))}
        {queue.length === 0 ? (
          <p className="text-sm text-gray-600">Sin elementos para mostrar.</p>
        ) : null}
      </div>
    </article>
  );
}

function resolvePrimaryHref(data: NextActionPayload | null): string {
  return data?.sprintHint.ctaHref ?? "/portal/study";
}

function resolveActionTitle(nextAction: MaybeNextAction): string {
  return nextAction?.axis ?? "Sin acción disponible";
}

function resolvePointsGain(nextAction: MaybeNextAction): number {
  return nextAction?.pointsGain ?? 0;
}

function resolveStudyMinutes(data: NextActionPayload | null): number | null {
  if (data?.nextAction) {
    return data.nextAction.studyMinutes;
  }

  return data?.sprintHint.estimatedMinutes ?? null;
}

function resolveQuestionsUnlocked(nextAction: MaybeNextAction): number {
  return nextAction?.questionsUnlocked ?? 0;
}

function resolveFirstAtomTitle(nextAction: MaybeNextAction): string {
  return nextAction?.firstAtom?.title ?? "No definido";
}

function resolveQueuePreview(
  data: NextActionPayload | null
): QueuePreviewItem[] {
  return data?.queuePreview ?? [];
}

function NextActionReadyState({ data }: { data: NextActionPayload | null }) {
  const nextAction = data?.nextAction;
  const primaryHref = resolvePrimaryHref(data);
  const studyMinutes = resolveStudyMinutes(data);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ActionCard
        title={resolveActionTitle(nextAction)}
        description={`+${resolvePointsGain(nextAction)} pts potenciales en ${formatMinutes(
          studyMinutes
        )}.`}
        metrics={
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              {resolveQuestionsUnlocked(nextAction)} preguntas desbloqueables.
            </p>
            <p>Primer foco: {resolveFirstAtomTitle(nextAction)}.</p>
          </div>
        }
        primaryLabel="Comenzar sprint de hoy"
        primaryHref={primaryHref}
        secondaryLabel="Ajustar meta"
        secondaryHref="/portal/goals"
        onPrimaryClick={() => trackStudentNextActionClicked(primaryHref, true)}
      />
      <QueuePreviewList queue={resolveQueuePreview(data)} />
    </div>
  );
}

function NextActionSectionContent({
  loading,
  error,
  data,
}: NextActionSectionProps) {
  if (loading) {
    return <NextActionLoadingState />;
  }

  if (error) {
    return <NextActionErrorState message={error} />;
  }

  if (data?.emptyState) {
    return (
      <NextActionEmptyState
        ctaHref={data.emptyState.ctaHref}
        ctaLabel={data.emptyState.ctaLabel}
        description={data.emptyState.description}
      />
    );
  }

  return <NextActionReadyState data={data} />;
}

export function NextActionSection(props: NextActionSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-xl font-serif font-semibold text-primary">
        Siguiente mejor acción
      </h2>
      <NextActionSectionContent {...props} />
    </section>
  );
}
