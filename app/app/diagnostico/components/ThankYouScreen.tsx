import Image from "next/image";
import Link from "next/link";

interface ThankYouScreenProps {
  hasEmail: boolean;
}

/**
 * Final thank you screen
 */
export function ThankYouScreen({ hasEmail }: ThankYouScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cream to-off-white">
      <div className="max-w-md w-full text-center">
        <div className="card p-8 sm:p-12">
          {/* Celebration icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6">
            <svg
              className="w-12 h-12 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-serif font-bold text-charcoal mb-4">
            ¡Increíble!
          </h2>

          {hasEmail ? (
            <>
              <p className="text-lg text-cool-gray mb-6">
                Tu diagnóstico está guardado. Te contactaremos muy pronto con tu
                plan de estudio personalizado.
              </p>
              <div className="p-4 bg-success/5 border border-success/20 rounded-xl mb-8">
                <p className="text-success font-medium flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Te avisaremos cuando tu plan esté listo
                </p>
              </div>
            </>
          ) : (
            <p className="text-lg text-cool-gray mb-8">
              Gracias por completar el diagnóstico. Vuelve pronto para crear tu
              cuenta y ver tu plan personalizado.
            </p>
          )}

          <div className="space-y-3">
            <Link
              href="/"
              className="btn-cta w-full py-4 text-lg inline-flex items-center justify-center"
            >
              Volver al Inicio
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>

            <p className="text-sm text-cool-gray">
              Esta experiencia fue solo el comienzo
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 flex items-center justify-center gap-3 text-cool-gray">
          <Image
            src="/logo-arbor.svg"
            alt="Arbor"
            width={24}
            height={24}
            className="opacity-50"
          />
          <span className="text-sm">
            Arbor PreU — Domina un concepto a la vez
          </span>
        </div>
      </div>
    </div>
  );
}
