/**
 * Shared mockup screens used across landing page sections.
 * Each renders a simplified representation of a real app screen,
 * suitable for use inside a BrowserFrame.
 */

interface DiagnosticMockupProps {
  /** e.g. "12/16" or "8/16" */
  progress?: string;
  question?: string;
  options?: string[];
  /** 0–100 */
  progressPct?: number;
}

export function DiagnosticMockup({
  progress = "12/16",
  question = "Si f(x) = 2x + 3, entonces f(f(1)) es igual a:",
  options = ["A) 13", "B) 11", "C) 10", "D) 7"],
  progressPct = 75,
}: DiagnosticMockupProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-charcoal">
          Diagnóstico M1 — Pregunta {progress}
        </span>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full
            bg-amber-100 text-amber-700"
        >
          Adaptativo
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-charcoal font-medium mb-3">
          {question}
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div
              key={opt}
              className={`px-3 py-2 rounded-lg border text-sm ${
                i === 0
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-gray-200 text-cool-gray"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-cool-gray">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span>{progressPct}%</span>
      </div>
    </div>
  );
}

export function ResultsMockup() {
  const axes = [
    { label: "Álgebra", pct: 68 },
    { label: "Números", pct: 45 },
    { label: "Geometría", pct: 72 },
    { label: "Probabilidad", pct: 55 },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="text-center mb-4">
        <p className="text-xs text-cool-gray uppercase tracking-wide mb-1">
          Rango estimado
        </p>
        <p className="text-3xl font-bold text-charcoal">
          620 – 680
          <span className="text-base font-normal text-cool-gray ml-1">
            pts
          </span>
        </p>
      </div>
      <div className="space-y-2">
        {axes.map((a) => (
          <div key={a.label} className="flex items-center gap-3">
            <span className="text-xs text-cool-gray w-20 text-right">
              {a.label}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent rounded-full h-2 transition-all"
                style={{ width: `${a.pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-charcoal w-8">
              {a.pct}%
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-4 bg-primary/5 rounded-lg p-3 border
          border-primary/20 text-center"
      >
        <p className="text-xs text-primary font-medium">
          Ruta recomendada: Álgebra (+42 pts estimados)
        </p>
      </div>
    </div>
  );
}

const PATH_ATOMS = [
  { name: "Productos notables", status: "mastered" as const },
  { name: "Factorización", status: "current" as const },
  { name: "Ecuaciones cuadráticas", status: "locked" as const },
  { name: "Función cuadrática", status: "locked" as const },
];

const STATUS_DOT: Record<string, string> = {
  mastered: "bg-emerald-500 ring-4 ring-emerald-100",
  current: "bg-primary ring-4 ring-primary/20",
  locked: "border-2 border-gray-300 bg-white",
};

const STATUS_TEXT: Record<string, string> = {
  mastered: "text-emerald-700",
  current: "text-primary",
  locked: "text-cool-gray",
};

const STATUS_LABEL: Record<string, string> = {
  mastered: "Dominado",
  current: "Siguiente mini-clase",
  locked: "Bloqueado",
};

export function LearningPathMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-charcoal">
          Ruta de aprendizaje — Álgebra
        </span>
        <span className="text-xs text-cool-gray">4 conceptos</span>
      </div>

      <div className="space-y-1">
        {PATH_ATOMS.map((atom, i) => (
          <div key={atom.name} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full shrink-0 mt-1
                  ${STATUS_DOT[atom.status]}`}
              />
              {i < PATH_ATOMS.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="pb-4">
              <span
                className={`text-sm font-medium ${STATUS_TEXT[atom.status]}`}
              >
                {atom.name}
              </span>
              <p className="text-xs text-cool-gray mt-0.5">
                {STATUS_LABEL[atom.status]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniClaseMockup() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-charcoal">
          Productos notables
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full
            bg-emerald-100 text-emerald-700 font-medium"
        >
          Mini-clase
        </span>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
        <p className="text-xs text-cool-gray mb-2">Ejemplo resuelto:</p>
        <p className="text-sm text-charcoal font-mono">
          (a + b)² = a² + 2ab + b²
        </p>
      </div>
      <div
        className="bg-emerald-50 rounded-lg p-3 border
          border-emerald-200"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-600 text-sm">✓</span>
          <span className="text-sm font-medium text-emerald-700">
            ¡Correcto!
          </span>
        </div>
        <p className="text-xs text-emerald-600">
          Llevas 2 correctas seguidas. Una más en nivel difícil
          para dominar.
        </p>
      </div>
    </div>
  );
}

export function GapDetectionMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div
        className="flex items-center gap-2 text-xs font-semibold
          px-3 py-1.5 rounded-full bg-red-50 text-red-600
          border border-red-200 w-fit mb-5"
      >
        No dominó Factorización
      </div>

      <div className="text-sm font-semibold text-charcoal mb-3">
        Escaneando prerequisitos...
      </div>

      <div className="space-y-2 mb-5">
        <ScanRow label="Operaciones con fracciones" pass />
        <ScanRow label="Productos notables" pass={false} />
      </div>

      <div
        className="flex items-start gap-2.5 p-3 rounded-xl
          bg-emerald-50 border border-emerald-200"
      >
        <CheckCircleIcon />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Vacío encontrado — camino actualizado
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Primero domina Productos notables, luego vuelve a
            Factorización.
          </p>
        </div>
      </div>

      <div className="mt-5 pl-1">
        <PathNode
          status="gap"
          label="Productos notables"
          detail="Prerequisito — siguiente mini-clase"
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

export function ProgressDashboardMockup() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <span className="text-sm font-semibold text-charcoal">
        Dashboard del alumno
      </span>

      <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
        <MetricTile
          value="54"
          suffix="/205"
          label="Conceptos dominados"
        />
        <MetricTile
          value="26%"
          label="Avance"
          className="bg-emerald-50 border-emerald-200"
          valueClassName="text-emerald-600"
        />
        <MetricTile
          value="38"
          label="Preguntas PAES"
          className="bg-amber-50 border-amber-200"
          valueClassName="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <MetricTile value="647" label="Puntaje actual" />
        <MetricTile
          value="753"
          label="Meta"
          className="bg-accent/10 border-accent/20"
          valueClassName="text-accent"
        />
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <MissionRing completed={3} target={5} />
        <div>
          <p className="text-sm font-medium text-charcoal">
            Misión semanal: 3/5
          </p>
          <p className="text-xs text-cool-gray">
            2 sesiones más esta semana
          </p>
        </div>
      </div>
    </div>
  );
}

function ScanRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg
        border ${
          pass
            ? "bg-emerald-50/60 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}
    >
      <span className="text-sm">
        {pass ? (
          <span className="text-emerald-500">✓</span>
        ) : (
          <span className="text-red-500">✗</span>
        )}
      </span>
      <span
        className={`text-sm font-medium
          ${pass ? "text-emerald-700" : "text-red-700"}`}
      >
        {label}
      </span>
      <span
        className={`ml-auto text-[10px] font-bold uppercase tracking-wider
          px-1.5 py-0.5 rounded-full ${
            pass
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
      >
        {pass ? "Sólido" : "Vacío"}
      </span>
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

function CheckCircleIcon() {
  return (
    <svg
      className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
