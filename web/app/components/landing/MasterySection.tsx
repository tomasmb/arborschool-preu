/**
 * Intelligent Learning section — showcases how the system discovers and
 * fills knowledge gaps dynamically via prereq scanning, spaced repetition,
 * and verification loops.
 */
import { BrowserFrame } from "./BrowserFrame";
import { ScrollReveal } from "./ScrollReveal";

export function MasterySection() {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-full sm:w-1/2
          h-1/2 sm:h-full bg-gradient-to-l from-accent/5 to-transparent"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: features */}
          <ScrollReveal className="text-center lg:text-left">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl
                font-serif font-bold text-charcoal mb-4 sm:mb-6"
            >
              Un sistema que{" "}
              <span className="text-accent">aprende contigo</span>
            </h2>
            <p className="text-base sm:text-lg text-cool-gray mb-8">
              Cada interacción — mini-clase, repaso, ensayo — alimenta el mapa
              de lo que sabes y lo que te falta.
            </p>

            <div className="space-y-5 sm:space-y-6 inline-flex flex-col items-start">
              <FeatureRow
                icon={<SearchIcon />}
                title="Descubre vacíos automáticamente"
                text={
                  "Cuando no dominas un concepto, Arbor escanea " +
                  "tus prerequisitos para encontrar el vacío exacto."
                }
                color="accent"
              />
              <FeatureRow
                icon={<RefreshIcon />}
                title="Repaso que se adapta a ti"
                text={
                  "Programa repasos según qué tan rápido y bien " +
                  "respondiste. Dominar conceptos avanzados refuerza " +
                  "los básicos automáticamente."
                }
                color="success"
              />
              <FeatureRow
                icon={<ShieldCheckIcon />}
                title="Distingue deslices de vacíos reales"
                text={
                  "Si fallas en un ensayo, un quiz de verificación " +
                  "confirma si realmente olvidaste o fue un error puntual."
                }
                color="primary"
              />
            </div>
          </ScrollReveal>

          {/* Right: prereq scan / gap discovery mockup */}
          <ScrollReveal delay={150}>
            <p
              className="text-sm font-semibold text-primary/80 mb-3 sm:mb-4
                text-center uppercase tracking-wide"
            >
              Así detectamos tus vacíos
            </p>
            <BrowserFrame>
              <GapDiscoveryPreview />
            </BrowserFrame>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function FeatureRow({
  icon,
  title,
  text,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color: "accent" | "primary" | "success";
}) {
  const bgClass = {
    accent: "bg-accent/10",
    primary: "bg-primary/10",
    success: "bg-success/10",
  }[color];

  return (
    <div className="flex items-start gap-3 sm:gap-4 text-left">
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 mt-0.5 rounded-xl
          ${bgClass} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-charcoal font-semibold text-sm sm:text-base">
          {title}
        </p>
        <p className="text-cool-gray text-xs sm:text-sm mt-0.5 max-w-sm">
          {text}
        </p>
      </div>
    </div>
  );
}

/**
 * Mockup showing a prereq scan in action:
 * 1. Failed atom at top
 * 2. Scanning prereqs
 * 3. Gap found — path rerouted
 */
function GapDiscoveryPreview() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Failure trigger */}
      <div
        className="flex items-center gap-2 text-xs font-semibold
          px-3 py-1.5 rounded-full bg-red-50 text-red-600
          border border-red-200 w-fit mb-5"
      >
        <XCircleIcon />
        No dominaste Factorización
      </div>

      {/* Scan header */}
      <div
        className="flex items-center gap-2 mb-4 text-sm
          font-semibold text-charcoal"
      >
        <span
          className="w-6 h-6 rounded-full bg-gradient-to-br
            from-amber-400 to-amber-500 flex items-center
            justify-center"
        >
          <ScanIconSmall />
        </span>
        Escaneando prerequisitos...
      </div>

      {/* Scan results */}
      <div className="space-y-2 mb-5">
        <ScanRow label="Operaciones con fracciones" result="pass" />
        <ScanRow label="Productos notables" result="fail" />
      </div>

      {/* Result banner */}
      <div
        className="flex items-start gap-2.5 p-3 rounded-xl
          bg-emerald-50 border border-emerald-200"
      >
        <CheckCircleIcon />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Vacío encontrado — camino actualizado
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Primero dominas Productos notables, luego vuelves a Factorización.
          </p>
        </div>
      </div>

      {/* Rerouted mini-path */}
      <div className="mt-5 pl-1">
        <MiniPathNode
          status="gap"
          label="Productos notables"
          detail="Prerequisito — tu siguiente mini-clase"
          showLine
        />
        <MiniPathNode
          status="locked"
          label="Factorización"
          detail="Desbloqueado después"
          showLine={false}
        />
      </div>
    </div>
  );
}

function ScanRow({
  label,
  result,
}: {
  label: string;
  result: "pass" | "fail";
}) {
  const isPass = result === "pass";
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border
        ${
          isPass
            ? "bg-emerald-50/60 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}
    >
      <span className="text-sm">
        {isPass ? (
          <span className="text-emerald-500">✓</span>
        ) : (
          <span className="text-red-500">✗</span>
        )}
      </span>
      <span
        className={`text-sm font-medium
          ${isPass ? "text-emerald-700" : "text-red-700"}`}
      >
        {label}
      </span>
      <span
        className={`ml-auto text-[10px] font-bold uppercase tracking-wider
          px-1.5 py-0.5 rounded-full
          ${
            isPass
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
      >
        {isPass ? "Sólido" : "Vacío"}
      </span>
    </div>
  );
}

function MiniPathNode({
  status,
  label,
  detail,
  showLine,
}: {
  status: "gap" | "locked";
  label: string;
  detail: string;
  showLine: boolean;
}) {
  const dotClass =
    status === "gap"
      ? "bg-red-500 ring-4 ring-red-100"
      : "border-2 border-gray-300 bg-white";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${dotClass} shrink-0 mt-0.5`} />
        {showLine && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={showLine ? "pb-3" : ""}>
        <span
          className={`text-sm font-medium
            ${status === "gap" ? "text-red-700" : "text-cool-gray"}`}
        >
          {label}
        </span>
        <p className="text-xs text-cool-gray mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-accent"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-success"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function XCircleIcon() {
  return (
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
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ScanIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
