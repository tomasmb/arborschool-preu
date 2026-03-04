"use client";

import { NextActionSection } from "./NextActionSection";
import {
  DashboardEffortSection,
  DashboardFooterSection,
  DashboardHeroSection,
} from "./DashboardSections";
import { EmptyStatePanel, ErrorStatePanel } from "./components";
import { usePortalDashboard } from "./usePortalDashboard";

export function M1DashboardClient() {
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
    return null;
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
