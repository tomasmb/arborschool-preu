"use client";

import { NextActionSection } from "./NextActionSection";
import {
  DashboardEffortSection,
  DashboardFooterSection,
  DashboardHeroSection,
} from "./DashboardSections";
import { EmptyStatePanel, ErrorStatePanel } from "./components";
import { usePortalDashboard } from "./usePortalDashboard";

type M1DashboardClientProps = {
  contextBanner?: string | null;
};

function ContextBanner({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">{message}</p>
    </section>
  );
}

export function M1DashboardClient({ contextBanner }: M1DashboardClientProps) {
  const {
    loading,
    error,
    data,
    weeklyMinutes,
    setWeeklyMinutes,
    projectedScore,
    nextActionLoading,
    nextActionError,
    nextActionData,
  } = usePortalDashboard();

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Cargando command center...</p>
      </section>
    );
  }

  if (error) {
    return <ErrorStatePanel message={error} />;
  }

  if (!data) {
    return (
      <ErrorStatePanel message="No pudimos cargar tu estado del portal." />
    );
  }

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
    <div className="space-y-6">
      {contextBanner ? <ContextBanner message={contextBanner} /> : null}
      <DashboardHeroSection data={data} />
      <DashboardEffortSection
        data={data}
        weeklyMinutes={weeklyMinutes}
        projectedScore={projectedScore}
        onChangeWeeklyMinutes={setWeeklyMinutes}
      />
      <NextActionSection
        loading={nextActionLoading}
        error={nextActionError}
        data={nextActionData}
      />
      <DashboardFooterSection />
    </div>
  );
}
