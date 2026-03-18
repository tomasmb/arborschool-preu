"use client";

import Link from "next/link";
import { LearningPathSection } from "./LearningPathSection";
import {
  DashboardHeroSection,
  DashboardMissionSection,
  DashboardProgressLink,
  DashboardProgressSection,
} from "./DashboardSections";
import {
  EmptyStatePanel,
  ErrorStatePanel,
  MilestoneBanner,
} from "./components";
import { usePortalDashboard } from "./usePortalDashboard";

type M1DashboardClientProps = {
  contextBanner?: string | null;
  subscriptionStatus: string;
  masteredAtomCount: number;
};

function ContextBanner({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">{message}</p>
    </section>
  );
}

function MissingTargetBanner() {
  return (
    <section
      className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4
        flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-full bg-amber-100 flex items-center
          justify-center shrink-0"
      >
        <svg
          className="w-5 h-5 text-amber-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18
              0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Define tu meta M1
        </p>
        <p className="text-xs text-amber-700">
          Agrega un puntaje objetivo para activar la brecha y el plan de
          esfuerzo.
        </p>
      </div>
      <Link
        href="/portal/goals?tab=simulador"
        className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-xs
          font-medium text-white hover:bg-amber-700 transition-colors"
      >
        Configurar
      </Link>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-12 w-24 bg-gray-200 rounded" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="mt-4 h-3 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
        <div className="h-12 w-48 bg-gray-100 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function M1DashboardClient({
  contextBanner,
  subscriptionStatus,
  masteredAtomCount,
}: M1DashboardClientProps) {
  const { loading, error, data } = usePortalDashboard();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return <ErrorStatePanel message={error} />;
  }

  if (!data) {
    return (
      <ErrorStatePanel message="No pudimos cargar tu portal. Intenta de nuevo." />
    );
  }

  // For missing_target, show the dashboard with an inline prompt
  // instead of blocking the entire experience with EmptyStatePanel.
  if (data.status === "missing_target") {
    return (
      <div className="space-y-4">
        {contextBanner ? <ContextBanner message={contextBanner} /> : null}
        <MissingTargetBanner />
        <DashboardHeroSection data={data} />
        <LearningPathSection
          loading={false}
          error={null}
          data={data.nextActionFull}
          subscriptionStatus={subscriptionStatus}
          masteredAtomCount={masteredAtomCount}
        />
        <DashboardMissionSection data={data} />
        <DashboardProgressLink />
      </div>
    );
  }

  // Other non-ready states still show the full EmptyStatePanel
  if (data.status !== "ready" && data.emptyState) {
    return (
      <EmptyStatePanel
        title={data.emptyState.title}
        description={data.emptyState.description}
        ctaLabel={data.emptyState.ctaLabel}
        ctaHref={data.emptyState.ctaHref}
      />
    );
  }

  return (
    <div className="space-y-4">
      {contextBanner ? <ContextBanner message={contextBanner} /> : null}
      <MilestoneBanner
        completedSessions={data.mission.completedSessions}
        targetSessions={data.mission.targetSessions}
        masteredAtoms={data.confidence.masteredAtoms}
        totalAtoms={data.confidence.totalAtoms}
      />
      <DashboardHeroSection data={data} />
      <LearningPathSection
        loading={false}
        error={null}
        data={data.nextActionFull}
        subscriptionStatus={subscriptionStatus}
        masteredAtomCount={masteredAtomCount}
      />
      <DashboardMissionSection data={data} />
      <DashboardProgressSection data={data} />
      <DashboardProgressLink />
    </div>
  );
}
