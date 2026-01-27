export function ProgressSection() {
  return (
    <section className="py-24 section-navy relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-8">
              Progreso que se siente
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Cada concepto que dominas te acerca a tu meta. Sin estimaciones
              vagas—sabes exactamente dónde estás.
            </p>

            <div className="space-y-4">
              <BulletPoint text="Ve qué conceptos dominaste y cuáles te faltan" />
              <BulletPoint text="Puntaje proyectado actualizado cada sesión" />
              <BulletPoint text="Tiempo estimado para alcanzar tu meta" />
            </div>
          </div>

          <ProgressCard />
        </div>
      </div>
    </section>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-accent"></div>
      <span className="text-white/90">{text}</span>
    </div>
  );
}

function ProgressCard() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      <h3 className="text-xl font-serif font-bold text-white mb-8">
        Tu progreso
      </h3>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/80">Conceptos dominados</span>
          <span className="text-2xl font-bold text-accent">
            24<span className="text-white/60 font-normal">/87</span>
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent to-accent-light rounded-full h-3 transition-all duration-1000"
            style={{ width: "28%" }}
          ></div>
        </div>
      </div>

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

      <div className="pt-6 border-t border-white/10">
        <p className="text-white text-lg">
          Alcanzas tu meta en{" "}
          <span className="font-bold text-accent">~5.8 horas</span> de estudio
          enfocado
        </p>
      </div>
    </div>
  );
}
