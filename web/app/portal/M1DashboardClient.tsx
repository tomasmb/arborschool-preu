"use client";

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
};

function ContextBanner({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">{message}</p>
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
}: M1DashboardClientProps) {
  const {
    loading,
    error,
    data,
    nextActionLoading,
    nextActionError,
    nextActionData,
  } = usePortalDashboard();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return <ErrorStatePanel message={error} />;
  }

  if (!data) {
    return (
      <ErrorStatePanel message="No pudimos cargar tu portal. Intenta de nuevo." />
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
        loading={nextActionLoading}
        error={nextActionError}
        data={nextActionData}
        subscriptionStatus={subscriptionStatus}
      />
      <DashboardMissionSection data={data} />
      <DashboardProgressSection data={data} />
      <DashboardProgressLink />
    </div>
  );
}
