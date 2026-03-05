"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Confetti } from "@/app/diagnostico/components/Confetti";
import type { SessionStatus } from "@/lib/student/atomMasteryAlgorithm";

type PrereqScanInfo = {
  sessionId: string | null;
  prereqCount: number;
  status: "in_progress" | "no_prereqs";
};

type AtomResultPanelProps = {
  status: SessionStatus;
  atomTitle: string;
  totalAnswered: number;
  totalCorrect: number;
  attemptNumber: number;
  prereqScan?: PrereqScanInfo;
  cooldownApplied?: boolean;
  questionsUnlocked?: number;
  nextAtom?: { id: string; title: string } | null;
};

function AnimatedStat({
  label,
  value,
  delay,
  accent,
}: {
  label: string;
  value: string;
  delay: number;
  accent?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={[
        "rounded-xl border p-4 text-center transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        accent
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white/80 border-gray-100",
      ].join(" ")}
    >
      <p
        className={[
          "text-2xl font-bold",
          accent ? "text-emerald-600" : "text-primary",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function AtomNode({
  filled,
  label,
  delay,
}: {
  filled: boolean;
  label: string;
  delay: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={[
          "w-10 h-10 rounded-full border-2 flex items-center justify-center",
          "transition-all duration-700",
          animated && filled
            ? "bg-emerald-500 border-emerald-500 scale-110"
            : animated && !filled
              ? "bg-rose-100 border-rose-300 scale-95"
              : "bg-gray-100 border-gray-200",
        ].join(" ")}
      >
        {animated && filled && (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {animated && !filled && (
          <svg
            className="w-5 h-5 text-rose-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01"
            />
          </svg>
        )}
      </div>
      <span className="text-[10px] text-gray-500 text-center max-w-[72px] leading-tight">
        {label}
      </span>
    </div>
  );
}

function MiniPath({
  currentAtom,
  mastered,
  nextAtom,
}: {
  currentAtom: string;
  mastered: boolean;
  nextAtom?: { title: string } | null;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <AtomNode filled={mastered} label={currentAtom} delay={300} />
      {nextAtom && (
        <>
          <div className="w-8 h-0.5 bg-gray-200 rounded" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <span className="text-[10px] text-gray-500 text-center max-w-[72px] leading-tight">
              {nextAtom.title}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function MasteryResult({
  atomTitle,
  totalAnswered,
  totalCorrect,
  questionsUnlocked,
  nextAtom,
}: {
  atomTitle: string;
  totalAnswered: number;
  totalCorrect: number;
  questionsUnlocked?: number;
  nextAtom?: { id: string; title: string } | null;
}) {
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Concepto dominado
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          {atomTitle}
        </h2>
      </div>

      <MiniPath currentAtom={atomTitle} mastered={true} nextAtom={nextAtom} />

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <AnimatedStat
          label="Respondidas"
          value={String(totalAnswered)}
          delay={400}
        />
        <AnimatedStat label="Precisión" value={`${accuracy}%`} delay={600} />
        {questionsUnlocked !== undefined && questionsUnlocked > 0 && (
          <AnimatedStat
            label="Preguntas PAES"
            value={`+${questionsUnlocked}`}
            delay={800}
            accent
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {nextAtom ? (
          <Link
            href={`/portal/study?atom=${nextAtom.id}`}
            className="btn-cta text-center text-sm py-3 px-6"
          >
            Siguiente: {nextAtom.title}
          </Link>
        ) : (
          <Link
            href="/portal"
            className="btn-cta text-center text-sm py-3 px-6"
          >
            Siguiente concepto
          </Link>
        )}
        <Link href="/portal" className="btn-secondary text-center">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}

function FailureWithPrereqScan({
  atomTitle,
  totalAnswered,
  totalCorrect,
  prereqScan,
}: {
  atomTitle: string;
  totalAnswered: number;
  totalCorrect: number;
  prereqScan: PrereqScanInfo;
}) {
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium bg-amber-100 text-amber-700">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Verificando tus bases
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          {atomTitle}
        </h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Vamos a revisar {prereqScan.prereqCount} concepto
          {prereqScan.prereqCount !== 1 ? "s" : ""} previo
          {prereqScan.prereqCount !== 1 ? "s" : ""} para encontrar dónde
          reforzar. Esto es normal y acelera tu aprendizaje.
        </p>
      </div>

      <MiniPath currentAtom={atomTitle} mastered={false} />

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        <AnimatedStat
          label="Respondidas"
          value={String(totalAnswered)}
          delay={400}
        />
        <AnimatedStat label="Precisión" value={`${accuracy}%`} delay={600} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {prereqScan.sessionId ? (
          <Link
            href={`/portal/study?scan=${prereqScan.sessionId}`}
            className="btn-cta text-center text-sm py-3 px-6"
          >
            Verificar bases
          </Link>
        ) : (
          <Link
            href="/portal"
            className="btn-cta text-center text-sm py-3 px-6"
          >
            Siguiente paso
          </Link>
        )}
        <Link href="/portal" className="btn-secondary text-center">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}

function FailureWithCooldown({
  atomTitle,
  totalAnswered,
  totalCorrect,
  attemptNumber,
}: {
  atomTitle: string;
  totalAnswered: number;
  totalCorrect: number;
  attemptNumber: number;
}) {
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium bg-blue-100 text-blue-700">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pausa de descanso
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">
          {atomTitle}
        </h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          {attemptNumber < 3
            ? "Tus bases están sólidas. Este concepto queda en pausa — domina 3 conceptos más y lo intentaremos de nuevo con ojos frescos."
            : "Has usado todos los intentos por ahora. Avanza con otros conceptos y volveremos a este después."}
        </p>
      </div>

      <MiniPath currentAtom={atomTitle} mastered={false} />

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        <AnimatedStat
          label="Respondidas"
          value={String(totalAnswered)}
          delay={400}
        />
        <AnimatedStat label="Precisión" value={`${accuracy}%`} delay={600} />
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
        <p className="text-sm text-blue-700">
          Volveremos a este concepto después de dominar{" "}
          <span className="font-semibold">3 conceptos más</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/portal" className="btn-cta text-center text-sm py-3 px-6">
          Continuar aprendiendo
        </Link>
      </div>
    </>
  );
}

export function AtomResultPanel({
  status,
  atomTitle,
  totalAnswered,
  totalCorrect,
  attemptNumber,
  prereqScan,
  cooldownApplied,
  questionsUnlocked,
  nextAtom,
}: AtomResultPanelProps) {
  const [showContent, setShowContent] = useState(false);
  const isMastered = status === "mastered";

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(t);
  }, []);

  const hasPrereqScan =
    prereqScan && prereqScan.status === "in_progress" && prereqScan.sessionId;

  return (
    <div className="relative">
      {isMastered && (
        <Confetti variant="burst" duration={3000} particleCount={80} />
      )}

      <section
        className={[
          "rounded-2xl p-6 sm:p-8 space-y-6 border",
          "transition-all duration-700",
          isMastered
            ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
            : hasPrereqScan
              ? "bg-gradient-to-br from-amber-50 to-white border-amber-200"
              : cooldownApplied
                ? "bg-gradient-to-br from-blue-50 to-white border-blue-200"
                : "bg-gradient-to-br from-rose-50 to-white border-rose-200",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        {isMastered && (
          <MasteryResult
            atomTitle={atomTitle}
            totalAnswered={totalAnswered}
            totalCorrect={totalCorrect}
            questionsUnlocked={questionsUnlocked}
            nextAtom={nextAtom}
          />
        )}

        {!isMastered && hasPrereqScan && (
          <FailureWithPrereqScan
            atomTitle={atomTitle}
            totalAnswered={totalAnswered}
            totalCorrect={totalCorrect}
            prereqScan={prereqScan!}
          />
        )}

        {!isMastered && !hasPrereqScan && (
          <FailureWithCooldown
            atomTitle={atomTitle}
            totalAnswered={totalAnswered}
            totalCorrect={totalCorrect}
            attemptNumber={attemptNumber}
          />
        )}
      </section>
    </div>
  );
}
