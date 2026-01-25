# Conversion Optimization Implementation Plan

**Goal:** Maximize the number of users who complete the diagnostic AND sign up ("I NEED THIS" moment).

**Target Audience:**
- Primary: 18-year-old Chilean students preparing for PAES
- Secondary: Parents of these students (often the decision-makers)

**Document Status:** Ready for implementation  
**Last Updated:** January 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Audience Psychology Insights](#audience-psychology-insights)
3. [Results Data Analysis: What's Defensible](#results-data-analysis-whats-defensible)
4. [Expectation Setting & High Performers](#expectation-setting--high-performers)
5. [Changes Overview](#changes-overview)
6. [Priority 1: Example Results Preview](#priority-1-example-results-preview)
7. [Priority 2: Results Screen Simplification](#priority-2-results-screen-simplification)
8. [Priority 3: Credibility & Trust Elements](#priority-3-credibility--trust-elements)
9. [Priority 4: Copy & Framing Updates](#priority-4-copy--framing-updates)
10. [Priority 5: Analytics Instrumentation](#priority-5-analytics-instrumentation)
11. [Copy Guidelines](#copy-guidelines)
12. [Analytics Events Specification](#analytics-events-specification)
13. [Success Metrics](#success-metrics)
14. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

Based on the Conversion Pillars research, behavioral science analysis, and a thorough review of what data we can actually defend, we need to make the following changes:

| Change | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Example Results Preview (modal) | Medium | High | P1 |
| Results Screen Simplification + Remove Misleading Data | **High** | **Critical** | P2 |
| Credibility badges + expandable section | Low | Medium | P3 |
| Copy & framing updates (loss/challenge) | Low | Medium | P4 |
| Analytics instrumentation (PostHog) | Medium | High | P5 |

### Critical Change: Results Screen

The current Results screen shows **misleading data** that implies precision we don't have:
- Axis mastery percentages (we only sample a subset of atoms)
- "X/Y átomos" counts (atoms not tested default to "not mastered")
- Precise time estimates (based on questionable atom counts)

**We MUST remove these** and focus on what we CAN defend:
- PAES score (range) — based on actual PAES questions
- +X points projections — grounded in Question Unlock Algorithm
- Questions unlocked — solid knowledge graph foundation
- Low hanging fruit — useful, about question proximity

See [Results Data Analysis](#results-data-analysis-whats-defensible) for full breakdown.

### Critical: Expectation Setting & High Performers

Students must understand this is a **16-question estimation**, not a comprehensive test. Additionally, **high performers** (14+/16 correct) need a different experience — we can't show "areas of improvement" when we didn't detect any weaknesses.

See [Expectation Setting & High Performers](#expectation-setting--high-performers) for details.

**What we're NOT changing:**
- Design system (colors, typography, components) — already good
- Diagnostic flow (16 questions, adaptive) — working well
- Signup screen layout — already follows best practices
- +X points projections — algorithm is solid and defensible

---

## Audience Psychology Insights

### 18-Year-Old Students (Gen Z)

| Behavior | Design Implication |
|----------|-------------------|
| **8-second attention span** | Capture interest immediately. No text walls. |
| **Instant gratification expectation** | Show value BEFORE asking for time commitment |
| **Scan, don't read** | Visual > text. Use gauges, progress bars, cards |
| **Authenticity detection** | Avoid hype. Conservative, honest claims only. |
| **Loss aversion affects performance** | Frame as "closing a gap" not just "gaining points" |
| **Challenge framing > threat framing** | "Discover your potential" not "You'll fail without this" |

### Parents

| Behavior | Design Implication |
|----------|-------------------|
| **Present-bias** | Show value NOW, not "later when you sign up" |
| **Trust is behavioral, not rational** | Credibility signals > logical arguments |
| **Moral weight on education decisions** | Frame as "the responsible choice" |
| **Want to support, not pressure** | "Help your child" not "Fix your child" |

### Chile-Specific

| Context | Implication |
|---------|-------------|
| PAES is high-stakes and stressful | Don't add stress. Frame as clarity & confidence. |
| Official advice: "Don't overwhelm yourself" | Validates our simplification approach |
| Strong family involvement | Consider parent-specific messaging |

---

## Results Data Analysis: What's Defensible

**Critical:** Before simplifying the Results screen, we must understand which data points are grounded in solid methodology vs. which imply precision we don't have.

### ✅ DEFENSIBLE: Keep Prominently

| Element | How It's Calculated | Why It's Solid |
|---------|---------------------|----------------|
| **PAES Score (range)** | Weighted formula based on 16 real PAES questions, route factor, coverage factor. Range = ±5 questions via official PAES table. | Based on actual performance on real PAES questions. Range communicates uncertainty appropriately. |
| **+X Points Projections** | Question Unlock Algorithm: mastered atoms → unlocked questions → PAES table lookup. Capped at 1000, includes ±15% uncertainty. | Solid logic chain grounded in knowledge graph. "If you master these atoms, you can answer these questions, which = X points." |
| **Learning Routes** | Groups atoms by axis, calculates questions each route would unlock, converts to points via PAES table. | Same solid foundation as point projections. Actionable and grounded. |
| **Low Hanging Fruit** | Counts questions where only 1-2 atoms are missing from being unlocked. | About question proximity, not mastery claims. Useful and accurate. |

### ❌ NOT DEFENSIBLE: Remove or Reframe

| Element | Current Display | Why It's Misleading |
|---------|-----------------|---------------------|
| **Axis Mastery Percentages** | "Álgebra: 72% (58/80 átomos)" | We only test a SUBSET of atoms. Atoms not tested default to "not mastered." This systematically underestimates mastery and implies precision we don't have. |
| **"X/Y atoms mastered" per axis** | "58/80 átomos" | Same problem. A student who knows 90% of Algebra might show 50% because we only tested atoms they happened to miss. |
| **Specific total atom counts** | "87 átomos por dominar" | Implies we know exactly which atoms the student needs. In reality, "not mastered" often means "not tested and couldn't infer." |
| **Precise time estimates** | "~12 semanas a 30 min/día" | Based on atom counts, which have the problem above. |

### ⚠️ REFRAME: Keep Concept, Change Presentation

| Element | Current | Better Approach |
|---------|---------|-----------------|
| Axis comparison | Percentages | Qualitative: "Tu mayor oportunidad: Álgebra" (based on which route has highest point gain) |
| Time framing | "~12 semanas" | Vague: "Con dedicación constante, verás progreso en semanas, no meses" |
| Atom counts in routes | "12 átomos" | Keep but de-emphasize — focus on questions unlocked and points gained |

### Summary Decision Table

| Show | Hide/Remove | Reframe |
|------|-------------|---------|
| PAES score + range | Axis mastery percentages | Axis comparison → qualitative |
| +X points projections | "X/Y átomos" displays | Time estimates → vague |
| Learning route cards | "Maximum Potential" section | Atom counts → de-emphasized |
| Low hanging fruit | Precise time calculations | |
| Questions unlocked | | |

---

## Expectation Setting & High Performers

### The Problem

A 16-question diagnostic is an **estimation**, not a comprehensive assessment. Two issues arise:

1. **All students** might think the diagnostic is more precise than it is, leading to:
   - Frustration when real PAES differs
   - Loss of trust ("this is crap")
   
2. **High performers** (14+/16 correct) get a weird experience:
   - Score shows 910 (range 880-1000) — confusing ("I got everything right, why not 1000?")
   - Shows "Tu fortaleza: Álgebra" / "Tu oportunidad: Geometría" — **but we have no evidence of weakness!**
   - Suggests "+24 puntos de mejora" — **but we don't actually know what they need**

The current design assumes everyone has clear weaknesses to show. For high performers, we're making up recommendations we can't defend.

---

### Part 1: Set Expectations (For Everyone)

#### Welcome Screen — Add Context

Add a subtle note that frames what this diagnostic IS:

```tsx
// Near the "16 Preguntas · 30 Minutos" info cards
<p className="text-sm text-cool-gray mt-4 text-center">
  Estimación basada en 16 preguntas PAES oficiales.
  Con más práctica, tu perfil se vuelve más preciso.
</p>
```

#### Results Screen — Explain the Range

For everyone (not just high performers), add a small explainer below the score:

```tsx
<p className="text-xs text-cool-gray mt-2 text-center">
  Tu rango refleja la incertidumbre de un diagnóstico corto.
  Mientras más practiques, más preciso será tu perfil.
</p>
```

This normalizes uncertainty and sets up the value prop of continued engagement.

---

### Part 2: Special Handling for High Performers

#### Detection Logic

```typescript
const isHighPerformer = useMemo(() => {
  // Got 14+ out of 16 right
  if (totalCorrect >= 14) return true;
  
  // Very little room to improve per algorithm
  if (potentialImprovement < 20) return true;
  
  // Already unlocked most questions
  if (routesData?.summary) {
    const unlockRatio = routesData.summary.unlockedQuestions / 
                        routesData.summary.totalQuestions;
    if (unlockRatio > 0.85) return true;
  }
  
  return false;
}, [totalCorrect, potentialImprovement, routesData]);
```

#### High Performer Results Experience

When `isHighPerformer` is true, show a DIFFERENT results layout:

```
┌─────────────────────────────────────────────────────────┐
│  ✓ Diagnóstico Completado                              │
│                                                         │
│  Tu Puntaje PAES Estimado                              │
│                                                         │
│              ┌───────────┐                              │
│              │  880-1000 │  ← Show range prominently   │
│              └───────────┘                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎉 ¡Excelente!                                  │   │
│  │                                                 │   │
│  │ Respondiste 15/16 correctamente.               │   │
│  │                                                 │   │
│  │ Este diagnóstico no detectó debilidades        │   │
│  │ significativas en los conceptos evaluados.     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📈 ¿Qué sigue?                                  │   │
│  │                                                 │   │
│  │ Para mantener este nivel y descubrir áreas     │   │
│  │ de refinamiento más sutiles, tu plan           │   │
│  │ personalizado incluirá práctica avanzada       │   │
│  │ y simulacros completos.                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [  Guardar mis Resultados  ]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Te avisamos cuando tu plan avanzado esté listo.      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### What's Different for High Performers

| Normal Experience | High Performer Experience |
|-------------------|---------------------------|
| "Puedes subir +48 puntos" | **Skip** — we don't have evidence of what to improve |
| "Tu fortaleza: X" / "Tu oportunidad: Y" | **Skip** — we didn't detect weaknesses |
| Learning route cards | **Skip or minimize** — show "práctica avanzada" framing |
| Low hanging fruit | **Skip** — likely very few questions left to unlock |
| Focus: **improvement** | Focus: **maintenance + refinement** |

#### Implementation

```tsx
// In ResultsScreen.tsx
{isHighPerformer ? (
  <HighPerformerResults 
    scoreRange={{ min: results.paesMin, max: results.paesMax }}
    correctCount={totalCorrect}
    totalQuestions={16}
    onSignup={onSignup}
  />
) : (
  <StandardResults 
    results={results}
    improvement={potentialImprovement}
    routes={sortedRoutes}
    lowHangingFruit={routesData?.lowHangingFruit}
    onSignup={onSignup}
  />
)}
```

#### New Component: `HighPerformerResults.tsx`

Create a simpler results component for high performers:

```tsx
interface HighPerformerResultsProps {
  scoreRange: { min: number; max: number };
  correctCount: number;
  totalQuestions: number;
  onSignup: () => void;
}

export function HighPerformerResults({
  scoreRange,
  correctCount,
  totalQuestions,
  onSignup,
}: HighPerformerResultsProps) {
  return (
    <div className="text-center">
      {/* Score */}
      <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">
        Tu Puntaje PAES Estimado
      </h1>
      <div className="text-5xl font-bold text-primary my-4">
        {scoreRange.min}-{scoreRange.max}
      </div>
      
      {/* Congratulations */}
      <div className="card p-6 mb-6 bg-success/5 border-success/20">
        <div className="text-2xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-charcoal mb-2">¡Excelente!</h2>
        <p className="text-cool-gray">
          Respondiste <strong>{correctCount}/{totalQuestions}</strong> correctamente.
        </p>
        <p className="text-cool-gray mt-2">
          Este diagnóstico no detectó debilidades significativas 
          en los conceptos evaluados.
        </p>
      </div>
      
      {/* Next steps */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-charcoal mb-2">📈 ¿Qué sigue?</h3>
        <p className="text-cool-gray">
          Para mantener este nivel y descubrir áreas de refinamiento 
          más sutiles, tu plan personalizado incluirá práctica avanzada 
          y simulacros completos.
        </p>
      </div>
      
      {/* CTA */}
      <button onClick={onSignup} className="btn-cta w-full py-4 text-lg">
        Guardar mis Resultados
      </button>
      <p className="text-sm text-cool-gray mt-4">
        Te avisamos cuando tu plan avanzado esté listo.
      </p>
    </div>
  );
}
```

---

### Copy for High Performers

| Element | Copy |
|---------|------|
| Congratulations | "¡Excelente! Respondiste X/16 correctamente." |
| Honesty | "Este diagnóstico no detectó debilidades significativas en los conceptos evaluados." |
| Value prop | "Para mantener este nivel y descubrir áreas de refinamiento más sutiles, tu plan personalizado incluirá práctica avanzada y simulacros completos." |
| CTA context | "Te avisamos cuando tu plan avanzado esté listo." |

---

### Copy for Setting Expectations (Everyone)

| Location | Copy |
|----------|------|
| Welcome screen | "Estimación basada en 16 preguntas PAES oficiales. Con más práctica, tu perfil se vuelve más preciso." |
| Results screen (below score) | "Tu rango refleja la incertidumbre de un diagnóstico corto. Mientras más practiques, más preciso será tu perfil." |

---

### Why This Matters for Conversion

**For normal students:** The "you can improve" message is motivating.

**For high performers:** The same message is confusing/insulting. They might think:
- "This test is broken — I got everything right but it says I have weaknesses?"
- "Why should I sign up if they don't even know what I need?"

A **tailored high-performer experience** says:
- "We see you're advanced"
- "We're honest that we can't pinpoint weaknesses from 16 questions"
- "Your plan will include advanced content to find subtle refinements"

This builds trust and sets appropriate expectations for ALL users.

---

## Changes Overview

```
CURRENT FLOW:
Landing → Welcome → Questions (16) → Transition → Results → Signup → Thank You

CHANGES:
Landing     [+] Add "Ver ejemplo de resultado" button → opens modal
            [+] Add light social proof
            [+] Consider parent-aware section

Welcome     [~] Update time messaging ("15 minutos")
            [+] Add credibility badges
            [+] Add expandable "¿Cómo funciona?"
            [~] Update footer (save & resume clarity)

Results     [-] REMOVE axis mastery percentages (misleading)
            [-] REMOVE "X/Y átomos" displays (misleading)
            [-] REMOVE "Tu Potencial Máximo" section (misleading)
            [-] REMOVE precise time estimates (misleading)
            [~] SIMPLIFY RouteCard (keep questions + points only)
            [~] Two-phase reveal (score + #1 route → more routes)
            [~] Update copy framing (loss/challenge)
            [+] Highlight low hanging fruit (defensible, useful)

All Screens [+] Add analytics events
```

### Key Principle: Show Only Defensible Data

```
KEEP (Defensible)           REMOVE (Misleading)
─────────────────           ───────────────────
✅ PAES score range         ❌ Axis % mastery
✅ +X points projection     ❌ "X/Y átomos" per axis
✅ Questions unlocked       ❌ Precise time estimates
✅ Low hanging fruit        ❌ "Maximum Potential" section
✅ #1 learning route        ❌ Atom counts (de-emphasize)
```

---

## Priority 1: Example Results Preview

### Goal
Reduce uncertainty before users commit 20 minutes. Let them SEE what they'll get.

### Location
- Landing page: "Ver ejemplo de resultado" button in hero section
- Optional: Also accessible from Welcome screen

### Format
Modal/overlay with a **visual dashboard preview** (not text explanation).

### Content Structure

**Important:** The preview should mirror the ACTUAL results page structure — showing only defensible elements (score, points projections, learning routes), NOT the misleading axis percentages.

```
┌─────────────────────────────────────────────────────────┐
│  [X] Close                                              │
│                                                         │
│  Así se verán tus resultados                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Tu Puntaje PAES Estimado                │   │
│  │                                                 │   │
│  │              ┌───────────┐                      │   │
│  │              │  650-720  │  ← Score RANGE      │   │
│  │              └───────────┘                      │   │
│  │                                                 │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │ ⭐ Buen punto de partida                │   │   │
│  │  │                                         │   │   │
│  │  │ 📈 Puedes subir hasta +68 puntos       │   │   │
│  │  │    con un plan enfocado                 │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Tu ruta de mayor impacto:                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎯 RECOMENDADO                                  │   │
│  │                                                 │   │
│  │ Geometría                                       │   │
│  │                                                 │   │
│  │ Dominar estos conceptos te permitiría:         │   │
│  │ • Desbloquear +12 preguntas PAES               │   │
│  │ • Subir hasta +32 puntos                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Además: 5 preguntas a solo 1 concepto de          │
│     distancia — victorias rápidas.                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [  Descubrir mi puntaje real  ]  ← CTA        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  16 preguntas · ~15 minutos · Resultados inmediatos   │
│                                                         │
│  ℹ️ Ejemplo ilustrativo. Tu resultado será            │
│     personalizado según tu desempeño.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Design Requirements

1. **Highly visual** — Gen Z scans, doesn't read
   - Large score range (not fake precision)
   - Card-based layout for learning route
   - Clean, uncluttered

2. **Show only defensible data**
   - Score as a RANGE (not single number)
   - Points improvement projection (grounded in algorithm)
   - Questions unlocked (grounded in knowledge graph)
   - Low hanging fruit insight
   - **NO axis percentages** — these are misleading

3. **Realistic example data**
   - Score range: 650-720 (mid-range, relatable)
   - Improvement: +68 puntos (realistic)
   - Route example: Geometría

4. **Mobile-first** — many students will view on phone

5. **Clear CTA** — "Descubrir mi puntaje real" button at bottom

6. **Subtle disclaimer** — "Ejemplo ilustrativo. Tu resultado será personalizado."

### Implementation Notes

- Create new component: `ExampleResultsModal.tsx`
- Reuse existing design tokens and card styles
- Add to Landing page hero section as secondary action
- Track: `example_preview_opened`, `example_preview_cta_clicked`
- **Do NOT copy the current ResultsScreen structure** — the preview should match the NEW simplified structure

---

## Priority 2: Results Screen Simplification

### Goal
1. Reduce cognitive load — show the essential "Aha moment" first
2. Remove misleading data — only show what we can defend
3. Focus on conversion — CTA visible without scrolling

### Current Problems

1. **Too much information** — overwhelming after a 20-minute test
2. **Misleading data displayed:**
   - Axis mastery percentages (based on incomplete atom sampling)
   - "X/Y átomos" displays (implies knowledge we don't have)
   - Precise time estimates (based on questionable atom counts)
3. **CTA buried** — user must scroll past multiple sections
4. **Competing actions** — multiple sections distract from signup

### What to REMOVE Entirely

| Element | Reason |
|---------|--------|
| **Axis progress bars with percentages** | Misleading — we only test a subset of atoms, can't claim "72% mastery" |
| **"X/Y átomos mastered" displays** | Same problem — false precision |
| **"Maximum Potential" section** | Depends on misleading atom counts |
| **Specific time estimates** ("~12 semanas") | Based on atom counts we can't defend |
| **Multiple route cards initially** | Information overload; show #1 only |

### What to KEEP (Defensible)

| Element | Why It's Solid |
|---------|----------------|
| **PAES Score (range)** | Based on actual PAES question performance |
| **+X Points projection** | Grounded in Question Unlock Algorithm |
| **#1 Learning Route** | Questions unlocked → points gain is defensible |
| **Low hanging fruit** | "X questions at 1 atom away" — about question proximity |
| **Question review** | Useful, not misleading |

### New Two-Phase Design

#### Phase 1: Essential Aha (Always Visible, Above Fold)

```
┌─────────────────────────────────────────────────────────┐
│  [Arbor Logo]                                          │
│                                                         │
│  ✓ Diagnóstico Completado                              │
│                                                         │
│  Tu Puntaje PAES Estimado                              │
│                                                         │
│              ┌───────────┐                              │
│              │  680-740  │  ← Range, animated          │
│              └───────────┘                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⭐ Buen punto de partida                        │   │
│  │                                                 │   │
│  │ 📈 Puedes subir hasta +48 puntos con un plan  │   │
│  │    enfocado en los conceptos correctos.        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Tu ruta de mayor impacto:                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎯 RECOMENDADO                                  │   │
│  │                                                 │   │
│  │ Álgebra y Funciones                            │   │
│  │                                                 │   │
│  │ Dominar estos conceptos te permitiría:         │   │
│  │ • Desbloquear +8 preguntas PAES                │   │
│  │ • Subir hasta +24 puntos                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Tienes 5 preguntas a solo 1 concepto de           │
│     distancia — victorias rápidas que suman puntos.   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [  Guardar mis Resultados  ]  ← Primary CTA   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Guarda tu diagnóstico y te avisamos cuando tu plan   │
│  de estudio personalizado esté listo.                  │
│                                                         │
│  ▼ Ver más rutas de aprendizaje                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Phase 2: Expanded Details (On Click)

Only show additional DEFENSIBLE information:

```
┌─────────────────────────────────────────────────────────┐
│  Otras rutas de aprendizaje:                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Geometría                                       │   │
│  │ +6 preguntas · +18 puntos potenciales          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Números                                         │   │
│  │ +4 preguntas · +12 puntos potenciales          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ────────────────────────────────────────────────────  │
│                                                         │
│  📊 Tu desempeño en el diagnóstico: 10/16 correctas   │
│                                                         │
│  📋 Revisar mis respuestas →                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [  Guardar mis Resultados  ]  ← Secondary CTA │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### What's Different from Current

| Current | New |
|---------|-----|
| Shows axis % mastery bars | **REMOVED** — misleading |
| Shows "58/80 átomos" | **REMOVED** — misleading |
| Shows "~12 semanas a 30min/día" | **REMOVED** — misleading |
| Shows "87 átomos por dominar" | **REMOVED** — misleading |
| Shows 3 route cards immediately | Shows **1 route** initially |
| Has "Maximum Potential" section | **REMOVED** |
| CTA below multiple sections | CTA **above fold** |
| Multiple collapsible sections | **One expand** for more routes |

### Implementation Changes

#### 1. ResultsScreen.tsx — Major Refactor

```tsx
// NEW STATE
const [showMoreRoutes, setShowMoreRoutes] = useState(false);

// PHASE 1: Always visible
// - Score with range
// - Motivational message + points projection  
// - ONE recommended route (focus on questions + points, not atoms/time)
// - Low hanging fruit insight
// - Primary CTA
// - "Ver más rutas" toggle

// PHASE 2: On expand
// - Routes 2-3 (simplified cards)
// - Stats summary (X/16 correctas)
// - Review button
// - Secondary CTA
```

#### 2. Remove These Components/Sections

- `AxisProgressBar` component — or repurpose without percentages
- "Tu Perfil por Eje" section entirely
- "Tu Potencial Máximo" section entirely
- Time estimates from route cards
- Atom counts from route cards (or de-emphasize significantly)

#### 3. Simplify RouteCard Component

**Current RouteCard shows:**
- Atom count
- Questions unlocked
- Points gain
- Study hours

**New RouteCard shows:**
- Questions unlocked (defensible)
- Points gain (defensible)
- That's it — clean and focused

```tsx
// SIMPLIFIED ROUTE CARD
<div className="card p-5">
  {isRecommended && <Badge>🎯 RECOMENDADO</Badge>}
  <h4 className="font-bold text-lg">{route.title}</h4>
  <p className="text-cool-gray text-sm mb-4">
    Dominar estos conceptos te permitiría:
  </p>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <UnlockIcon />
      <span>+{route.questionsUnlocked} preguntas PAES</span>
    </div>
    <div className="flex items-center gap-2 text-success font-semibold">
      <TrendUpIcon />
      <span>+{route.pointsGain} puntos</span>
    </div>
  </div>
</div>
```

#### 4. Update Copy Framing

**Current:**
> "Con trabajo enfocado puedes subir +48 puntos"

**New (challenge framing):**
> "Puedes subir hasta +48 puntos con un plan enfocado en los conceptos correctos."

Or loss-prevention:
> "Tienes +48 puntos de potencial esperando. No los dejes sobre la mesa."

#### 5. Low Hanging Fruit — Keep and Highlight

This IS defensible and valuable. Reframe as:

> "💡 Tienes **5 preguntas** a solo 1 concepto de distancia — victorias rápidas que suman puntos fáciles."

### Mobile Considerations

- Phase 1 MUST fit on one mobile screen
- CTA visible without scrolling
- Score and improvement projection above fold
- Single route card (not multiple)

---

## Priority 3: Credibility & Trust Elements

### Welcome Screen Additions

#### 1. Credibility Badge (near title)

```tsx
<div className="inline-flex items-center gap-2 text-sm text-cool-gray 
  bg-primary/5 px-3 py-1.5 rounded-full mb-4">
  <CheckCircleIcon className="w-4 h-4 text-primary" />
  Basado en preguntas PAES oficiales
</div>
```

**Placement:** Above or below the main title "Prueba Diagnóstica PAES M1"

#### 2. Expandable "¿Cómo funciona?" Section

```tsx
<details className="bg-white/50 rounded-xl p-4 mt-6 text-left">
  <summary className="font-medium text-charcoal cursor-pointer 
    flex items-center gap-2">
    <QuestionMarkCircleIcon className="w-5 h-5 text-primary" />
    ¿Cómo funciona este diagnóstico?
  </summary>
  <div className="mt-4 text-sm text-cool-gray space-y-3">
    <p>
      <strong>Preguntas reales:</strong> Usamos preguntas de pruebas 
      PAES oficiales para medir tu nivel actual.
    </p>
    <p>
      <strong>Diagnóstico adaptativo:</strong> Las preguntas se ajustan 
      a tu desempeño para un resultado más preciso.
    </p>
    <p>
      <strong>Plan personalizado:</strong> Identificamos exactamente qué 
      conceptos necesitas dominar para subir tu puntaje.
    </p>
  </div>
</details>
```

**Placement:** After the tips section, before the CTA button

#### 3. Updated Footer Text

Current:
> "Tu diagnóstico se guarda automáticamente al final"

New:
> "Tu progreso se guarda automáticamente. Puedes cerrar y continuar después."

#### 4. Privacy Note (subtle)

Add to existing trust indicators or as small text:
> "🔒 Tus datos están seguros y no los compartimos con terceros."

### Landing Page Additions

#### 1. Light Social Proof

In hero section, add subtle social proof:
```tsx
<p className="text-sm text-cool-gray mt-4">
  Únete a estudiantes que ya descubrieron su potencial
</p>
```

**Note:** Keep it subtle. Avoid specific numbers unless real. Gen Z detects fake social proof.

#### 2. Parent-Aware Section (Optional)

Consider adding a small expandable or section:

```tsx
<div className="mt-8 p-4 bg-primary/5 rounded-xl">
  <h4 className="font-medium text-charcoal flex items-center gap-2">
    <UsersIcon className="w-5 h-5 text-primary" />
    Para padres
  </h4>
  <p className="text-sm text-cool-gray mt-2">
    Arbor muestra exactamente qué conceptos le faltan a tu hijo y 
    cuánto tiempo toma dominarlos. Sin horas perdidas en contenido 
    que ya sabe. Sin estrés innecesario.
  </p>
</div>
```

**Placement:** After "How it works" section or in footer area

---

## Priority 4: Copy & Framing Updates

### Principles

1. **Challenge framing, not threat framing**
   - ❌ "Si no te preparas, perderás puntos"
   - ✅ "Descubre qué tan cerca estás de tu meta"

2. **Loss prevention framing (subtle)**
   - ❌ "Puedes ganar +50 puntos"
   - ✅ "Estás a 50 puntos de tu potencial"
   - ✅ "No dejes puntos sobre la mesa"

3. **Time-to-value messaging**
   - Emphasize speed: "En 15 minutos sabrás..."
   - Make commitment feel small: "Solo 16 preguntas"

4. **Concrete, not vague**
   - ❌ "Mejora tu puntaje"
   - ✅ "Sube hasta 68 puntos con un plan enfocado"

### Specific Copy Changes

#### Landing Page Hero

Current:
> "Alcanza tu puntaje PAES dominando un concepto a la vez"

Keep as-is (good). Add subtitle:
> "En 15 minutos descubre exactamente qué estudiar para subir tu puntaje."

#### Landing Page CTA

Current:
> "Tomar el Diagnóstico Gratis"

Update to:
> "Descubrir mi Puntaje"

(More concrete, outcome-focused)

#### Welcome Screen Title

Current:
> "Prueba Diagnóstica PAES M1"

Keep as-is.

#### Welcome Screen Subtitle

Current:
> "Descubre tu nivel actual y qué necesitas aprender para alcanzar tu puntaje meta."

Update to:
> "En 15 minutos sabrás exactamente qué conceptos dominar para subir tu puntaje."

(Added time-to-value, more concrete)

#### Welcome Screen Info Cards

Current: "30 Minutos"

Consider: "~15 min" (more accurate for most users, feels less daunting)

Or keep "30 min" as the max but add context:
> "30 min máx" or show "15-20 min" as typical

#### Results Screen Motivational Message

Current logic in `getMotivationalMessage()` returns messages like:
> "¡Buen punto de partida!"

Add the loss/challenge frame below it:
> "Estás a X puntos de tu potencial máximo. Con un plan enfocado, puedes cerrar esa brecha."

#### Results Screen Improvement Display

Current:
> "Con trabajo enfocado puedes subir **+48 puntos**"

Update to:
> "Estás a **48 puntos** de tu potencial. Descubre cómo cerrar esa brecha."

Or:
> "**48 puntos** de mejora esperan. No los dejes sobre la mesa."

#### Signup Screen CTA

Current:
> "Guardar y Notificarme"

Keep as-is (good framing per Pillar 9).

#### Results CTA Button

Current:
> "Guardar mis Resultados"

Keep as-is (good).

---

## Priority 5: Analytics Instrumentation

### Recommended Tool: PostHog

**Why PostHog:**
- Free tier is generous (1M events/month)
- Funnel analysis built-in
- Session recordings (see where users struggle)
- Feature flags for A/B testing later
- Self-hosted option if privacy concerns

**Alternative:** If simpler setup preferred, use Vercel Analytics + custom events to a simple backend endpoint.

### Installation

```bash
npm install posthog-js
```

```tsx
// app/providers.tsx or layout.tsx
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false // We'll capture manually
  })
}
```

### Events to Track

See [Analytics Events Specification](#analytics-events-specification) below.

---

## Copy Guidelines

### Core Principles

#### 1. Never Claim Precision You Can't Defend

| ❌ Misleading | ✅ Honest |
|---------------|-----------|
| "Dominas 72% de Álgebra" | "Tu mayor oportunidad: Álgebra" |
| "58/80 átomos" | Don't show atom counts per axis |
| "~12 semanas exactas" | "Con dedicación constante, verás progreso en semanas" |
| "87 átomos por dominar" | Focus on questions/points, not atom counts |

**Why:** We only sample a subset of atoms. Claiming percentage mastery implies knowledge we don't have.

#### 2. Focus on Defensible Metrics

| Defensible (show prominently) | Not Defensible (hide or remove) |
|-------------------------------|--------------------------------|
| PAES score range | Axis mastery percentages |
| +X points projection | Specific atom counts |
| Questions unlocked | Precise time estimates |
| Low hanging fruit (questions near unlock) | "X/Y átomos" displays |

### Do's

| Principle | Example |
|-----------|---------|
| Be concrete (with defensible data) | "Desbloquea +12 preguntas PAES" |
| Use time anchors | "En 15 minutos" not "Rápidamente" |
| Challenge framing | "Descubre tu potencial" not "Evita el fracaso" |
| Loss prevention (subtle) | "No dejes puntos sobre la mesa" |
| Show the outcome | "Sabrás exactamente qué estudiar" |
| Conservative claims | "hasta X puntos" not "garantizado X puntos" |
| Use ranges for uncertainty | "650-720 puntos" not "685 puntos" |

### Don'ts

| Avoid | Why |
|-------|-----|
| Hype language ("increíble", "revolucionario") | Gen Z detects inauthenticity |
| Threat framing ("vas a reprobar") | Decreases engagement per research |
| Vague promises ("mejora tu futuro") | Not actionable, not credible |
| Pressure tactics ("última oportunidad") | Creates anxiety, backfires |
| Fake social proof ("10,000 estudiantes") | Only use real numbers |
| Precise metrics from incomplete data | Creates false confidence, damages trust |
| Percentage mastery claims | We can't verify full mastery |

### Tone

- **For students:** Direct, confident, slightly casual. Peer-to-peer energy.
- **For parents:** Reassuring, professional, supportive. "We've got this handled."

---

## Analytics Events Specification

### Core Funnel Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `landing_page_viewed` | Landing page loads | `referrer`, `device_type` |
| `example_preview_opened` | User clicks "Ver ejemplo" | — |
| `example_preview_cta_clicked` | User clicks CTA in preview modal | — |
| `diagnostic_started` | User clicks "Comenzar Diagnóstico" | `source` (landing/welcome) |
| `question_answered` | User submits an answer | `question_index`, `stage`, `is_correct`, `is_dont_know`, `response_time_seconds` |
| `stage_1_completed` | User finishes question 8 | `correct_count`, `route_assigned` |
| `diagnostic_completed` | User finishes question 16 | `total_correct`, `time_elapsed_seconds`, `route` |
| `results_viewed` | Results screen loads | `paes_score`, `route`, `is_high_performer` |
| `results_details_expanded` | User clicks "Ver análisis completo" | — |
| `signup_prompted` | Signup screen loads | `paes_score` |
| `signup_completed` | User submits email | `paes_score` |
| `signup_skipped` | User clicks "Continuar sin guardar" | `paes_score` |
| `thankyou_viewed` | Thank you screen loads | `has_email` |

### Secondary Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `question_review_opened` | User opens review drawer | — |
| `route_card_clicked` | User interacts with learning route | `route_axis` |
| `session_restored` | User returns to in-progress diagnostic | `questions_completed` |
| `time_expired` | Timer reaches 0 | `questions_completed` |
| `high_performer_results_viewed` | High performer sees their results | `score_range`, `correct_count` |

### Drop-off Tracking

Track where users leave:
- Question index at abandonment
- Time on results page before leaving (without signup)
- Device type correlation with drop-offs

---

## Success Metrics

### Primary Metrics

| Metric | Current (estimate) | Target | How to Measure |
|--------|-------------------|--------|----------------|
| **Start Rate** | Unknown | >60% | `diagnostic_started` / `landing_page_viewed` |
| **Completion Rate** | Unknown | >70% | `diagnostic_completed` / `diagnostic_started` |
| **Signup Rate** | Unknown | >40% | `signup_completed` / `results_viewed` |

### Secondary Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Example preview engagement | >15% of landing visitors | If low, make more prominent |
| Results details expansion | >50% | Shows users want depth |
| Time on results (before CTA) | <60 seconds | If high, simplify more |
| Mobile completion rate | Within 10% of desktop | Parity across devices |

### Diagnostic Questions

Use data to answer:
1. **Low start rate?** → Uncertainty problem → Improve preview / credibility
2. **Low completion rate?** → Friction problem → Simplify diagnostic
3. **High completion, low signup?** → Value/CTA problem → Improve framing

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Set up PostHog (or chosen analytics)
- [ ] Add core funnel events
- [ ] Establish baseline metrics

### Phase 2: Quick Wins (Week 1-2)

- [ ] Update copy per guidelines (Welcome, Results, Landing)
- [ ] Add credibility badge to Welcome screen
- [ ] Add expandable "¿Cómo funciona?" to Welcome
- [ ] Update footer text (save & resume clarity)
- [ ] Update time messaging ("~15 minutos")
- [ ] **Add expectation-setting copy** to Welcome screen ("Estimación basada en 16 preguntas...")

### Phase 3: Results Screen Cleanup — Remove Misleading Data (Week 2)

**Critical — Do this BEFORE adding new features:**

- [ ] **Remove** "Tu Perfil por Eje" section entirely (axis mastery percentages)
- [ ] **Remove** "Tu Potencial Máximo" section entirely
- [ ] **Remove** axis progress bars with percentages
- [ ] **Remove** "X/Y átomos" displays
- [ ] **Remove** specific time estimates ("~12 semanas")
- [ ] **Simplify** RouteCard to show only questions + points (remove atom counts, study hours)
- [ ] **Remove** `AxisProgressBar` component (or repurpose without percentages)
- [ ] **Clean up** unused helper functions in ResultsComponents.tsx
- [ ] **Add** range explanation note below score for all users

### Phase 4: Results Screen Redesign — Two-Phase Reveal (Week 2-3)

- [ ] Implement Phase 1 (essential Aha): Score + improvement + #1 route + CTA
- [ ] Add "Ver más rutas" toggle for Phase 2
- [ ] Phase 2: Additional routes + stats summary + review button
- [ ] Ensure CTA is above fold on mobile
- [ ] Update copy to loss/challenge framing
- [ ] Keep and highlight low hanging fruit insight

### Phase 5: High Performer Handling (Week 3)

**Critical for trust with advanced students:**

- [ ] Add `isHighPerformer` detection logic in ResultsScreen
- [ ] Create `HighPerformerResults.tsx` component
- [ ] Implement conditional rendering (high performer vs standard)
- [ ] High performer experience: Skip improvement claims, show congratulations
- [ ] High performer copy: "No detectó debilidades significativas"
- [ ] High performer CTA: "Plan avanzado" framing
- [ ] Test edge cases: 14/16, 15/16, 16/16 correct

### Phase 6: Example Preview (Week 3-4)

- [ ] Design ExampleResultsModal component (matching new simplified Results structure)
- [ ] Implement modal with visual preview
- [ ] Add "Ver ejemplo" button to Landing page
- [ ] Track preview engagement events
- [ ] Mobile optimization
- [ ] **Important:** Preview should NOT show axis percentages (match new Results)

### Phase 7: Polish & Iterate (Week 4+)

- [ ] Review analytics data
- [ ] A/B test copy variants if traffic allows
- [ ] Add parent section if data suggests need
- [ ] Iterate based on funnel analysis

---

## Files to Modify

### Major Changes (Results Simplification)

| File | Changes |
|------|---------|
| `app/diagnostico/components/ResultsScreen.tsx` | **Major refactor:** Remove axis breakdown, simplify to two-phase reveal, remove misleading sections |
| `app/diagnostico/components/ResultsComponents.tsx` | **Remove** `AxisProgressBar` component, **Simplify** `RouteCard` (remove atom counts, time estimates), **Remove** atom-related helper functions |

### Moderate Changes

| File | Changes |
|------|---------|
| `app/page.tsx` | Add example preview button, social proof, optional parent section |
| `app/diagnostico/components/WelcomeScreen.tsx` | Credibility badge, expandable section, copy updates, footer |
| `app/diagnostico/page.tsx` | Add analytics event calls |
| `app/layout.tsx` | Add PostHog provider |

### New Files

| File | Purpose |
|------|---------|
| `app/components/ExampleResultsModal.tsx` | Example results preview modal for landing page |
| `app/diagnostico/components/HighPerformerResults.tsx` | Simplified results for students with 14+/16 correct |
| `app/lib/analytics.ts` | Analytics helper functions for PostHog events |

### Summary of Removals

From `ResultsScreen.tsx`:
- [ ] Remove "Tu Perfil por Eje" section (axis mastery percentages)
- [ ] Remove "Tu Potencial Máximo" section (atom counts, time estimates)
- [ ] Remove multiple route cards from initial view (show only #1)
- [ ] Remove `masteryByAxis` usage and related displays

From `ResultsComponents.tsx`:
- [ ] Remove or repurpose `AxisProgressBar` component
- [ ] Remove `ATOM_COUNTS` constant (no longer displayed)
- [ ] Remove `calculateAtomsDominated` function
- [ ] Remove `calculateTotalAtomsRemaining` function  
- [ ] Remove `getWeeksByStudyTime` function
- [ ] Simplify `RouteCard` to show only questions + points

---

## Appendix: Research Sources

- Gen Z UX research (Nielsen Norman Group, Smashing Magazine)
- Behavioral economics in education (NBER, IZA)
- Loss aversion and academic performance (Mannheim University)
- Fear appeals research (Journal of Educational Psychology)
- Chilean PAES context (AACRAO, Frontiers in Education)
- Nudging in education (EdTech Hub, ideas42)

---

*This document should be treated as a living spec. Update as we learn from analytics.*
