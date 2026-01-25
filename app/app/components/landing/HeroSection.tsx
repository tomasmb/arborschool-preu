import { LoadingButton } from "@/app/components/ui";

interface HeroSectionProps {
  onStartDiagnostic: () => void;
  onShowExample: () => void;
  isNavigating: boolean;
}

export function HeroSection({
  onStartDiagnostic,
  onShowExample,
  isNavigating,
}: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-off-white"></div>
      <div className="absolute top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse-subtle"></span>
            Diagnóstico PAES M1 disponible
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-charcoal mb-8">
            Alcanza tu puntaje PAES
            <span className="block text-accent mt-2">
              dominando un concepto a la vez
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-cool-gray max-w-2xl mx-auto mb-12 leading-relaxed">
            No más horas perdidas. Te enseñamos exactamente lo que te falta y no
            avanzas hasta que lo domines.
          </p>

          <LoadingButton
            onClick={onStartDiagnostic}
            isLoading={isNavigating}
            loadingText="Cargando..."
            className="btn-cta text-lg px-10 py-5 shadow-lg"
          >
            Descubrir mi Puntaje
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
          </LoadingButton>

          <p className="text-sm text-cool-gray mt-4">
            16 preguntas · ~15 min · Puntaje inmediato
          </p>

          {/* Example Results Preview Link */}
          <button
            onClick={onShowExample}
            className="mt-4 text-sm text-primary hover:text-primary-light transition-colors 
              inline-flex items-center gap-1 underline underline-offset-4"
          >
            Ver ejemplo de resultados
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.955-.67 1.856-1.166 2.686M15.536 15.536A5.003 5.003 0 0112 17c-4.478 0-8.268-2.943-9.542-7a9.969 9.969 0 011.166-2.686"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
