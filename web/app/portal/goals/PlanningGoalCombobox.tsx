"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { GoalOption } from "./types";

function optionLabel(option: GoalOption) {
  return `${option.careerName} — ${option.universityName}`;
}

type PlanningGoalComboboxProps = {
  options: GoalOption[];
  selectedOfferingId: string;
  onSelectOffering: (offeringId: string) => void;
};

type PlanningOptionsListProps = {
  activeIndex: number;
  filteredOptions: GoalOption[];
  onHover: (index: number) => void;
  onSelect: (option: GoalOption) => void;
};

function PlanningOptionsList({
  activeIndex,
  filteredOptions,
  onHover,
  onSelect,
}: PlanningOptionsListProps) {
  return (
    <ul
      id="planning-options-listbox"
      role="listbox"
      className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
    >
      {filteredOptions.map((option, index) => (
        <li
          key={option.offeringId}
          role="option"
          aria-selected={index === activeIndex}
        >
          <button
            type="button"
            id={`planning-option-${option.offeringId}`}
            className={[
              "w-full rounded-lg px-3 py-2 text-left text-sm",
              index === activeIndex
                ? "bg-primary text-white"
                : "hover:bg-gray-100 text-gray-800",
            ].join(" ")}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(option)}
          >
            {optionLabel(option)}
          </button>
        </li>
      ))}
      {filteredOptions.length === 0 ? (
        <li className="px-3 py-2 text-sm text-gray-600">
          No hay resultados para tu búsqueda.
        </li>
      ) : null}
    </ul>
  );
}

export function PlanningGoalCombobox({
  options,
  selectedOfferingId,
  onSelectOffering,
}: PlanningGoalComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const selectedOption = options.find(
      (option) => option.offeringId === selectedOfferingId
    );
    if (selectedOption) {
      setQuery(optionLabel(selectedOption));
    }
  }, [options, selectedOfferingId]);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options.slice(0, 80);
    }
    return options
      .filter((option) =>
        optionLabel(option).toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 80);
  }, [options, query]);

  const activeOptionId =
    open && filteredOptions[activeIndex]
      ? `planning-option-${filteredOptions[activeIndex].offeringId}`
      : undefined;

  function selectOption(option: GoalOption) {
    onSelectOffering(option.offeringId);
    setQuery(optionLabel(option));
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (open && event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1)
      );
      return;
    }
    if (open && event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (open && event.key === "Enter") {
      event.preventDefault();
      if (filteredOptions[activeIndex]) {
        selectOption(filteredOptions[activeIndex]);
      }
      return;
    }
    if (open && event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <label htmlFor="planning-combobox" className="sr-only">
        Buscar carrera y universidad
      </label>
      <input
        id="planning-combobox"
        role="combobox"
        aria-expanded={open}
        aria-controls="planning-options-listbox"
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe carrera o universidad"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
      />
      {open ? (
        <PlanningOptionsList
          activeIndex={activeIndex}
          filteredOptions={filteredOptions}
          onHover={setActiveIndex}
          onSelect={selectOption}
        />
      ) : null}
    </div>
  );
}

export function formatPlanningCutoff(option: GoalOption | null) {
  if (!option || option.lastCutoff === null) {
    return "Sin corte histórico disponible";
  }

  const score = option.lastCutoff.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (!option.cutoffYear) {
    return `${score} pts`;
  }

  return `${score} pts (admisión ${option.cutoffYear})`;
}

export function selectedPlanningOption(
  options: GoalOption[],
  selectedOfferingId: string
) {
  return (
    options.find((option) => option.offeringId === selectedOfferingId) ?? null
  );
}
