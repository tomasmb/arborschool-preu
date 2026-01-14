"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WelcomeScreenProps {
  onStart: () => void;
}

// ============================================================================
// INFO CARD COMPONENT
// ============================================================================

function InfoCard({
  value,
  label,
  isAccent = false,
  delay,
}: {
  value: string;
  label: string;
  isAccent?: boolean;
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`text-center p-5 rounded-xl transition-all duration-500 transform
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${isAccent ? "bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20" : "bg-gradient-to-br from-off-white to-white border border-gray-100"}`}
    >
      <div
        className={`text-3xl font-bold mb-1 ${isAccent ? "text-accent" : "text-primary"}`}
      >
        {value}
      </div>
      <div className="text-sm text-cool-gray font-medium">{label}</div>
    </div>
  );
}

// ============================================================================
// TIP ITEM COMPONENT
// ============================================================================

function TipItem({ text, delay }: { text: string; delay: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <li
      className={`flex items-start gap-3 transition-all duration-500 transform
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
    >
      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-accent to-accent-light mt-2 shrink-0 shadow-sm" />
      <span className="text-cool-gray">{text}</span>
    </li>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorations - matching landing page */}
      <div className="fixed inset-0 bg-gradient-to-b from-white via-cream to-off-white" />
      <div className="fixed top-10 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-0 w-64 h-64 bg-success/5 rounded-full blur-3xl" />

      {/* Dot pattern overlay */}
      <div className="fixed inset-0 dot-pattern opacity-50" />

      <div className="relative z-10 max-w-2xl w-full">
        {/* Logo */}
        <div
          className={`text-center mb-8 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
            <Image src="/logo-arbor.svg" alt="Arbor" width={40} height={40} />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </div>

        {/* Main card */}
        <div
          className={`card p-8 sm:p-12 backdrop-blur-sm bg-white/90 transition-all duration-700 delay-100
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-10">
            {/* Icon with glow effect */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
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
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-4">
              Prueba Diagnóstica PAES M1
            </h1>
            <p className="text-lg text-cool-gray max-w-md mx-auto leading-relaxed">
              Descubre tu nivel actual y qué necesitas aprender para alcanzar tu
              puntaje meta.
            </p>
          </div>

          {/* Info cards with staggered animation */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <InfoCard value="16" label="Preguntas" delay={300} />
            <InfoCard value="30" label="Minutos" delay={400} />
            <InfoCard value="∞" label="Valor" isAccent delay={500} />
          </div>

          {/* Tips section */}
          <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-xl p-6 mb-10">
            <h3 className="font-bold text-charcoal mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-accent"
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
              </div>
              Para un diagnóstico preciso
            </h3>
            <ul className="space-y-3">
              <TipItem
                text="Responde con honestidad — no hay nota, solo descubrimiento"
                delay={600}
              />
              <TipItem
                text='Si no sabes la respuesta, usa el botón "No lo sé"'
                delay={700}
              />
              <TipItem
                text="No puedes volver atrás — confía en tu primera intuición"
                delay={800}
              />
            </ul>
          </div>

          {/* Start button with enhanced styling */}
          <button
            onClick={onStart}
            className="btn-cta w-full py-5 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Comenzar Diagnóstico
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
          </button>
        </div>

        {/* Footer note */}
        <p
          className={`text-center text-sm text-cool-gray mt-6 transition-all duration-700 delay-500
            ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          Tu diagnóstico se guarda automáticamente al final
        </p>
      </div>
    </div>
  );
}
