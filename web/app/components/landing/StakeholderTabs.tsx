"use client";

/**
 * Stakeholder Tabs — addresses the multi-buyer problem.
 * School directors, academic coordinators, and teachers each
 * see messaging tailored to their concerns.
 */
import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

interface Tab {
  id: string;
  label: string;
  headline: string;
  bullets: string[];
}

const TABS: Tab[] = [
  {
    id: "directors",
    label: "Directores",
    headline:
      "Preparación PAES personalizada sin depender de preuniversitarios externos",
    bullets: [
      "Cada alumno recibe su propia ruta de aprendizaje adaptativa según sus vacíos.",
      "Acceso gestionado por dominio de email institucional — alta masiva sin fricciones.",
      "Herramienta de equidad: cierra la brecha de preparación dentro de tu propia cohorte.",
    ],
  },
  {
    id: "coordinators",
    label: "Coordinadores Académicos",
    headline:
      "Implementación simple, cobertura curricular completa",
    bullets: [
      "Alineado al temario DEMRE. 83% de cobertura de conceptos en el diagnóstico.",
      "Implementación en un día — los alumnos solo necesitan un navegador.",
      "205 conceptos organizados por eje y prerequisitos. Sin duplicar trabajo con tu planificación.",
    ],
  },
  {
    id: "teachers",
    label: "Profesores",
    headline:
      "El sistema hace el refuerzo individualizado por ti",
    bullets: [
      "Cada alumno estudia exactamente lo que le falta — la detección de vacíos redirige su ruta automáticamente.",
      "Mini-clases con ejemplos resueltos y preguntas adaptativas que escalan de fácil a difícil.",
      "Repaso espaciado automático: el sistema programa repasos según la calidad de dominio de cada alumno.",
    ],
  },
];

export function StakeholderTabs() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === activeId) ?? TABS[0];

  return (
    <section className="py-16 sm:py-24 bg-off-white relative">
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4"
          >
            Diseñado para{" "}
            <span className="text-accent">cada rol</span>
          </h2>
          <p className="text-base sm:text-lg text-cool-gray max-w-2xl mx-auto">
            Directores, coordinadores y profesores obtienen lo que
            necesitan de Arbor.
          </p>
        </ScrollReveal>

        {/* Tab selector */}
        <ScrollReveal>
          <div
            className="flex justify-center mb-8 sm:mb-10 bg-white
              rounded-xl p-1.5 max-w-md mx-auto shadow-sm
              border border-gray-100"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveId(tab.id)}
                className={`flex-1 text-sm font-medium py-2.5 px-3
                  rounded-lg transition-all duration-200
                  ${
                    activeId === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-cool-gray hover:text-charcoal"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Active tab content */}
        <ScrollReveal>
          <div
            className="max-w-2xl mx-auto bg-white rounded-2xl
              p-6 sm:p-8 shadow-sm border border-gray-100"
          >
            <h3
              className="text-xl sm:text-2xl font-serif font-bold
                text-charcoal mb-5"
            >
              {activeTab.headline}
            </h3>
            <ul className="space-y-3">
              {activeTab.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-accent shrink-0 mt-0.5"
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
                  <span className="text-cool-gray text-sm sm:text-base leading-relaxed">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
