# Results Page: “Next Concepts” Micro-Preview (Implementation Spec)

## Goal
Increase **results → CTA → signup** by reducing uncertainty and making the route feel concrete, **without** adding cognitive load or violating defensibility rules.

## Core Decision
Add a **“Next Concepts” micro-preview** as a **small, tier-gated module** that:
- shows **3 items max by default** (5 max on expand)
- is **anchored to the recommended RouteCard**
- uses **ONLY direct evidence from wrong answers** (failed questions only)
- **never competes with the primary CTA**

---

## UX Placement & Hierarchy

### Phase 1 (above fold)
No change to current hierarchy:
1) Score range  
2) 1-line value summary (conservative)  
3) Top RouteCard outcomes (questions unlocked + points)  
4) **Primary CTA**  
5) “Ver más rutas” disclosure row (low contrast)

### Phase 2 (expanded details)
Inside the **recommended RouteCard**, add “Next Concepts” module:
- Render ONLY when the user expands results (or expands the route card).
- Never show as a standalone full-width section above the CTA.

**Rationale:** reduce distraction; “next concepts” supports credibility after CTA is visible.

---

## Defensibility Rules (Non-negotiable)

### Source rule (canonical)
“Next concepts” must be derived **ONLY** from:
- atoms where `source === 'direct'` AND `mastered === false`
- AND **only** those atoms that are associated with **wrong answers** (failed questions)

Do NOT include:
- `source === 'not_tested'`
- `source === 'inferred'`
- any “suggested next topics” not backed by wrong-answer evidence

### Copy guardrail
Always scope the module with:
- “según este diagnóstico”
- “a partir de tus respuestas incorrectas”

Never imply full coverage (“todo lo que necesitas aprender”).

---

## Tier Gating Rules

### Tier: perfect (16/16)
- **Do NOT show** personalized next concepts.
- Show generic next step only (advanced practice + mocks).

### Tier: nearPerfect (14–15/16)
- Show **1–2 items max**, tied to the 1–2 wrong answers.
- No “expand to 5” if fewer exist.

### Tier: high (11–13/16)
- Show **3 items default**, up to 5 on expand.

### Tier: average (6–10/16)
- Show **3 items default**, up to 5 on expand.
- Use encouraging framing (“primeros pasos”).

### Tier: belowAverage (3–5/16) and veryLow (0–2/16)
- Do NOT show personalized next atoms.
- Show **generic foundations ladder** (3 steps) instead.

---

## Data Contract

### Input for Next Concepts
From the computed recommended route, extract the ordered list of concepts to teach next.

**Required shape:**
```ts
type NextConcept = {
  atomId: string;
  title: string;              // short user-facing concept label
  reasonKey: 'wrong_answer' | 'unlocks_questions'; // optional
  unlocksQuestionsCount?: number;                  // optional
  evidence: {
    source: 'direct';
    mastered: false;
    questionId: string;       // which wrong answer produced this concept
  };
}
```

### Generation requirements
- Concepts must be **deduplicated** by `atomId`.
- Concepts must be **ordered** by:
  1) prerequisite order within route, then
  2) highest unlock impact (optional), then
  3) stable tie-breaker (atomId) for deterministic UI.

### Fallback rules
- If `nextConcepts.length === 0`:
  - Show limitation copy only (no module).
- If `nextConcepts.length < 3`:
  - Show only what exists; do not backfill.

---

## UI Component Spec

### Component name
`NextConceptsPreview`

### Visual format
Minimal, scan-friendly:
- Title row
- 3 numbered chips/cards stacked
- Optional “Ver hasta 5” disclosure (low contrast)

### Copy (Spanish) — Canonical
**Title:**
- `Tus próximos conceptos (según este diagnóstico)`

**Subtitle (small, optional):**
- `Detectados a partir de tus respuestas incorrectas.`

**Item layout:**
- `1. {concept.title}`
- small tag under it (optional):
  - `Detectado en una respuesta incorrecta`
  - OR `Desbloquea {N} preguntas PAES` (only if `unlocksQuestionsCount` is real)

**Disclosure row:**
- `Ver más (hasta 5)` / `Ver menos`
- Low-contrast text + chevron; NOT a button style.

### Styling constraints
- Must not visually compete with CTA:
  - No primary color background for the module container.
  - No big icons.
  - Keep it “secondary” by design (e.g., subtle border, muted text).

---

## Rendering Rules (Pseudo)

```ts
const tier = getPerformanceTier(totalCorrect);

const showPersonalizedNextConcepts =
  tier === 'nearPerfect' || tier === 'high' || tier === 'average';

const showGenericFoundationsLadder =
  tier === 'belowAverage' || tier === 'veryLow';

const maxDefault =
  tier === 'nearPerfect' ? 2 : 3;

const maxExpanded =
  tier === 'nearPerfect' ? 2 : 5;
```

### Personalized list selection
```ts
const nextConcepts = buildNextConcepts({
  failedQuestionsOnly: true,
  directOnly: true,
  recommendedRoute,
});

const defaultItems = nextConcepts.slice(0, maxDefault);
const expandedItems = nextConcepts.slice(0, maxExpanded);
```

---

## Generic Foundations Ladder (for low-signal tiers)

### When used
- belowAverage, veryLow
- also when route computation fails or returns no next concepts

### Copy
**Title:**
- `Tu siguiente paso (cuando lancemos):`

**3 steps (example placeholders; keep short and non-technical):**
1) `Fundamentos de Números`
2) `Álgebra básica`
3) `Funciones base`

**Support line:**
- `Un paso a la vez. El progreso se acelera cuando los fundamentos están sólidos.`

No projections. No atom counts.

---

## Event Tracking (Optional, only if needed later)
Only add if results→CTA is low and we need to know whether users engage with details:

- `next_concepts_expanded` with properties:
  - `performance_tier`
  - `items_shown` (number)
  - `build_version`

Do NOT add in MVP if you’re keeping events minimal.

---

## Acceptance Criteria
- [ ] No “Next Concepts” shown for **perfect** tier.
- [ ] Near-perfect shows **max 2** personalized concepts.
- [ ] High/Average shows **3 default**, **5 max** on expand.
- [ ] BelowAverage/VeryLow shows **generic 3-step foundations ladder** only.
- [ ] All personalized concepts come from `direct + mastered:false` atoms tied to wrong answers.
- [ ] Module is rendered **only in expanded details** and does not compete with primary CTA.
- [ ] No time estimates unless defensible and implemented elsewhere.
