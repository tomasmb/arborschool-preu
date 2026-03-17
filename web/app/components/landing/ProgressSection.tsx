/**
 * Institutional Value section — what the school gets.
 * 6-card grid highlighting concrete benefits for school buyers.
 */
import { ScrollReveal } from "./ScrollReveal";

const VALUE_CARDS = [
  {
    icon: <ClipboardIcon />,
    title: "Diagnóstico base para toda la cohorte",
    text: "Rango PAES por alumno en menos de 30 minutos. Sin preparación previa.",
  },
  {
    icon: <RouteIcon />,
    title: "Rutas individualizadas",
    text: "205 conceptos organizados en un grafo de prerequisitos. Cada alumno sigue su propio camino.",
  },
  {
    icon: <ChartIcon />,
    title: "Progreso visible por alumno",
    text: "Cada alumno ve sus conceptos dominados, puntaje demostrado y misión semanal en su dashboard.",
  },
  {
    icon: <GridIcon />,
    title: "Cobertura PAES completa",
    text: "4 ejes (ALG, NUM, GEO, PROB) y 4 habilidades (RES, MOD, REP, ARG).",
  },
  {
    icon: <KeyIcon />,
    title: "Gestión de acceso",
    text: "Alta masiva por dominio institucional de email. Sin configuración compleja.",
  },
  {
    icon: <LockIcon />,
    title: "Privacidad de datos",
    text: "Datos almacenados de forma segura. No se comparten con terceros ni se usan para entrenar IA.",
  },
] as const;

export function ProgressSection() {
  return (
    <section className="py-16 sm:py-24 section-navy relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-5" />
      <div
        className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72
          lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-white mb-4 sm:mb-6"
          >
            Lo que tu colegio{" "}
            <span className="text-accent">obtiene</span>
          </h2>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Todo lo que necesitas para ofrecer preparación PAES
            personalizada a escala institucional.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {VALUE_CARDS.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 80}>
              <div
                className="bg-white/10 backdrop-blur-sm rounded-2xl
                  p-5 sm:p-6 border border-white/15 h-full
                  hover:bg-white/15 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl bg-accent/20
                    flex items-center justify-center mb-4"
                >
                  {card.icon}
                </div>
                <h3
                  className="text-white font-semibold text-sm
                    sm:text-base mb-2"
                >
                  {card.title}
                </h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  {card.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function ClipboardIcon() {
  return (
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
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
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function GridIcon() {
  return (
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
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
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
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
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}
