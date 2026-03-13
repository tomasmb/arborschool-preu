"use client";

type UpgradePromptProps = {
  variant?: "card" | "inline";
};

/**
 * Prompt shown to free-tier users when they hit an access-gated feature.
 * "card" variant is a standalone section; "inline" replaces a CTA button.
 */
export function UpgradePrompt({ variant = "card" }: UpgradePromptProps) {
  if (variant === "inline") {
    return (
      <div
        className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60
          px-4 py-3 space-y-1.5"
      >
        <p className="text-sm font-medium text-amber-800">
          Has completado tu mini-clase gratuita
        </p>
        <p className="text-xs text-amber-700">
          Para seguir aprendiendo, solicita acceso completo a tu colegio o
          escríbenos a{" "}
          <a
            href="mailto:contacto@arbor.school"
            className="underline hover:text-amber-900"
          >
            contacto@arbor.school
          </a>
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          className="w-10 h-10 rounded-full bg-amber-100 flex items-center
            justify-center shrink-0"
        >
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </span>

        <div className="space-y-2">
          <h3 className="text-base font-serif font-semibold text-gray-900">
            Desbloquea todo tu potencial
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Has completado tu primera mini-clase gratuita. Para continuar
            aprendiendo con mini-clases ilimitadas, repasos espaciados y tests
            completos, necesitas acceso completo.
          </p>
          <div className="pt-1 space-y-1.5">
            <p className="text-sm font-medium text-gray-800">
              Pide acceso a tu colegio o escríbenos:
            </p>
            <a
              href="mailto:contacto@arbor.school"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              contacto@arbor.school
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
