/**
 * Final CTA section - bottom of the landing page
 */
import { LoadingButton } from "@/app/components/ui";

interface CtaSectionProps {
  onStartDiagnostic: () => void;
  isNavigating: boolean;
}

export function CtaSection({
  onStartDiagnostic,
  isNavigating,
}: CtaSectionProps) {
  return (
    <section id="cta" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px] bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-6">
          Descubre tu nivel real
        </h2>
        <p className="text-xl text-cool-gray mb-10">
          En 15 minutos sabrás tu puntaje, qué dominas, y qué estudiar
          primero.
        </p>

        <LoadingButton
          onClick={onStartDiagnostic}
          isLoading={isNavigating}
          loadingText="Cargando..."
          className="btn-cta px-10 py-5 text-lg shadow-lg mb-4"
        >
          Descubrir lo que me falta
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
        <p className="text-cool-gray text-sm">
          16 preguntas · ~15 min · Puntaje inmediato
        </p>
      </div>
    </section>
  );
}
