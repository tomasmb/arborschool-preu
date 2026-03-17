/**
 * Product tour — how Arbor works, framed for school decision-makers.
 * Three steps: diagnostic, personalized routes, real-time tracking.
 * Each step includes a BrowserFrame mockup.
 */
import { BrowserFrame } from "./BrowserFrame";
import { ScrollReveal } from "./ScrollReveal";
import {
  DiagnosticMockup,
  LearningPathMockup,
  ProgressDashboardMockup,
} from "./MockupScreens";

const STEPS = [
  {
    number: 1,
    title: "Diagnóstico adaptativo",
    description:
      "Despliega un diagnóstico de 16 preguntas a toda tu cohorte. " +
      "En menos de 30 minutos cada alumno tiene un rango PAES estimado y un " +
      "mapa de vacíos por eje.",
    variant: "primary" as const,
    mockup: <DiagnosticMockup />,
  },
  {
    number: 2,
    title: "Rutas personalizadas",
    description:
      "Cada alumno recibe su propia secuencia de mini-clases, " +
      "optimizada para maximizar preguntas PAES desbloqueadas " +
      "con el menor esfuerzo.",
    variant: "primary" as const,
    mockup: <LearningPathMockup />,
  },
  {
    number: 3,
    title: "Seguimiento en tiempo real",
    description:
      "Visualiza el avance de cada alumno: conceptos dominados, " +
      "puntaje proyectado y misión semanal — todo en un solo lugar.",
    variant: "accent" as const,
    mockup: <ProgressDashboardMockup />,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="plataforma"
      className="py-16 sm:py-24 bg-white relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4 sm:mb-6 text-center"
          >
            Así funciona para tu colegio
          </h2>
          <p
            className="text-base sm:text-lg text-cool-gray text-center
              max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            Implementación en un día. Los alumnos solo necesitan un
            navegador.
          </p>
        </ScrollReveal>

        <div className="space-y-16 sm:space-y-24">
          {STEPS.map((step, i) => {
            const isReversed = i % 2 === 1;
            return (
              <ScrollReveal key={step.number} delay={i * 100}>
                <div
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-16
                    items-center ${isReversed ? "lg:direction-rtl" : ""}`}
                >
                  <div
                    className={`text-center lg:text-left
                      ${isReversed ? "lg:order-2" : ""}`}
                  >
                    <StepBadge
                      number={step.number}
                      variant={step.variant}
                    />
                    <h3
                      className="text-2xl sm:text-3xl font-serif
                        font-bold text-charcoal mb-3 sm:mb-4"
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-cool-gray text-base sm:text-lg
                        leading-relaxed max-w-lg mx-auto lg:mx-0"
                    >
                      {step.description}
                    </p>
                  </div>
                  <div className={isReversed ? "lg:order-1" : ""}>
                    <BrowserFrame>{step.mockup}</BrowserFrame>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepBadge({
  number,
  variant,
}: {
  number: number;
  variant: "primary" | "accent";
}) {
  const bg =
    variant === "primary"
      ? "bg-gradient-to-br from-primary to-primary-light"
      : "bg-gradient-to-br from-accent to-accent-light";

  return (
    <div
      className={`inline-flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl
        ${bg} items-center justify-center mb-4 shadow-lg`}
    >
      <span className="text-lg sm:text-xl font-bold text-white">
        {number}
      </span>
    </div>
  );
}
