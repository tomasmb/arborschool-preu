/**
 * Final CTA section - bottom of the landing page
 */
import { LoadingButton } from "@/app/components/ui";
import { ScrollReveal } from "./ScrollReveal";

interface CtaSectionProps {
  onStartDiagnostic: () => void;
  isNavigating: boolean;
  ctaLabel: string;
  ctaSupportingText: string;
}

export function CtaSection({
  onStartDiagnostic,
  isNavigating,
  ctaLabel,
  ctaSupportingText,
}: CtaSectionProps) {
  return (
    <section
      id="cta"
      className="py-16 sm:py-24 bg-white relative overflow-hidden"
    >
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]
          sm:w-[600px] sm:h-[300px] lg:w-[800px] lg:h-[400px]
          bg-accent/10 rounded-full blur-3xl`}
      />

      <ScrollReveal className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-6">
          Tu siguiente paso está en el portal
        </h2>
        <p className="text-xl text-cool-gray mb-10">
          Haz una acción concreta ahora y sigue avanzando con foco.
        </p>

        <LoadingButton
          onClick={onStartDiagnostic}
          isLoading={isNavigating}
          loadingText="Cargando..."
          className="btn-cta px-10 py-5 text-lg shadow-lg mb-4"
        >
          {ctaLabel}
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
        <p className="text-cool-gray text-sm">{ctaSupportingText}</p>
      </ScrollReveal>
    </section>
  );
}
