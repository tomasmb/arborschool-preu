/**
 * Mastery section - learning method + daily plan preview
 * Combines the "how you learn" message with a tangible daily plan mockup
 */
import { BrowserFrame } from "./BrowserFrame";

export function MasterySection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full sm:w-1/2 h-1/2 sm:h-full bg-gradient-to-l from-accent/5 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: method + features */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
              Aprendes de verdad,{" "}
              <span className="text-accent">no de memoria</span>
            </h2>
            <p className="text-lg text-cool-gray mb-10">
              Cada día sabes exactamente qué hacer. Sesiones cortas que
              puedes hacer desde cualquier lugar.
            </p>

            <div className="space-y-5">
              <FeatureRow
                icon={<BoltIcon />}
                text="Ejemplo resuelto paso a paso antes de practicar"
                color="accent"
              />
              <FeatureRow
                icon={<ShieldIcon />}
                text="Práctica activa desde el primer minuto"
                color="primary"
              />
              <FeatureRow
                icon={<RefreshIcon />}
                text="Repaso justo antes de que se te olvide"
                color="success"
              />
            </div>

            <p className="text-sm text-cool-gray mt-8">
              Basado en técnicas respaldadas por décadas de investigación
              en ciencias del aprendizaje.
            </p>
          </div>

          {/* Right: daily plan browser mockup */}
          <div>
            <p className="text-sm font-semibold text-primary/60 mb-4 text-center uppercase tracking-wide">
              Así se verá tu plan diario
            </p>
            <BrowserFrame>
              <DailyPlanPreview />
            </BrowserFrame>
          </div>
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
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <p className="text-charcoal font-medium">{text}</p>
    </div>
  );
}

// -- Daily plan preview (moved from DailyPlanSection) --

function DailyPlanPreview() {
  return (
    <div className="p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-serif font-bold text-charcoal">
            Hoy
          </h3>
          <p className="text-cool-gray text-sm">Martes 13 de enero</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-charcoal">
            25
            <span className="text-lg font-normal text-cool-gray ml-1">
              min
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <TaskCard
          icon={<TaskBoltIcon />}
          title="Victoria rápida"
          badge="+12 pts"
          description="Ecuaciones cuadráticas – 5 ejercicios"
          time="8 min"
          variant="accent"
          highlighted
        />
        <TaskCard
          icon={<BookIcon />}
          title="Mini-clase"
          description="Factorización – Ejemplos + práctica"
          time="12 min"
          variant="primary"
        />
        <TaskCard
          icon={<TaskRefreshIcon />}
          title="Repaso"
          description="Comprensión de textos – No olvidar"
          time="5 min"
          variant="success"
        />
      </div>
    </div>
  );
}

function TaskCard({
  icon,
  title,
  badge,
  description,
  time,
  variant,
  highlighted,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  description: string;
  time: string;
  variant: "accent" | "primary" | "success";
  highlighted?: boolean;
}) {
  const gradientClass = {
    accent: "from-accent to-accent-light",
    primary: "from-primary to-primary-light",
    success: "from-success to-emerald-400",
  }[variant];

  const containerClass = highlighted
    ? "bg-accent/10 rounded-xl border-2 border-accent shadow-sm"
    : "bg-off-white rounded-xl border border-gray-200";

  return (
    <div className={`flex items-center gap-4 p-4 ${containerClass}`}>
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-charcoal text-sm">{title}</p>
          {badge && (
            <span className="text-xs font-bold text-white bg-accent px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-charcoal/60 text-sm truncate">{description}</p>
      </div>
      <span className="text-xs font-semibold text-charcoal/50 shrink-0">
        {time}
      </span>
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

// Feature row icons (small, colored)
function BoltIcon() {
  return (
    <svg
      className="w-5 h-5 text-accent"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      className="w-5 h-5 text-primary"
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
      className="w-5 h-5 text-success"
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

// Task card icons (small, white — on gradient backgrounds)
function TaskBoltIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
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

function TaskRefreshIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
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
