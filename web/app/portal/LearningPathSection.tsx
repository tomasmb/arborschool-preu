"use client";

import Link from "next/link";
import { useState } from "react";
import { trackStudentNextActionClicked } from "@/lib/analytics";
import { MINUTES_PER_ATOM } from "@/lib/diagnostic/scoringConstants";
import { InlineRecoveryPanel, UpgradePrompt } from "./components";
import { ReviewSuggestionBanner } from "./components/ReviewSuggestionBanner";
import { formatMinutes } from "./formatters";
import type {
  CompetitiveRoutePayload,
  NextActionPayload,
  ReviewItemPayload,
} from "./NextActionSection";

type LearningPathSectionProps = {
  loading: boolean;
  error: string | null;
  data: NextActionPayload | null;
  subscriptionStatus: string;
};

type PathAtom = { atomId: string; title: string };

type AxisStyle = { bg: string; text: string; dot: string; ring: string };

const AXIS_STYLES: Record<string, AxisStyle> = {
  ALG: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-600",
    ring: "ring-indigo-100",
  },
  NUM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-100",
  },
  GEO: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
  PROB: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-100",
  },
};

const DEFAULT_STYLE: AxisStyle = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  dot: "bg-gray-500",
  ring: "ring-gray-100",
};

function axisStyle(code: string): AxisStyle {
  return AXIS_STYLES[code] ?? DEFAULT_STYLE;
}

function studyHref(atomId: string): string {
  return `/portal/study?atom=${encodeURIComponent(atomId)}`;
}

function LoadingSkeleton() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-44 bg-gray-200 rounded" />
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-gray-200" />
            <div className="w-0.5 flex-1 bg-gray-100" />
          </div>
          <div className="space-y-2 flex-1 pb-6">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-10 w-40 bg-gray-100 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="h-4 w-4 rounded-full bg-gray-100" />
            <div className="w-0.5 flex-1 bg-gray-100" />
          </div>
          <div className="space-y-2 flex-1 pb-4">
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AxisBadge({ label, axisCode }: { label: string; axisCode?: string }) {
  const s = axisCode ? axisStyle(axisCode) : DEFAULT_STYLE;
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5
        rounded-full ${s.bg} ${s.text}`}
    >
      {label}
    </span>
  );
}

function ReviewBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Link
      href="/portal/study?mode=review"
      className="inline-flex items-center gap-1.5 text-xs font-medium
        px-3 py-1.5 rounded-full bg-amber-50 text-amber-700
        hover:bg-amber-100 transition-colors"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
        />
      </svg>
      {count} {count === 1 ? "repaso pendiente" : "repasos pendientes"}
    </Link>
  );
}

function VerificationBanner({ count }: { count: number }) {
  return (
    <Link
      href="/portal/study?mode=verification"
      onClick={() => trackStudentNextActionClicked("verification", true)}
      className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200
        bg-amber-50/60 px-4 py-3 hover:bg-amber-50 transition"
    >
      <span
        className="w-8 h-8 rounded-full bg-amber-100 flex items-center
          justify-center shrink-0"
      >
        <svg
          className="w-4 h-4 text-amber-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">
          Verificación rápida
        </p>
        <p className="text-xs text-amber-600">
          {count} {count === 1 ? "concepto necesita" : "conceptos necesitan"}{" "}
          confirmación de tu último test
        </p>
      </div>
      <ArrowIcon />
    </Link>
  );
}

function CurrentNode({
  atom,
  axisLabel,
  axisCode,
  studyMinutes,
  pointsGain,
}: {
  atom: PathAtom;
  axisLabel: string;
  axisCode?: string;
  studyMinutes: number | null;
  pointsGain: number | null;
}) {
  const s = axisCode ? axisStyle(axisCode) : DEFAULT_STYLE;
  const href = studyHref(atom.atomId);

  return (
    <div className="flex gap-4 animate-fade-in-up">
      <div className="flex flex-col items-center">
        <div
          className={`w-5 h-5 rounded-full ${s.dot} ring-4 ${s.ring}
            shrink-0 mt-1`}
        />
        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
      </div>

      <div className="flex-1 pb-5">
        <AxisBadge label={axisLabel} axisCode={axisCode} />
        <h3 className="mt-1.5 text-base font-semibold text-gray-900">
          {atom.title}
        </h3>
        {pointsGain ? (
          <p className="text-xs text-gray-500 mt-0.5">
            Hasta +{pointsGain} pts PAES
          </p>
        ) : null}

        <Link
          href={href}
          onClick={() => trackStudentNextActionClicked(href, true)}
          className="btn-cta mt-3 text-sm inline-flex items-center gap-2
            py-2.5 px-5 animate-glow-pulse"
        >
          Comenzar mini-clase
          {studyMinutes ? (
            <span className="text-xs opacity-80">
              ~{formatMinutes(studyMinutes)}
            </span>
          ) : null}
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}

function PreviewNode({
  atom,
  index,
  isLast,
  axisLabel,
  axisCode,
}: {
  atom: PathAtom;
  index: number;
  isLast: boolean;
  axisLabel: string;
  axisCode?: string;
}) {
  return (
    <div
      className="flex gap-4 animate-fade-in-up"
      style={{ animationDelay: `${(index + 1) * 100}ms` }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-4 h-4 rounded-full border-2 border-gray-300
            bg-white shrink-0 mt-0.5"
        />
        {!isLast ? <div className="w-0.5 flex-1 bg-gray-200 mt-1" /> : null}
      </div>

      <div className={`flex-1 ${isLast ? "" : "pb-4"}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{atom.title}</span>
          <AxisBadge label={axisLabel} axisCode={axisCode} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Próximo</p>
      </div>
    </div>
  );
}

function ReviewNode({
  item,
  index,
  isLast,
}: {
  item: ReviewItemPayload;
  index: number;
  isLast: boolean;
}) {
  return (
    <div
      className="flex gap-4 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col items-center">
        <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-50 shrink-0 mt-0.5" />
        {!isLast ? <div className="w-0.5 flex-1 bg-gray-200 mt-1" /> : null}
      </div>
      <div className={`flex-1 ${isLast ? "" : "pb-3"}`}>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/study?mode=review"
            className="text-sm text-amber-700 hover:text-amber-800 hover:underline transition-colors"
          >
            {item.title}
          </Link>
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            Repaso
          </span>
        </div>
      </div>
    </div>
  );
}

function RouteFork({
  routes,
  selectedAxis,
  onSelect,
}: {
  routes: CompetitiveRoutePayload[];
  selectedAxis: string;
  onSelect: (axis: string) => void;
}) {
  if (routes.length < 2) return null;

  return (
    <div
      className="mt-4 pt-4 border-t border-gray-100 animate-fade-in-up"
      style={{ animationDelay: "300ms" }}
    >
      <p className="text-sm font-medium text-gray-700 mb-3">Elige tu camino</p>
      <div className="grid grid-cols-2 gap-3">
        {routes.map((route) => (
          <RouteToggle
            key={route.axis}
            route={route}
            isSelected={route.axis === selectedAxis}
            onSelect={() => onSelect(route.axis)}
          />
        ))}
      </div>
    </div>
  );
}

function RouteToggle({
  route,
  isSelected,
  onSelect,
}: {
  route: CompetitiveRoutePayload;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const s = axisStyle(route.axis);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-xl border p-3 text-left transition-all w-full",
        isSelected
          ? `border-2 ${s.bg} shadow-sm`
          : "border-gray-200 hover:border-gray-400 hover:shadow-sm",
      ].join(" ")}
    >
      <span
        className={`inline-block text-[11px] font-semibold uppercase
          tracking-wider ${s.text} mb-1`}
      >
        {route.axisDisplayName}
      </span>
      <p className="text-sm font-medium text-gray-900 leading-snug">
        {route.atoms[0]?.title ?? route.axisDisplayName}
      </p>
      {route.estimatedPointsGain > 0 ? (
        <span className="mt-1.5 inline-block text-xs text-emerald-600">
          +{route.estimatedPointsGain} pts estimados
        </span>
      ) : null}
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="w-4 h-4"
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
  );
}

function LearningPathContent({
  data,
  subscriptionStatus,
}: {
  data: NextActionPayload;
  subscriptionStatus: string;
}) {
  const routes = data.competitiveRoutes ?? [];
  const action = data.nextAction;
  const reviewItems = data.reviewItems ?? [];
  const hasReviews = reviewItems.length > 0;
  const hasRouteFork = routes.length >= 2;
  const reviewSuggested = data.reviewSuggested ?? false;

  const [selectedAxis, setSelectedAxis] = useState(
    routes[0]?.axis ?? action?.axis ?? ""
  );

  const activeRoute =
    routes.find((r) => r.axis === selectedAxis) ?? routes[0] ?? null;

  const pathAtoms: PathAtom[] = activeRoute
    ? activeRoute.atoms
    : action?.firstAtom
      ? [action.firstAtom]
      : [];

  if (pathAtoms.length === 0 && !hasReviews) return null;

  const axisLabel = activeRoute?.axisDisplayName ?? action?.axis ?? "";
  const axisCode = activeRoute?.axis;
  const pointsGain =
    activeRoute?.estimatedPointsGain ?? action?.pointsGain ?? null;

  const currentAtom = pathAtoms[0] ?? null;
  const upcomingAtoms = pathAtoms.slice(1);
  const hasUpcoming = upcomingAtoms.length > 0 || currentAtom !== null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-serif font-semibold text-gray-900">
          Tu camino recomendado
        </h2>
        <ReviewBadge count={data.reviewDueCount ?? 0} />
      </div>

      {(data.verificationDueCount ?? 0) > 0 && (
        <VerificationBanner count={data.verificationDueCount ?? 0} />
      )}

      {reviewSuggested && (
        <ReviewSuggestionBanner count={data.reviewDueCount ?? 0} />
      )}

      {hasRouteFork ? (
        <RouteFork
          routes={routes}
          selectedAxis={selectedAxis}
          onSelect={setSelectedAxis}
        />
      ) : null}

      <div className={hasRouteFork ? "mt-5" : ""}>
        {reviewItems.map((item, i) => (
          <ReviewNode
            key={item.atomId}
            item={item}
            index={i}
            isLast={!hasUpcoming && i === reviewItems.length - 1}
          />
        ))}

        {currentAtom ? (
          <CurrentNode
            key={`${axisCode}-${currentAtom.atomId}`}
            atom={currentAtom}
            axisLabel={axisLabel}
            axisCode={axisCode}
            studyMinutes={MINUTES_PER_ATOM}
            pointsGain={pointsGain}
          />
        ) : null}

        {upcomingAtoms.map((atom, i) => (
          <PreviewNode
            key={atom.atomId}
            atom={atom}
            index={i}
            isLast={i === upcomingAtoms.length - 1}
            axisLabel={axisLabel}
            axisCode={axisCode}
          />
        ))}
      </div>

      {subscriptionStatus !== "active" && <UpgradePrompt variant="inline" />}
    </section>
  );
}

export function LearningPathSection({
  loading,
  error,
  data,
  subscriptionStatus,
}: LearningPathSectionProps) {
  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <InlineRecoveryPanel
        message={
          error ||
          "No pudimos cargar tu camino de aprendizaje. Prueba de nuevo."
        }
        onRetry={() => window.location.reload()}
        showSecondaryAction={false}
      />
    );
  }

  if (data?.emptyState) {
    return (
      <section
        className="rounded-2xl border border-gray-200 bg-white
          p-5 sm:p-6 space-y-3"
      >
        <p className="text-sm text-gray-700">{data.emptyState.description}</p>
        <Link href={data.emptyState.ctaHref} className="btn-primary text-sm">
          {data.emptyState.ctaLabel}
        </Link>
      </section>
    );
  }

  if (!data) return null;
  return (
    <LearningPathContent data={data} subscriptionStatus={subscriptionStatus} />
  );
}
