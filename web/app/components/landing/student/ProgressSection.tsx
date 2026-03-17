/**
 * Progress section - dark navy section showing progress tracking
 * Mirrors the real portal: score, mastered atoms, mission ring, PAES Qs
 */
import { PAES_TOTAL_QUESTIONS } from "@/lib/diagnostic/paesScoreTable";
import { ScrollReveal } from "../ScrollReveal";

export function ProgressSection() {
  return (
    <section className="py-16 sm:py-24 section-navy relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <ScrollReveal className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 sm:mb-6">
              Ves tu avance real,{" "}
              <span className="text-accent">no solo horas</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
              Conceptos dominados, preguntas PAES desbloqueadas,
              misión semanal y proyección de puntaje — todo en un
              solo lugar.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <ProgressCard />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function ProgressCard() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
      <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-6 sm:mb-8">
        Tu progreso
      </h3>

      {/* Three metric tiles — mirrors portal DashboardProgressSection */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            54
            <span className="text-base font-normal text-white/50">/205</span>
          </p>
          <p className="text-[10px] sm:text-xs text-white/60 mt-1">
            Conceptos dominados
          </p>
        </div>
        <div className="bg-emerald-500/15 rounded-xl p-3 text-center border border-emerald-400/20">
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
            26%
          </p>
          <p className="text-[10px] sm:text-xs text-white/60 mt-1">
            Tu avance
          </p>
        </div>
        <div className="bg-amber-500/15 rounded-xl p-3 text-center border border-amber-400/20">
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
            38
            <span className="text-base font-normal text-white/50">
              /{PAES_TOTAL_QUESTIONS}
            </span>
          </p>
          <p className="text-[10px] sm:text-xs text-white/60 mt-1">
            Preguntas PAES
          </p>
        </div>
      </div>

      {/* Score + target */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-white">647</p>
          <p className="text-xs sm:text-sm text-white/60">Puntaje actual</p>
        </div>
        <div className="bg-accent/20 rounded-xl p-3 sm:p-4 text-center border border-accent/30">
          <p className="text-2xl sm:text-3xl font-bold text-accent">753</p>
          <p className="text-xs sm:text-sm text-white/60">Tu meta</p>
        </div>
      </div>

      {/* Weekly mission ring — mirrors portal DashboardMissionSection */}
      <div className="pt-5 sm:pt-6 border-t border-white/10 flex items-center gap-4">
        <MiniMissionRing completed={3} target={5} />
        <div>
          <p className="text-white text-sm sm:text-base font-medium">
            Misión semanal: 3/5 sesiones
          </p>
          <p className="text-white/50 text-xs sm:text-sm">
            2 sesiones más para completar esta semana
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniMissionRing({
  completed,
  target,
}: {
  completed: number;
  target: number;
}) {
  const pct = target > 0 ? Math.round((completed / target) * 100) : 0;
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22" cy="22" r={r}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4"
        />
        <circle
          cx="22" cy="22" r={r}
          fill="none" stroke="#d97706" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${offset}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">
          {completed}/{target}
        </span>
      </div>
    </div>
  );
}
