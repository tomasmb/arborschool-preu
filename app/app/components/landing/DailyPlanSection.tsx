import { BrowserFrame } from "./BrowserFrame";

export function DailyPlanSection() {
  return (
    <section className="py-24 bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
            Cada día sabes qué hacer
          </h2>
          <p className="text-xl text-cool-gray max-w-2xl mx-auto">
            Tu plan se actualiza después de cada sesión, siempre enfocado en
            maximizar tu puntaje
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold text-primary/60 mb-4 text-center uppercase tracking-wide">
            Así se verá tu plan diario
          </p>
          <BrowserFrame>
            <DailyPlanPreview />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

function DailyPlanPreview() {
  return (
    <div className="p-6 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-serif font-bold text-charcoal">Hoy</h3>
          <p className="text-cool-gray">Martes 13 de enero</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-charcoal">
            25
            <span className="text-lg font-normal text-cool-gray ml-1">min</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <TaskCard
          icon={<BoltIcon />}
          title="Victoria rápida"
          badge="+12 pts"
          description="Ecuaciones cuadráticas – 5 ejercicios"
          time="8 min"
          variant="accent"
          highlighted
        />
        <TaskCard
          icon={<BookIcon />}
          title="Nuevo concepto"
          description="Factorización – Lección + práctica"
          time="12 min"
          variant="primary"
        />
        <TaskCard
          icon={<RefreshIcon />}
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
    : "bg-off-white rounded-xl border border-gray-200 hover:border-primary transition-colors";

  return (
    <div
      className={`flex items-center gap-4 p-5 ${containerClass} group cursor-pointer`}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-charcoal">{title}</p>
          {badge && (
            <span className="text-xs font-bold text-white bg-accent px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-charcoal/70">{description}</p>
      </div>
      <span className="text-sm font-semibold text-charcoal/60">{time}</span>
    </div>
  );
}

// Icons
function BoltIcon() {
  return (
    <svg
      className="w-6 h-6 text-white"
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
      className="w-6 h-6 text-white"
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

function RefreshIcon() {
  return (
    <svg
      className="w-6 h-6 text-white"
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
