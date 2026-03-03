"use client";

/**
 * Goal Anchor Screen — Phase 1 of the new onboarding flow.
 *
 * Shown BEFORE the diagnostic form when NEXT_PUBLIC_NEW_ONBOARDING=true.
 * Purpose: Connect the diagnostic session with the student's personal goal
 * (target career/university) to increase completion rate and motivation.
 *
 * Time target: ~30 seconds to complete this screen.
 *
 * Goal data is persisted through authenticated student goal APIs.
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  fetchCareerOptions,
  filterCareers,
  saveCareerGoal,
  type CareerOption,
} from "./careers";

// ============================================================================
// TYPES
// ============================================================================

interface GoalAnchorScreenProps {
  /** Called when user is ready to start the diagnostic (with or without goal). */
  onContinue: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// PAES Invierno 2026 approximate date — update when DEMRE confirms
const PAES_DATE_LABEL = "julio 2026";

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-light-gray shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="w-4 h-4 text-cool-gray shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      className="w-5 h-5 text-accent shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ============================================================================
// CAREER SELECTOR
// ============================================================================

interface CareerSelectorProps {
  careers: CareerOption[];
  selected: CareerOption | null;
  onSelect: (career: CareerOption) => void;
}

function CareerSelector({ careers, selected, onSelect }: CareerSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = "goal-anchor-career-options";

  const filtered = filterCareers(careers, query);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(career: CareerOption) {
    onSelect(career);
    setQuery("");
    setIsOpen(false);
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger/Input */}
      <div
        className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 bg-white 
          cursor-text transition-all duration-200
          ${isOpen ? "border-primary ring-4 ring-primary/10" : "border-gray-200 hover:border-gray-300"}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={
            selected
              ? `${selected.nombre} — ${selected.universidad}`
              : "Buscar carrera o universidad..."
          }
          className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-cool-gray focus:outline-none"
          aria-label="Buscar carrera"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        <ChevronDownIcon />
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Opciones de carrera"
          className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg 
            max-h-56 overflow-y-auto"
        >
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-cool-gray text-center">
              Sin resultados para &quot;{query}&quot;
            </li>
          )}
          {filtered.map((career) => (
            <li
              key={career.offeringId}
              role="option"
              aria-selected={selected?.offeringId === career.offeringId}
              onClick={() => handleSelect(career)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer text-sm
                transition-colors duration-150
                ${
                  selected?.offeringId === career.offeringId
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-charcoal hover:bg-off-white"
                }`}
            >
              <span>
                {career.nombre}{" "}
                <span className="text-cool-gray font-normal">
                  — {career.universidad}
                </span>
              </span>
              <span className="text-xs font-mono text-cool-gray ml-2 shrink-0">
                {career.puntaje_corte === null
                  ? "N/D"
                  : career.puntaje_corte.toLocaleString("es-CL", {
                      maximumFractionDigits: 0,
                    })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// SCORE CARD
// ============================================================================

// Approximate average PAES M1 2025 score (for context)
const PAES_AVERAGE_2025 = 520;

function CareerScoreCard({ career }: { career: CareerOption }) {
  const score = career.puntaje_corte ? Math.round(career.puntaje_corte) : null;
  const aboveAverage = score === null ? 0 : score - PAES_AVERAGE_2025;

  return (
    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in-up">
      <div className="flex items-start gap-3">
        <TargetIcon />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal">
            {career.nombre} — {career.universidad}
          </p>
          <p className="text-3xl font-bold text-primary mt-1">
            {score ?? "N/D"}{" "}
            <span className="text-base font-normal text-cool-gray">puntos</span>
          </p>
          <p className="text-xs text-cool-gray mt-1">
            Puntaje de corte 2025 · Escala 100-1000
          </p>
          {score !== null && aboveAverage > 0 && (
            <p className="text-xs text-accent font-medium mt-1.5">
              +{aboveAverage} pts sobre el promedio nacional
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// META MESSAGE
// ============================================================================

function MetaMessage({ career }: { career: CareerOption }) {
  const score = career.puntaje_corte ? Math.round(career.puntaje_corte) : null;

  return (
    <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
      <p className="text-sm text-charcoal leading-relaxed">
        <span className="font-semibold">
          Meta: {score ?? "puntaje de corte no disponible"}.
        </span>{" "}
        El diagnóstico te dirá exactamente cuánto te falta y qué estudiar
        primero para llegar ahí.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoalAnchorScreen({ onContinue }: GoalAnchorScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [options, setOptions] = useState<CareerOption[]>([]);
  const [selected, setSelected] = useState<CareerOption | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);

    let isMounted = true;
    fetchCareerOptions().then((careers) => {
      if (isMounted) {
        setOptions(careers);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleCareerSelect(career: CareerOption) {
    setSelected(career);
  }

  async function handleContinue() {
    setSaveError(null);
    if (selected) {
      try {
        await saveCareerGoal(selected);
      } catch (error) {
        setSaveError(
          error instanceof Error
            ? error.message
            : "No se pudo guardar tu meta. Intenta de nuevo."
        );
        return;
      }
    }
    onContinue();
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-white via-cream to-off-white" />
      <div
        className="fixed top-10 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div className="fixed inset-0 dot-pattern opacity-30" />

      {/* Back link */}
      <Link
        href="/"
        className={`fixed top-4 left-4 z-20 inline-flex items-center gap-1.5
          text-sm text-charcoal font-medium bg-white/80 backdrop-blur-sm
          px-3 py-1.5 rounded-full shadow-sm border border-gray-100
          hover:bg-white hover:shadow transition-all duration-500
          ${isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver al inicio
      </Link>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <div
          className={`text-center mb-6 transition-all duration-700
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
            <Image src="/logo-arbor.svg" alt="Arbor" width={36} height={36} />
            <span className="text-xl font-serif font-bold text-primary">
              Arbor PreU
            </span>
          </div>
        </div>

        {/* Main card */}
        <div
          className={`card p-8 sm:p-10 backdrop-blur-sm bg-white/90 transition-all duration-700 delay-100
            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-cool-gray mb-5">
            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <span>Paso 1 de 2</span>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-light-gray">2</span>
          </div>

          {/* Heading */}
          <h1
            className={`text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2
              transition-all duration-700 delay-150
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            ¿A qué carrera quieres entrar?
          </h1>
          <p
            className={`text-sm text-cool-gray mb-6
              transition-all duration-700 delay-200
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Personaliza tu diagnóstico y descubre exactamente cuánto te falta.
          </p>

          {/* Career selector */}
          <div
            className={`transition-all duration-700 delay-250
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <CareerSelector
              careers={options}
              selected={selected}
              onSelect={handleCareerSelect}
            />
          </div>

          {/* Score card — appears after selection */}
          {selected && <CareerScoreCard career={selected} />}

          {/* Meta message — appears after selection */}
          {selected && <MetaMessage career={selected} />}

          {/* CTA */}
          <div
            className={`mt-6 transition-all duration-700 delay-300
              ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={handleContinue}
              className="btn-cta w-full py-4 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] 
                transition-all duration-300"
            >
              {selected
                ? "Hacer el diagnóstico — descubrir cuánto me falta"
                : "Hacer el diagnóstico"}
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            {/* Skip option — visible enough for an indecisive user to find it */}
            {!selected && (
              <button
                onClick={onContinue}
                className="w-full mt-3 text-sm text-charcoal/50 hover:text-charcoal 
                  transition-colors duration-200 py-2 underline underline-offset-2"
              >
                No sé aún — hacer igual el diagnóstico
              </button>
            )}
          </div>

          {saveError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}

          {/* Context hint */}
          <p className="mt-4 text-xs text-cool-gray text-center">
            Fecha referencial PAES: {PAES_DATE_LABEL}
          </p>
        </div>
      </div>
    </div>
  );
}
