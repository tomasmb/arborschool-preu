export function HowItWorksSection() {
  return (
    <section className="py-24 bg-off-white relative">
      <div className="absolute inset-0 dot-pattern"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal mb-6">
            Así funciona
          </h2>
          <p className="text-xl text-cool-gray max-w-2xl mx-auto">
            Un método probado para maximizar tu puntaje en el menor tiempo
            posible
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <StepCard
            number={1}
            title="Diagnóstico"
            description="En minutos descubrimos qué conceptos ya dominas y cuáles te faltan. Sin rodeos."
            variant="primary"
          />
          <StepCard
            number={2}
            title="Plan Inteligente"
            description="Tu plan prioriza lo que más impacta tu puntaje, ordenado para que nunca te falten los conocimientos previos."
            variant="primary"
          />
          <StepCard
            number={3}
            title="Aprende y Domina"
            description="Cada mini-clase tiene ejemplos resueltos y práctica adaptativa. Solo avanzas cuando demuestras que lo dominaste."
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
        <h3 className="text-2xl font-serif font-bold text-charcoal mb-4">
          {title}
        </h3>
        <p className="text-cool-gray text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
