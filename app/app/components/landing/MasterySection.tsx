import { BrowserFrame } from "./BrowserFrame";

export function MasterySection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full sm:w-1/2 h-1/2 sm:h-full bg-gradient-to-l from-accent/10 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-8">
              Dominio, <span className="text-accent">no horas</span>
            </h2>
            <p className="text-xl text-cool-gray mb-10 leading-relaxed">
              Avanzas cuando demuestras que aprendiste. La práctica empieza
              fácil y sube de nivel a medida que aciertas.
            </p>

            <div className="space-y-6">
              <FeatureItem
                icon={<BoltIcon />}
                title="Victorias rápidas"
                description="Priorizamos conceptos que estás cerca de dominar—puntos fáciles que suben tu puntaje rápido."
                color="accent"
              />
              <FeatureItem
                icon={<ShieldIcon />}
                title="Sin huecos"
                description="Si te trabas, detectamos qué concepto previo te falta y lo trabajamos primero."
                color="primary"
              />
              <FeatureItem
                icon={<RefreshIcon />}
                title="Repaso inteligente"
                description="Te recordamos practicar justo antes de que se te olvide. Así el conocimiento se queda."
                color="success"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-primary/60 mb-4 text-center uppercase tracking-wide">
              Así verás tu progreso
            </p>
            <BrowserFrame>
              <DashboardPreview />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "accent" | "primary" | "success";
}) {
  const bgClass = {
    accent: "bg-accent/10 group-hover:bg-accent/20",
    primary: "bg-primary/10 group-hover:bg-primary/20",
    success: "bg-success/10 group-hover:bg-success/20",
  }[color];

  return (
    <div className="flex gap-4 items-start group">
      <div
        className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0 transition-colors`}
      >
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-charcoal text-lg mb-1">{title}</h4>
        <p className="text-cool-gray">{description}</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif font-bold text-charcoal">Tu Dashboard</h3>
        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
          En vivo
        </span>
      </div>

      <div className="space-y-3">
        <ProgressRow label="Comprensión Lectora" value="87%" color="success" />
        <ProgressRow
          label="Matemática M1"
          value="92%"
          color="accent"
          highlighted
        />
        <ProgressRow label="Ciencias" value="65%" color="cool-gray" />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-cool-gray mb-1">Puntaje proyectado</p>
            <p className="text-4xl font-bold text-charcoal">748</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-cool-gray mb-1">Tu meta</p>
            <p className="text-2xl font-bold text-accent">780</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
  highlighted,
}: {
  label: string;
  value: string;
  color: string;
  highlighted?: boolean;
}) {
  const baseClasses = highlighted
    ? "bg-accent/10 rounded-xl border-2 border-accent shadow-sm"
    : "bg-off-white rounded-xl border border-gray-200 hover:border-success/50 transition-colors";

  return (
    <div className={`flex items-center justify-between p-4 ${baseClasses}`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full bg-${color}`}></div>
        <span className="font-medium text-charcoal">{label}</span>
      </div>
      <span className={`text-lg font-bold text-${color}`}>{value}</span>
    </div>
  );
}

// Icons
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
