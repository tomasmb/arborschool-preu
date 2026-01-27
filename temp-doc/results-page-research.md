# Results Page Research ToDos

Research items to determine the best UX decisions for the results page.

---

## ToDo List

### 1. Score Display Format
- [x] **Determine if it's better to show main score or main range of score in results page**
  - Research: What do users prefer? Single number vs range?
  - Consider: Accuracy perception, anxiety reduction, clarity
  - **DECISION: Hybrid approach - midpoint as headline with range underneath**
    - Headline: Large midpoint score (e.g., "650")
    - Subtitle: "Rango probable: 620–680 (≈ ±5 preguntas)"
  - Rationale: Cognitively easy single number for motivation/conversion, explicit range for honesty about uncertainty

### 2. Example vs Real Results Page Alignment
- [ ] **Determine if we need to align more the example result page with real result page**
  - Compare current example modal with actual results page
  - Identify differences in layout, information shown, styling
  - Decide if consistency helps or if differences serve a purpose

### 3. Next Mini-Clases Visibility
- [ ] **Determine if it's better to show the next mini-clases with no clicks required**
  - Current: User needs to interact to see next steps?
  - Option A: Show mini-clases expanded by default
  - Option B: Keep collapsed/hidden until user clicks
  - Consider: Cognitive load, motivation, conversion

---

## Research Notes

### Score Format Research (2026-01-27)

**Recommendation implemented:** Midpoint as primary headline with range underneath.

**Display format:**
- Primary: Large animated score (e.g., "650")
- Secondary: "Rango probable: 620–680 (≈ ±5 preguntas)"

**Wording choices for Chilean 18-year-olds:**
- "Tu Puntaje PAES Estimado" — clear, professional, sets appropriate expectations
- "Rango probable" — professional but approachable, not overly formal
- "(≈ ±5 preguntas)" — grounds uncertainty in tangible terms students understand
- En-dash (–) for ranges instead of hyphen for proper typography

**Files updated:**
- `ResultsScreen.tsx` — Main results display (primary emphasis)
- `TierContent.tsx` — ScoreDisplay + SecondaryScoreDisplay components
- `resultados/[sessionId]/page.tsx` — Saved results page
- `ExampleResultsModal.tsx` — Preview modal
- `ThankYouScreen.tsx` — Post-signup confirmation

**Why this works:**
1. Cognitive ease — Single number is easier to process and remember
2. Motivation — Concrete number feels like an achievement/goal
3. Trust — Explicit range shows honesty about diagnostic limitations
4. Conversion — Better UX leads to higher signup rates

---

## Decision Log

| Item | Decision | Rationale | Date |
|------|----------|-----------|------|
| Score format | Midpoint headline + range subtitle | Better UX (cognitive ease) + honesty (uncertainty transparent) | 2026-01-27 |
| Example alignment | TBD | - | - |
| Mini-clases visibility | TBD | - | - |
