import { ROUTE_NAMES, type Route } from "@/lib/diagnostic/config";

interface TransitionScreenProps {
  r1Correct: number;
  route: Route;
  onContinue: () => void;
}

/**
 * Transition screen between Stage 1 and Stage 2
 */
export function TransitionScreen({
  r1Correct,
  route,
  onContinue,
}: TransitionScreenProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="card p-8 sm:p-12 text-center">
          {/* Success icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
            <svg
              className="w-10 h-10 text-success"
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
          </div>

          <h2 className="text-2xl font-serif font-bold text-charcoal mb-3">
            ¡Primera Etapa Completada!
          </h2>
          <p className="text-cool-gray mb-8">
            Hemos calibrado tu nivel de habilidad para personalizar las
            siguientes preguntas.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-off-white">
              <div className="text-3xl font-bold text-primary">
                {r1Correct}/8
              </div>
              <div className="text-sm text-cool-gray">Correctas</div>
            </div>
            <div className="p-4 rounded-xl bg-accent/10">
              <div className="text-2xl font-bold text-accent">
                {ROUTE_NAMES[route]}
              </div>
              <div className="text-sm text-cool-gray">Tu nivel</div>
            </div>
          </div>

          <p className="text-sm text-cool-gray mb-8">
            Ahora verás <strong>8 preguntas adaptadas</strong> a tu desempeño
            para obtener un diagnóstico más preciso.
          </p>

          <button onClick={onContinue} className="btn-cta w-full py-4 text-lg">
            Continuar
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
