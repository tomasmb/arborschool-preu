/**
 * Learning Science section — research-backed pillars that differentiate
 * Arbor from PDF-based preuniversitarios. Reframed for institutional
 * buyers (coordinators, directors) who care about pedagogical rigor.
 */
import { ScrollReveal } from "./ScrollReveal";
import { BrowserFrame } from "./BrowserFrame";
import { GapDetectionMockup } from "./MockupScreens";

const PILLARS = [
  {
    icon: <CheckBadgeIcon />,
    title: "Dominio basado en evidencia",
    text:
      "3 respuestas consecutivas correctas, mínimo 2 en nivel difícil. " +
      "El alumno demuestra que sabe antes de avanzar.",
    citation: "ASSISTments, ALEKS, Direct Instruction",
    color: "accent" as const,
  },
  {
    icon: <SearchIcon />,
    title: "Detección automática de vacíos",
    text:
      "Cuando un alumno falla, el sistema escanea prerequisitos " +
      "y encuentra el vacío exacto. Redirige la ruta antes de " +
      "seguir avanzando.",
    citation: "Prerequisite-based remediation",
    color: "primary" as const,
  },
  {
    icon: <RefreshIcon />,
    title: "Repaso espaciado adaptativo",
    text:
      "Intervalos basados en la calidad de dominio. Dominar " +
      "conceptos avanzados refuerza automáticamente los básicos.",
    citation: "Math Academy FIRe, spaced repetition research",
    color: "success" as const,
  },
  {
    icon: <ShieldIcon />,
    title: "Dificultad progresiva",
    text:
      "Las preguntas escalan de fácil a difícil. Quizzes de " +
      "verificación distinguen deslices puntuales de vacíos reales.",
    citation: "Adaptive difficulty progression",
    color: "amber" as const,
  },
] as const;

export function MasterySection() {
  return (
    <section className="py-16 sm:py-24 bg-off-white relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4 sm:mb-6"
          >
            Metodología basada en{" "}
            <span className="text-accent">ciencia del aprendizaje</span>
          </h2>
          <p className="text-base sm:text-lg text-cool-gray leading-relaxed">
            No es un banco de preguntas. Es un sistema inteligente
            respaldado por investigación en aprendizaje adaptativo.
          </p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <div className="space-y-5 sm:space-y-6">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 100}>
                <PillarCard {...p} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={200}>
            <p
              className="text-sm font-semibold text-primary/80 mb-3
                text-center uppercase tracking-wide"
            >
              Verificación de bases en acción
            </p>
            <BrowserFrame>
              <GapDetectionMockup />
            </BrowserFrame>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  icon,
  title,
  text,
  citation,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  citation: string;
  color: "accent" | "primary" | "success" | "amber";
}) {
  const bgClass = {
    accent: "bg-accent/10",
    primary: "bg-primary/10",
    success: "bg-success/10",
    amber: "bg-amber-100",
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
        <p className="text-cool-gray text-xs sm:text-sm mt-0.5 max-w-md">
          {text}
        </p>
        <p className="text-[10px] sm:text-xs text-cool-gray/70 mt-1 italic">
          {citation}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function CheckBadgeIcon() {
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SearchIcon() {
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

function ShieldIcon() {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600"
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
