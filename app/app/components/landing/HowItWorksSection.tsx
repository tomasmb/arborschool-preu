/**
 * How it works section - 3 step process overview
 */
export function HowItWorksSection() {
  return (
    <section className="py-24 bg-off-white relative">
      <div className="absolute inset-0 dot-pattern"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-16 text-center">
          Así funciona
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <StepCard
            number={1}
            title="Diagnóstico Rápido"
            description="16 preguntas, ~15 min. Mapeamos más de 200 conceptos."
            variant="primary"
          />
          <StepCard
            number={2}
            title="Tu Ruta Personalizada"
            description="Ordenado por impacto en tu puntaje. Primero lo que más importa."
            variant="primary"
          />
          <StepCard
            number={3}
            title="Aprende y Domina"
            description="Ejemplo resuelto, práctica activa, dominio demostrado."
            variant="accent"
          />
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
      <div className="card p-8 h-full">
        <div
          className={`w-14 h-14 rounded-2xl ${gradientClass} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
        >
          <span className="text-2xl font-bold text-white">{number}</span>
        </div>
        <h3 className="text-2xl font-serif font-bold text-charcoal mb-3">
          {title}
        </h3>
        <p className="text-cool-gray text-lg leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
