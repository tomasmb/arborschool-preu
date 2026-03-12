/**
 * Mastery section - learning method + learning path preview
 * Combines the "how you learn" message with a real portal mockup
 */
import { BrowserFrame } from "./BrowserFrame";
import { ScrollReveal } from "./ScrollReveal";

export function MasterySection() {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full sm:w-1/2 h-1/2 sm:h-full bg-gradient-to-l from-accent/5 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: method + features */}
          <ScrollReveal className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-4 sm:mb-6">
              Aprendes de verdad,{" "}
              <span className="text-accent">no de memoria</span>
            </h2>
            <p className="text-base sm:text-lg text-cool-gray mb-8">
              Arbor arma tu camino personalizado por eje matemático
              y te dice exactamente qué estudiar primero.
            </p>

            <div className="space-y-4 sm:space-y-5 inline-flex flex-col items-start">
              <FeatureRow
                icon={<BookOpenIcon />}
                text="Mini-clase con teoría y ejemplos antes de practicar"
                color="accent"
              />
              <FeatureRow
                icon={<ShieldIcon />}
                text="Práctica adaptativa con feedback inmediato"
                color="primary"
              />
              <FeatureRow
                icon={<RefreshIcon />}
                text="Repaso espaciado justo antes de que se te olvide"
                color="success"
              />
            </div>
          </ScrollReveal>

          {/* Right: learning path browser mockup */}
          <ScrollReveal delay={150}>
            <p className="text-sm font-semibold text-primary/80 mb-3 sm:mb-4 text-center uppercase tracking-wide">
              Así se ve tu camino de aprendizaje
            </p>
            <BrowserFrame>
              <LearningPathPreview />
            </BrowserFrame>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// -- Compact feature row (icon + single line of text) --

function FeatureRow({
  icon,
  text,
  color,
}: {
  icon: React.ReactNode;
  text: string;
  color: "accent" | "primary" | "success";
}) {
  const bgClass = {
    accent: "bg-accent/10",
    primary: "bg-primary/10",
    success: "bg-success/10",
  }[color];

  return (
    <div className="flex items-center gap-3 sm:gap-4 text-left">
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <p className="text-charcoal font-medium text-sm sm:text-base">{text}</p>
    </div>
  );
}

// -- Learning path preview (mirrors real portal LearningPathSection) --

function LearningPathPreview() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal">
          Tu camino recomendado
        </h3>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium
            px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"
        >
          <ClockIcon />
          1 repaso pendiente
        </span>
      </div>

      <div>
        {/* Review node */}
        <PathNode
          dotClass="border-2 border-amber-400 bg-amber-50"
          title="Ecuaciones lineales"
          badge={{ label: "Repaso", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" }}
          showLine
        />

        {/* Current atom — primary action */}
        <div className="flex gap-3 sm:gap-4">
          <div className="flex flex-col items-center">
            <div
              className="w-5 h-5 rounded-full bg-indigo-600 ring-4 ring-indigo-100
                shrink-0 mt-1"
            />
            <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
          </div>
          <div className="flex-1 pb-5">
            <span
              className="inline-block text-xs font-medium px-2 py-0.5
                rounded-full bg-indigo-50 text-indigo-700"
            >
              Dominio Algebraico
            </span>
            <h4 className="mt-1.5 text-sm sm:text-base font-semibold text-charcoal">
              Factorización
            </h4>
            <p className="text-xs text-cool-gray mt-0.5">
              Hasta +8 pts PAES
            </p>
            <div
              className="mt-3 inline-flex items-center gap-2
                bg-gradient-to-r from-[#0b3a5b] to-[#134b73]
                text-white text-sm font-medium py-2.5 px-5
                rounded-xl shadow-md"
            >
              Comenzar mini-clase
              <span className="text-xs opacity-80">~25 min</span>
              <ArrowRightIcon />
            </div>
          </div>
        </div>

        {/* Upcoming atom */}
        <PathNode
          dotClass="border-2 border-gray-300 bg-white"
          title="Productos notables"
          axisBadge={{
            label: "Dominio Algebraico",
            bg: "bg-indigo-50",
            text: "text-indigo-700",
          }}
          subtitle="Próximo"
          showLine={false}
        />
      </div>
    </div>
  );
}

function PathNode({
  dotClass,
  title,
  badge,
  axisBadge,
  subtitle,
  showLine,
}: {
  dotClass: string;
  title: string;
  badge?: { label: string; bg: string; text: string; border: string };
  axisBadge?: { label: string; bg: string; text: string };
  subtitle?: string;
  showLine: boolean;
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${dotClass} shrink-0 mt-0.5`} />
        {showLine ? <div className="w-0.5 flex-1 bg-gray-200 mt-1" /> : null}
      </div>
      <div className={`flex-1 ${showLine ? "pb-4" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-charcoal">{title}</span>
          {badge && (
            <span
              className={`inline-block text-[10px] font-semibold uppercase
                tracking-wider px-1.5 py-0.5 rounded-full
                ${badge.bg} ${badge.text} border ${badge.border}`}
            >
              {badge.label}
            </span>
          )}
          {axisBadge && (
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5
                rounded-full ${axisBadge.bg} ${axisBadge.text}`}
            >
              {axisBadge.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-cool-gray mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function BookOpenIcon() {
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function ShieldIcon() {
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

function ClockIcon() {
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
        d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
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
