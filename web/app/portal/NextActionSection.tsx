"use client";

import Link from "next/link";
import { trackStudentNextActionClicked } from "@/lib/analytics";
import { InlineRecoveryPanel } from "./components";

export type CompetitiveRoutePayload = {
  axis: string;
  axisDisplayName: string;
  estimatedPointsGain: number;
  atoms: Array<{ atomId: string; title: string }>;
};

export type ReviewItemPayload = {
  atomId: string;
  title: string;
};

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
  competitiveRoutes?: CompetitiveRoutePayload[];
  reviewDueCount?: number;
  reviewItems?: ReviewItemPayload[];
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

function formatMinutes(value: number | null): string {
  if (value === null) return "-";
  if (value === 0) return "0 min";
  if (value < 60) return `${value} min`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function NextActionLoadingState() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
        <div className="h-12 w-48 bg-gray-100 rounded-xl" />
      </div>
    </section>
  );
}

function NextActionErrorState({ message }: { message: string }) {
  return (
    <InlineRecoveryPanel
      message={
        message || "No pudimos cargar tu siguiente paso. Prueba de nuevo."
      }
      onRetry={() => window.location.reload()}
      showSecondaryAction={false}
    />
  );
}

function PrimaryCTA({ data }: { data: NextActionPayload }) {
  const action = data.nextAction;
  const href = data.sprintHint.ctaHref || "/portal/study";
  const minutes = action?.studyMinutes ?? data.sprintHint.estimatedMinutes;
  const topic = action?.firstAtom?.title ?? action?.axis;

  return (
    <section
      className="rounded-2xl bg-gradient-to-br from-[#0b3a5b] to-[#0f4d75]
        p-5 sm:p-6 space-y-4 shadow-lg"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-serif font-semibold text-white">
          Tu siguiente paso
        </h2>
        {topic ? (
          <p className="text-sm text-white/70">
            {topic}
            {action?.pointsGain ? ` — hasta +${action.pointsGain} pts` : ""}
          </p>
        ) : null}
      </div>

      <Link
        href={href}
        onClick={() => trackStudentNextActionClicked(href, true)}
        className="btn-cta text-base w-full sm:w-auto flex items-center
          justify-center gap-2 py-3.5 animate-glow-pulse"
      >
        Comenzar mini-clase
        <span className="text-sm opacity-80">~{formatMinutes(minutes)}</span>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>

      {data.queuePreview.length > 0 ? (
        <p className="text-xs text-white/50">
          Después:{" "}
          {data.queuePreview
            .slice(0, 2)
            .map((q) => q.title)
            .join(", ")}
        </p>
      ) : null}
    </section>
  );
}

export function NextActionSection({
  loading,
  error,
  data,
}: NextActionSectionProps) {
  if (loading) return <NextActionLoadingState />;
  if (error) return <NextActionErrorState message={error} />;

  if (data?.emptyState) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
        <p className="text-sm text-gray-700">{data.emptyState.description}</p>
        <Link href={data.emptyState.ctaHref} className="btn-primary text-sm">
          {data.emptyState.ctaLabel}
        </Link>
      </section>
    );
  }

  if (!data) return null;
  return <PrimaryCTA data={data} />;
}
