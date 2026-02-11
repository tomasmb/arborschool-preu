/**
 * Progress section - dark navy section showing progress tracking
 */
export function ProgressSection() {
  return (
    <section className="py-24 section-navy relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
              Horas de estudio inteligente,{" "}
              <span className="text-accent">no meses en un preu</span>
            </h2>
            <p className="text-xl text-white/70 leading-relaxed">
              Sabes exactamente dónde estás, cuánto te falta, y qué
              estudiar para mover tu puntaje lo más rápido posible.
            </p>
          </div>

          <ProgressCard />
        </div>
      </div>
    </section>
  );
}

function ProgressCard() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      <h3 className="text-xl font-serif font-bold text-white mb-8">
        Tu progreso
      </h3>

      {/* Concepts mastered progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/80">Conceptos dominados</span>
          <span className="text-2xl font-bold text-accent">
            54<span className="text-white/60 font-normal">/205</span>
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent to-accent-light rounded-full h-3"
            style={{ width: "24%" }}
          ></div>
        </div>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">647</p>
          <p className="text-sm text-white/60">Puntaje actual</p>
        </div>
        <div className="bg-accent/20 rounded-xl p-4 text-center border border-accent/30">
          <p className="text-3xl font-bold text-accent">753</p>
          <p className="text-sm text-white/60">Tu meta</p>
        </div>
      </div>

      {/* Time estimate */}
      <div className="pt-6 border-t border-white/10">
        <p className="text-white text-lg">
          Alcanzas tu meta en{" "}
          <span className="font-bold text-accent">~5.8 horas</span> de
          estudio enfocado
        </p>
      </div>
    </div>
  );
}
