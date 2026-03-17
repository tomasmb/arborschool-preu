/**
 * How it works section - 3 step process overview
 */
import { ScrollReveal } from "../ScrollReveal";

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 bg-off-white relative">
      <div className="absolute inset-0 dot-pattern"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-10 sm:mb-16 text-center">
            Así funciona
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          <ScrollReveal delay={0}>
            <StepCard
              number={1}
              title="Define tu meta"
              description="Elige carrera y puntaje objetivo para saber exactamente cuánto necesitas mejorar."
              variant="primary"
            />
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <StepCard
              number={2}
              title="Completa diagnóstico M1"
              description="Responde 16 preguntas adaptativas (~15 min) y obtiene tu rango estimado con evidencia."
              variant="primary"
            />
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <StepCard
              number={3}
              title="Estudia con tu misión semanal"
              description="Arbor prioriza tu siguiente mini-clase por impacto. Cumple tu misión semanal y mueve tu puntaje paso a paso."
              variant="accent"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
  variant,
}: {
  number: number;
  title: string;
  description: string;
  variant: "primary" | "accent";
}) {
  const gradientClass =
    variant === "primary"
      ? "bg-gradient-to-br from-primary to-primary-light"
      : "bg-gradient-to-br from-accent to-accent-light";

  return (
    <div className="relative group">
      <div className="card p-6 sm:p-8 h-full">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${gradientClass}
            flex items-center justify-center mb-4 sm:mb-6 shadow-lg
            group-hover:scale-110 transition-transform`}
        >
          <span className="text-xl sm:text-2xl font-bold text-white">
            {number}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-charcoal mb-2 sm:mb-3">
          {title}
        </h3>
        <p className="text-cool-gray text-base sm:text-lg leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
