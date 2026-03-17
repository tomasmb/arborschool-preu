"use client";

/**
 * Horizontal carousel showing real-ish app screens inside BrowserFrames.
 * Pure CSS scroll-snap — no JS carousel library needed.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { ScrollReveal } from "./ScrollReveal";
import {
  DiagnosticMockup,
  ResultsMockup,
  MiniClaseMockup,
  GapDetectionMockup,
  ProgressDashboardMockup,
} from "./MockupScreens";

interface Slide {
  title: string;
  caption: string;
  content: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: "Diagnóstico adaptativo",
    caption:
      "16 preguntas que se adaptan al nivel del alumno. " +
      "Rango PAES estimado en menos de 30 minutos.",
    content: (
      <DiagnosticMockup
        progress="8/16"
        question="¿Cuál es el valor de x si 3x - 7 = 2x + 5?"
        options={["A) 12", "B) -2", "C) 2", "D) -12"]}
        progressPct={50}
      />
    ),
  },
  {
    title: "Resultados del diagnóstico",
    caption:
      "Rango de puntaje, desglose por eje, y rutas de " +
      "aprendizaje priorizadas por impacto.",
    content: <ResultsMockup />,
  },
  {
    title: "Mini-clase con preguntas adaptativas",
    caption:
      "Contenido + preguntas que escalan de fácil a difícil. " +
      "Feedback inmediato en cada respuesta.",
    content: <MiniClaseMockup />,
  },
  {
    title: "Detección de vacíos",
    caption:
      "Cuando un alumno falla, el sistema encuentra el " +
      "prerequisito exacto que le falta.",
    content: <GapDetectionMockup />,
  },
  {
    title: "Dashboard de progreso",
    caption:
      "Conceptos dominados, puntaje proyectado y misión " +
      "semanal — todo en un solo lugar.",
    content: <ProgressDashboardMockup />,
  },
];

export function AppScreensCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const updateActive = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth * 0.85;
    const idx = Math.round(el.scrollLeft / slideWidth);
    setActive(Math.min(idx, SLIDES.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateActive, { passive: true });
    return () => el.removeEventListener("scroll", updateActive);
  }, [updateActive]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth * 0.85;
    el.scrollTo({ left: slideWidth * idx, behavior: "smooth" });
  };

  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4"
          >
            La plataforma{" "}
            <span className="text-accent">por dentro</span>
          </h2>
          <p
            className="text-base sm:text-lg text-cool-gray
              max-w-2xl mx-auto"
          >
            Pantallas reales de lo que tus alumnos ven cuando estudian
            con Arbor.
          </p>
        </ScrollReveal>
      </div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory
          scroll-smooth pb-6 px-[7.5%] no-scrollbar"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            className="snap-center shrink-0 w-[85%] sm:w-[70%] lg:w-[55%]"
          >
            <ScrollReveal delay={i * 80}>
              <BrowserFrame>{slide.content}</BrowserFrame>
              <div className="mt-4 text-center px-2">
                <p
                  className="text-sm sm:text-base font-semibold
                    text-charcoal"
                >
                  {slide.title}
                </p>
                <p className="text-xs sm:text-sm text-cool-gray mt-1">
                  {slide.caption}
                </p>
              </div>
            </ScrollReveal>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            onClick={() => scrollTo(i)}
            aria-label={`Ver ${s.title}`}
            className={`w-2.5 h-2.5 rounded-full transition-all
              duration-300 ${
                i === active
                  ? "bg-primary w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>
    </section>
  );
}
