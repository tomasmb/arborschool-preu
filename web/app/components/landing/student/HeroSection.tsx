/**
 * Hero section - headline + CTA, no filler
 */
import { LoadingButton } from "@/app/components/ui";

interface HeroSectionProps {
  onStartDiagnostic: () => void;
  onShowExample: () => void;
  isNavigating: boolean;
  ctaLabel: string;
  ctaSupportingText: string;
}

export function HeroSection({
  onStartDiagnostic,
  onShowExample,
  isNavigating,
  ctaLabel,
  ctaSupportingText,
}: HeroSectionProps) {
  return (
    <section className="relative pt-24 pb-10 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-off-white"></div>
      <div className="absolute top-20 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-charcoal mb-8 sm:mb-10">
            Empieza tu plan PAES con
            <span className="block text-accent mt-2">
              meta, diagnóstico y mini-clase.
            </span>
          </h1>

          <LoadingButton
            onClick={onStartDiagnostic}
            isLoading={isNavigating}
            loadingText="Cargando..."
            className="btn-cta text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 shadow-lg"
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

          <p className="text-sm text-cool-gray mt-4">{ctaSupportingText}</p>

          {/* Example Results Preview — more prominent */}
          <button
            onClick={onShowExample}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5
              rounded-full border border-primary/30 bg-white/80 backdrop-blur-sm
              text-sm font-medium text-primary hover:bg-white hover:border-primary/50
              hover:shadow-md transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
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
                d={
                  "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.955-.67 1.856-1.166 2.686" +
                  "M15.536 15.536A5.003 5.003 0 0112 17c-4.478 0-8.268-2.943-9.542-7a9.969 9.969 0 011.166-2.686"
                }
              />
            </svg>
            Ver cómo se ven los resultados →
          </button>
        </div>
      </div>
    </section>
  );
}
