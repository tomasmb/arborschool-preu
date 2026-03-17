/**
 * Problem section — PAES equity gap narrative with real Chilean data.
 * Emotional hook for school directors: the gap is real, and Arbor
 * can help close it.
 */
import { ScrollReveal } from "./ScrollReveal";

const GAP_STATS = [
  {
    value: "7×",
    description:
      "más probabilidad de estar en el top 10% para alumnos " +
      "de colegios particulares pagados",
  },
  {
    value: "1/100",
    description:
      "de los mejores colegios en el ranking PAES es público",
  },
  {
    value: "161 pts",
    description:
      "de diferencia entre el decil socioeconómico más alto y más bajo",
  },
] as const;

export function ProblemSection() {
  return (
    <section className="py-16 sm:py-24 bg-off-white relative">
      <div className="absolute inset-0 dot-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-serif
              font-bold text-charcoal mb-4 sm:mb-6"
          >
            La brecha PAES{" "}
            <span className="text-accent">no es inevitable</span>
          </h2>
          <p className="text-base sm:text-lg text-cool-gray leading-relaxed">
            Los datos de admisión 2026 confirman una desigualdad
            estructural en resultados PAES. La preparación personalizada
            ya no puede depender del poder adquisitivo de cada familia.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {GAP_STATS.map((stat, i) => (
            <ScrollReveal key={stat.value} delay={i * 120}>
              <div className="card p-6 sm:p-8 h-full text-center">
                <p
                  className="text-4xl sm:text-5xl font-bold text-accent
                    mb-3"
                >
                  {stat.value}
                </p>
                <p className="text-cool-gray text-sm sm:text-base leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div
            className="max-w-3xl mx-auto bg-white rounded-2xl
              border border-primary/20 p-6 sm:p-8 text-center"
          >
            <p className="text-lg sm:text-xl text-charcoal font-medium leading-relaxed">
              Arbor da a cada alumno un{" "}
              <span className="text-primary font-semibold">
                tutor adaptativo
              </span>{" "}
              que detecta exactamente qué le falta y lo lleva paso a paso
              hacia su meta — sin importar su punto de partida.
            </p>
            <p className="text-xs text-cool-gray mt-4">
              Datos PAES Admisión 2026 — DEMRE / Acción Educar
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
