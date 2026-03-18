"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { GoalOption } from "./types";

type OfferingAutocompleteProps = {
  options: GoalOption[];
  selectedOfferingId: string;
  onSelectOffering: (offeringId: string) => void;
  /** Prefix for DOM ids — must be unique per instance on the page. */
  idPrefix?: string;
};

type AutocompleteFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  items: string[];
  value: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
};

function AutocompleteField({
  id,
  label,
  placeholder,
  items,
  value,
  onSelect,
  disabled = false,
}: AutocompleteFieldProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === value.toLowerCase()) return items.slice(0, 80);
    return items.filter((i) => i.toLowerCase().includes(q)).slice(0, 80);
  }, [items, query, value]);

  function handleSelect(item: string) {
    justSelectedRef.current = true;
    setQuery(item);
    onSelect(item);
    setOpen(false);
  }

  function handleBlur() {
    setTimeout(() => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      setOpen(false);
      if (!query.trim()) {
        if (value) onSelect("");
        return;
      }
      if (query !== value) setQuery(value);
    }, 150);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (open && e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (open && e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (open && e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) handleSelect(filtered[activeIndex]);
      return;
    }
    if (open && e.key === "Escape") {
      setOpen(false);
    }
  }

  const listboxId = `${id}-listbox`;
  const activeOptionId =
    open && filtered[activeIndex] ? `${id}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative flex-1 min-w-0">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-gray-500 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={[
          "w-full rounded-lg border px-3 py-2.5 text-sm transition-all",
          "focus:border-primary focus:ring-2 focus:ring-primary/10",
          "focus:outline-none",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white",
          value ? "border-primary/30 font-medium" : "border-gray-200",
        ].join(" ")}
      />
      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto
            rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        >
          {filtered.map((item, index) => (
            <li key={item} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                id={`${id}-opt-${index}`}
                className={[
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  index === activeIndex
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100 text-gray-800",
                ].join(" ")}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(item)}
              >
                {item}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}

export function OfferingAutocomplete({
  options,
  selectedOfferingId,
  onSelectOffering,
  idPrefix = "offering",
}: OfferingAutocompleteProps) {
  const resolvedOption = useMemo(
    () => options.find((o) => o.offeringId === selectedOfferingId) ?? null,
    [options, selectedOfferingId]
  );

  const [universityName, setUniversityName] = useState(
    resolvedOption?.universityName ?? ""
  );
  const [careerName, setCareerName] = useState(
    resolvedOption?.careerName ?? ""
  );

  useEffect(() => {
    const opt = options.find((o) => o.offeringId === selectedOfferingId);
    if (opt) {
      setUniversityName(opt.universityName);
      setCareerName(opt.careerName);
    } else if (!selectedOfferingId) {
      // Only clear career — university is managed by direct user interaction
      // and should not be wiped when the offering resets mid-selection.
      setCareerName("");
    }
  }, [options, selectedOfferingId]);

  const universityNames = useMemo(
    () => [...new Set(options.map((o) => o.universityName))].sort(),
    [options]
  );

  const careerNames = useMemo(() => {
    if (!universityName) return [];
    return [
      ...new Set(
        options
          .filter((o) => o.universityName === universityName)
          .map((o) => o.careerName)
      ),
    ].sort();
  }, [options, universityName]);

  function handleUniversitySelect(name: string) {
    setUniversityName(name);
    if (name !== universityName) {
      setCareerName("");
      onSelectOffering("");
    }
  }

  function handleCareerSelect(name: string) {
    setCareerName(name);
    if (!name || !universityName) {
      onSelectOffering("");
      return;
    }
    const match = options.find(
      (o) => o.universityName === universityName && o.careerName === name
    );
    onSelectOffering(match?.offeringId ?? "");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AutocompleteField
        id={`${idPrefix}-uni`}
        label="Universidad"
        placeholder="Buscar universidad…"
        items={universityNames}
        value={universityName}
        onSelect={handleUniversitySelect}
      />
      <AutocompleteField
        id={`${idPrefix}-career`}
        label="Carrera"
        placeholder={
          universityName ? "Buscar carrera…" : "Elige universidad primero"
        }
        items={careerNames}
        value={careerName}
        onSelect={handleCareerSelect}
        disabled={!universityName}
      />
    </div>
  );
}
