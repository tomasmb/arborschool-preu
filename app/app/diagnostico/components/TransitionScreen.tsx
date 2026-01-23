"use client";

import { useState, useEffect } from "react";
import { ROUTE_NAMES, type Route } from "@/lib/diagnostic/config";
import { Confetti } from "./Confetti";
import { LoadingButton } from "@/app/components/ui";

interface TransitionScreenProps {
  r1Correct: number;
  route: Route;
  onContinue: () => void | Promise<void>;
}

// ============================================================================
// ANIMATED STAT CARD
// ============================================================================

function StatCard({
  value,
  label,
  isPrimary = false,
  delay,
}: {
  value: string;
  label: string;
  isPrimary?: boolean;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`p-5 rounded-xl transition-all duration-500 transform min-h-[100px] flex flex-col justify-center
        ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}
        ${isPrimary ? "bg-gradient-to-br from-accent/20 to-accent/10 border-2 border-accent/30 shadow-lg" : "bg-gradient-to-br from-off-white to-white border border-gray-100"}`}
    >
      <div
        className={`text-xl sm:text-2xl font-bold mb-1 leading-tight break-words ${isPrimary ? "text-accent" : "text-primary"}`}
      >
        {value}
      </div>
      <div className="text-sm text-cool-gray font-medium">{label}</div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TransitionScreen({
  r1Correct,
  route,
  onContinue,
}: TransitionScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const timer = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    setIsContinuing(true);
    try {
      await onContinue();
    } catch (error) {
      setIsContinuing(false);
      throw error;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-gradient-to-b from-cream to-off-white" />
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-success/10 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg w-full">
        <div
          className={`card p-8 sm:p-12 text-center backdrop-blur-sm bg-white/90 relative overflow-hidden
            transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Mini confetti animation */}
          {showConfetti && (
            <Confetti variant="mini" duration={2500} particleCount={40} />
          )}

          {/* Success icon with animation */}
          <div className="relative inline-block mb-6">
            <div
              className={`absolute inset-0 bg-success/20 rounded-full blur-xl transition-all duration-1000
                ${isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
            />
            <div
              className={`relative inline-flex items-center justify-center w-20 h-20 rounded-full 
                bg-gradient-to-br from-success/20 to-success/10 border border-success/20
                transition-all duration-500 ${isLoaded ? "scale-100" : "scale-0"}`}
            >
              <svg
                className={`w-10 h-10 text-success transition-all duration-700 delay-300
                  ${isLoaded ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
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
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3 transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            ¡Primera Etapa Completada!
          </h2>
          <p
            className={`text-cool-gray mb-8 transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Hemos calibrado tu nivel de habilidad para personalizar las
            siguientes preguntas.
          </p>

          {/* Stats with staggered animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard value={`${r1Correct}/8`} label="Correctas" delay={500} />
            <StatCard
              value={ROUTE_NAMES[route]}
              label="Tu nivel"
              isPrimary
              delay={650}
            />
          </div>

          <p
            className={`text-sm text-cool-gray mb-8 transition-all duration-700 delay-700
              ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            Ahora verás{" "}
            <strong className="text-charcoal">8 preguntas adaptadas</strong> a
            tu desempeño para obtener un diagnóstico más preciso.
          </p>

          <LoadingButton
            onClick={handleContinue}
            isLoading={isContinuing}
            loadingText="Cargando..."
            className={`btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-500 delay-800
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Continuar
            <svg
              className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
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
        </div>
      </div>
    </div>
  );
}
