"use client";

// ============================================================================
// TYPES
// ============================================================================

interface TimeUpModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Number of questions answered before time expired */
  answeredCount: number;
  /** Total number of questions in the test */
  totalQuestions: number;
  /** Handler for "Ver Resultados" button */
  onViewResults: () => void;
  /** Handler for "Continuar Diagnóstico" button */
  onContinue: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Modal shown when the timer expires during the test.
 * Informs the user that their score is locked and gives them the option to
 * continue answering for diagnostic purposes or view their results.
 */
export function TimeUpModal({
  isOpen,
  answeredCount,
  totalQuestions,
  onViewResults,
  onContinue,
}: TimeUpModalProps) {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-up-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fadeIn"
      >
        {/* Clock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2
          id="time-up-title"
          className="text-xl sm:text-2xl font-serif font-bold text-charcoal text-center mb-2"
        >
          ¡Se acabó el tiempo!
        </h2>

        {/* Description */}
        <p className="text-cool-gray text-center mb-4">
          Respondiste <strong className="text-charcoal">{answeredCount}</strong>{" "}
          de {totalQuestions} preguntas.
          {unansweredCount > 0 && (
            <>
              {" "}
              Las{" "}
              <strong className="text-charcoal">
                {unansweredCount} restantes
              </strong>{" "}
              se contarán como omitidas en tu puntaje.
            </>
          )}
        </p>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tu puntaje ya está calculado</strong> con las{" "}
            {answeredCount} respuestas que alcanzaste a enviar.
          </p>
          {unansweredCount > 0 && (
            <p className="text-sm text-blue-700 mt-2">
              Si quieres, puedes seguir respondiendo para que podamos conocer
              mejor tus áreas de mejora. Estas respuestas adicionales{" "}
              <strong>no afectarán tu puntaje</strong>.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {unansweredCount > 0 && (
            <button
              onClick={onContinue}
              className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-xl 
                       hover:bg-primary-dark transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Continuar diagnóstico
              <span className="text-sm font-normal opacity-80 ml-1">
                ({unansweredCount} restantes)
              </span>
            </button>
          )}
          <button
            onClick={onViewResults}
            className={`w-full px-6 py-3 font-semibold rounded-xl transition-colors 
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${
                        unansweredCount > 0
                          ? "bg-gray-100 text-charcoal hover:bg-gray-200 focus:ring-gray-300"
                          : "bg-primary text-white hover:bg-primary-dark focus:ring-primary"
                      }`}
          >
            Ver mis resultados
          </button>
        </div>
      </div>
    </div>
  );
}
