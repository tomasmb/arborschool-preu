import Image from "next/image";

interface WelcomeScreenProps {
  onStart: () => void;
}

/**
 * Welcome screen with test overview and instructions
 */
export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <Image src="/logo-arbor.svg" alt="Arbor" width={48} height={48} />
            <span className="text-2xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="card p-8 sm:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
              <svg
                className="w-10 h-10 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-4">
              Prueba Diagnóstica PAES M1
            </h1>
            <p className="text-lg text-cool-gray max-w-md mx-auto">
              Descubre tu nivel actual y qué necesitas aprender para alcanzar tu
              puntaje meta.
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="text-center p-4 rounded-xl bg-off-white">
              <div className="text-3xl font-bold text-primary mb-1">16</div>
              <div className="text-sm text-cool-gray">Preguntas</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-off-white">
              <div className="text-3xl font-bold text-primary mb-1">30</div>
              <div className="text-sm text-cool-gray">Minutos</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-off-white">
              <div className="text-3xl font-bold text-accent mb-1">∞</div>
              <div className="text-sm text-cool-gray">Valor</div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-10">
            <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Para un diagnóstico preciso
            </h3>
            <ul className="space-y-3 text-cool-gray">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>
                  Responde con honestidad — no hay nota, solo descubrimiento
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>
                  Si no sabes la respuesta, usa el botón &ldquo;No lo sé&rdquo;
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>
                  No puedes volver atrás — confía en tu primera intuición
                </span>
              </li>
            </ul>
          </div>

          {/* Start button */}
          <button onClick={onStart} className="btn-cta w-full py-5 text-lg">
            Comenzar Diagnóstico
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
        </div>
      </div>
    </div>
  );
}
