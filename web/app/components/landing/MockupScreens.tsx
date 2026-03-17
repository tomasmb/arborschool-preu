/**
 * Shared mockup screens used across landing page sections.
 * Each renders a simplified representation of a REAL app screen,
 * matching actual UI labels and structure from the app.
 */

/**
 * Diagnostic question screen.
 * Matches: DiagnosticHeader + QuestionScreen in web/app/diagnostico/
 * - "Pregunta X/16" in header
 * - Stage indicator ("Etapa 2 de 2")
 * - Axis + skill badges on question
 * - Options with letter circles
 * - Progress bar
 */
export function DiagnosticMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      {/* Header bar — matches DiagnosticHeader */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-charcoal">
          Diagnóstico PAES M1
        </span>
        <span className="text-xs text-cool-gray">
          Pregunta 12/16
        </span>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center gap-2 text-xs text-cool-gray">
        <span className="font-medium text-charcoal">
          Etapa 2 de 2
        </span>
        <span>— Preguntas adaptadas a tu nivel</span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-cool-gray">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2"
            style={{ width: "75%" }}
          />
        </div>
        <span>75%</span>
      </div>

      {/* Question card with axis/skill badges */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex gap-2 mb-3">
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full
              bg-primary/10 text-primary"
          >
            Álgebra y Funciones
          </span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full
              bg-gray-100 text-cool-gray"
          >
            Resolver Problemas
          </span>
        </div>
        <p className="text-sm text-charcoal font-medium mb-3">
          Si f(x) = 2x + 3, entonces f(f(1)) es igual a:
        </p>
        <div className="space-y-2">
          {[
            { letter: "A", text: "13" },
            { letter: "B", text: "11" },
            { letter: "C", text: "10" },
            { letter: "D", text: "7" },
          ].map((opt, i) => (
            <div
              key={opt.letter}
              className={`flex items-center gap-3 px-3 py-2.5
                rounded-lg border text-sm ${
                  i === 0
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-cool-gray"
                }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center
                  justify-center text-xs font-semibold shrink-0 ${
                    i === 0
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-cool-gray"
                  }`}
              >
                {opt.letter}
              </span>
              <span className={i === 0 ? "font-medium" : ""}>
                {opt.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Learning path — "Tu camino recomendado".
 * Matches: LearningPathSection in web/app/portal/
 * - Current node with axis badge and "Comenzar mini-clase" CTA
 * - Preview nodes (upcoming, grayed out)
 */
const PATH_ATOMS = [
  {
    name: "Factorización",
    axis: "Álgebra y Funciones",
    status: "current" as const,
    points: "+8",
    time: "~15 min",
  },
  {
    name: "Ecuaciones cuadráticas",
    axis: "Álgebra y Funciones",
    status: "preview" as const,
  },
  {
    name: "Función cuadrática",
    axis: "Álgebra y Funciones",
    status: "preview" as const,
  },
];

export function LearningPathMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-semibold text-charcoal">
          Tu camino recomendado
        </span>
      </div>

      <div className="space-y-0">
        {PATH_ATOMS.map((atom, i) => (
          <div key={atom.name} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full shrink-0 mt-1.5 ${
                  atom.status === "current"
                    ? "bg-primary ring-4 ring-primary/20"
                    : "border-2 border-gray-300 bg-white"
                }`}
              />
              {i < PATH_ATOMS.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="pb-5">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`text-sm font-medium ${
                    atom.status === "current"
                      ? "text-charcoal"
                      : "text-cool-gray"
                  }`}
                >
                  {atom.name}
                </span>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5
                  rounded-full bg-primary/10 text-primary"
              >
                {atom.axis}
              </span>
              {atom.status === "current" && (
                <div className="mt-2 flex items-center gap-3">
                  <button
                    className="text-xs font-semibold px-3 py-1.5
                      rounded-lg bg-primary text-white"
                  >
                    Comenzar mini-clase
                  </button>
                  <span className="text-[10px] text-cool-gray">
                    {atom.time} · Hasta {atom.points} pts PAES
                  </span>
                </div>
              )}
              {atom.status === "preview" && (
                <span className="text-[10px] text-cool-gray ml-1">
                  Próximo
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Gap detection — "Verificando bases".
 * Matches: PrereqScanView in web/app/portal/study/
 * - Header: "Verificando bases"
 * - One question at a time (not a scan list)
 * - GapFoundPanel: "Vacío detectado"
 * - Updated path showing prerequisite first
 */
export function GapDetectionMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header — matches PrereqScanView */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-6 h-6 rounded-full bg-gradient-to-br
              from-amber-400 to-amber-500 flex items-center
              justify-center"
          >
            <ScanSmall />
          </span>
          <span className="text-sm font-semibold text-charcoal">
            Verificando bases
          </span>
        </div>
        <p className="text-xs text-cool-gray ml-8">
          Revisando conceptos previos para encontrar dónde reforzar
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs text-cool-gray mb-4">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-amber-400 rounded-full h-1.5"
            style={{ width: "66%" }}
          />
        </div>
        <span>Verificación 2 de 3</span>
      </div>

      {/* Gap found panel — matches GapFoundPanel */}
      <div
        className="p-4 rounded-xl bg-red-50 border border-red-200
          mb-4"
      >
        <p className="text-sm font-semibold text-red-800 mb-1">
          Vacío detectado
        </p>
        <p className="text-xs text-red-600">
          Detectamos un vacío en{" "}
          <span className="font-semibold">Productos notables</span>
        </p>
      </div>

      {/* Updated path */}
      <div className="pl-1">
        <PathNode
          status="gap"
          label="Productos notables"
          detail="Estudiar este concepto primero"
          showLine
        />
        <PathNode
          status="locked"
          label="Factorización"
          detail="Desbloqueado después"
          showLine={false}
        />
      </div>
    </div>
  );
}

/**
 * Progress dashboard.
 * Matches: DashboardSections in web/app/portal/
 * - "Tu puntaje demostrado" (not "Puntaje actual")
 * - "Conceptos dominados", "Tu avance", "Preguntas PAES desbloqueadas"
 * - Mission ring "Misión semanal"
 */
export function ProgressDashboardMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Score hero — matches DashboardHeroSection */}
      <div className="text-center mb-4">
        <p className="text-xs text-cool-gray">Tu puntaje demostrado</p>
        <p className="text-3xl font-bold text-charcoal mt-1">647</p>
        <p className="text-xs text-cool-gray mt-0.5">Rango 620–680</p>
        <div className="mt-2 mx-auto max-w-xs">
          <ScoreBar current={647} target={753} />
        </div>
        <p className="text-xs text-cool-gray mt-1">
          Te faltan 106 pts para tu meta
        </p>
      </div>

      {/* Metrics — matches DashboardProgressSection */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetricTile value="54" suffix="/205" label="Conceptos dominados" />
        <MetricTile
          value="26%"
          label="Tu avance"
          className="bg-emerald-50 border-emerald-200"
          valueClassName="text-emerald-600"
        />
        <MetricTile
          value="38"
          label="Preguntas PAES desbloqueadas"
          className="bg-amber-50 border-amber-200"
          valueClassName="text-amber-600"
        />
      </div>

      {/* Mission ring — matches DashboardMissionSection */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <MissionRing completed={3} target={5} />
        <div>
          <p className="text-sm font-medium text-charcoal">
            Misión semanal
          </p>
          <p className="text-xs text-cool-gray">
            2 sesiones más para completar
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared sub-components                                               */
/* ------------------------------------------------------------------ */

function ScoreBar({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const min = 100;
  const max = 1000;
  const pct = ((current - min) / (max - min)) * 100;
  const targetPct = ((target - min) / (max - min)) * 100;

  return (
    <div className="relative h-2 bg-gray-200 rounded-full">
      <div
        className="absolute h-2 bg-primary rounded-full"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent"
        style={{ left: `${targetPct}%` }}
      />
    </div>
  );
}

function PathNode({
  status,
  label,
  detail,
  showLine,
}: {
  status: "gap" | "locked";
  label: string;
  detail: string;
  showLine: boolean;
}) {
  const dot =
    status === "gap"
      ? "bg-red-500 ring-4 ring-red-100"
      : "border-2 border-gray-300 bg-white";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${dot} shrink-0 mt-0.5`} />
        {showLine && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className={showLine ? "pb-3" : ""}>
        <span
          className={`text-sm font-medium
            ${status === "gap" ? "text-red-700" : "text-cool-gray"}`}
        >
          {label}
        </span>
        <p className="text-xs text-cool-gray mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function MetricTile({
  value,
  suffix,
  label,
  className = "bg-gray-50 border-gray-100",
  valueClassName = "text-charcoal",
}: {
  value: string;
  suffix?: string;
  label: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`rounded-xl p-3 text-center border ${className}`}>
      <p className={`text-xl sm:text-2xl font-bold ${valueClassName}`}>
        {value}
        {suffix && (
          <span className="text-sm font-normal text-cool-gray">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-[10px] text-cool-gray mt-1">{label}</p>
    </div>
  );
}

function MissionRing({
  completed,
  target,
}: {
  completed: number;
  target: number;
}) {
  const pct = target > 0 ? Math.round((completed / target) * 100) : 0;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20" cy="20" r={r}
          fill="none" stroke="#e5e7eb" strokeWidth="3.5"
        />
        <circle
          cx="20" cy="20" r={r}
          fill="none" stroke="#d97706" strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-charcoal">
          {completed}/{target}
        </span>
      </div>
    </div>
  );
}

function ScanSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
