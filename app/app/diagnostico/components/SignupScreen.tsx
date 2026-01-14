interface SignupScreenProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onSkip: () => void;
}

/**
 * Email signup screen to save results
 */
export function SignupScreen({
  email,
  onEmailChange,
  onSubmit,
  status,
  error,
  onSkip,
}: SignupScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cream to-off-white">
      <div className="max-w-md w-full">
        <div className="card p-8 sm:p-12 text-center">
          {/* Icon */}
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-serif font-bold text-charcoal mb-3">
            Guarda tus Resultados
          </h2>
          <p className="text-cool-gray mb-8">
            Ingresa tu email para guardar tu diagnóstico y recibir tu plan de
            estudio personalizado cuando esté listo.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-charcoal 
                placeholder:text-gray-400 focus:outline-none focus:border-accent focus:ring-4 
                focus:ring-accent/10 transition-all text-lg text-center"
              disabled={status === "loading"}
            />

            {error && (
              <p className="text-red-500 text-sm flex items-center justify-center gap-2">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!email || status === "loading"}
              className="btn-cta w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Guardando...
                </span>
              ) : (
                <>
                  Guardar y Notificarme
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          <button
            onClick={onSkip}
            className="mt-4 text-cool-gray hover:text-charcoal transition-colors text-sm"
          >
            Continuar sin guardar
          </button>
        </div>
      </div>
    </div>
  );
}
