/**
 * B2B Hero — institutional headline, stat bar, dual CTAs.
 * Targets school directors / coordinators visiting the homepage.
 */
import { ScrollReveal } from "./ScrollReveal";

interface HeroSectionProps {
  onRequestDemo: () => void;
  onViewPlatform: () => void;
}

const STATS = [
  { value: "229", label: "conceptos" },
  { value: "4", label: "ejes PAES" },
  { value: "202", label: "preguntas oficiales" },
] as const;

export function HeroSection({
  onRequestDemo,
  onViewPlatform,
}: HeroSectionProps) {
  return (
    <section className="relative pt-24 pb-14 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-off-white" />
      <div
        className="absolute top-20 left-1/4 w-48 h-48
          sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10
          rounded-full blur-3xl"
      />
      <div
        className="absolute bottom-0 right-1/4 w-40 h-40
          sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10
          rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-4xl mx-auto">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl
              font-serif font-bold tracking-tight text-charcoal
              mb-6 sm:mb-8"
          >
            Preparación PAES adaptativa
            <span className="block text-accent mt-2">
              para cada alumno de tu colegio
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl text-cool-gray max-w-2xl
              mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Diagnóstico en menos de 30 minutos. Rutas personalizadas por alumno.
            Seguimiento en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onRequestDemo}
              className="btn-cta text-base sm:text-lg px-8 sm:px-10
                py-4 sm:py-5 shadow-lg"
            >
              Solicitar una demo
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <button
              onClick={onViewPlatform}
              className="inline-flex items-center gap-2 px-6 py-4
                rounded-xl border border-primary/30 bg-white/80
                backdrop-blur-sm text-base font-medium text-primary
                hover:bg-white hover:border-primary/50 hover:shadow-md
                transition-all duration-200"
            >
              Ver la plataforma
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </ScrollReveal>

        {/* Stat bar */}
        <ScrollReveal delay={200}>
          <div
            className="mt-14 sm:mt-16 flex flex-wrap items-center
              justify-center gap-6 sm:gap-10"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6 sm:gap-10">
                {i > 0 && (
                  <div className="w-px h-8 bg-gray-200 hidden sm:block" />
                )}
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-charcoal">
                    {s.value}
                  </p>
                  <p className="text-xs sm:text-sm text-cool-gray mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="w-px h-8 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <p
                  className="text-sm sm:text-base font-semibold
                    text-primary"
                >
                  Basado en ciencia
                </p>
                <p className="text-xs sm:text-sm text-cool-gray mt-0.5">
                  del aprendizaje
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
