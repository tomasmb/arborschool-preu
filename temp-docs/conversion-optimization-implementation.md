# Conversion Optimization Implementation Plan

> **Status:** Active | **Last Updated:** 2026-01-25

**Goal:** Maximize users who complete the diagnostic AND sign up.

**Target Audience:**
- Primary: 18-year-old Chilean students preparing for PAES
- Secondary: Parents (often the decision-makers)

**Reference:** This document implements the principles from `docs/arbor-poc-conversion-pillars-v2.md`.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Audience Psychology](#audience-psychology)
3. [Data Defensibility](#data-defensibility)
4. [Performance Tier System](#performance-tier-system)
5. [Implementation: Results Screen](#implementation-results-screen)
6. [Implementation: Example Preview Modal](#implementation-example-preview-modal)
7. [Implementation: Credibility Elements](#implementation-credibility-elements)
8. [Implementation: Copy Updates](#implementation-copy-updates)
9. [Post-Signup Operational Contract](#post-signup-operational-contract)
10. [Configuration Constants](#configuration-constants)
11. [Analytics Specification](#analytics-specification)
12. [Success Metrics](#success-metrics)
13. [Implementation Checklist](#implementation-checklist)
14. [Files Reference](#files-reference)
15. [Appendix: Copy Dictionary](#appendix-copy-dictionary-findreplace)

---

## Core Principles

### What We're Changing

| Change | Effort | Impact | Priority |
|--------|--------|--------|----------|
| Analytics instrumentation (PostHog) — MVP only | Medium | High | P0 (engineering prerequisite) |
| Results Screen — Remove Misleading Data | High | Critical | P1a |
| Results Screen — Two-Phase Reveal | High | Critical | P1b |
| Performance Tier System (6 tiers) | High | Critical | P2 |
| Example Results Preview Modal | Medium | High | P3 |
| Credibility badges + expandable section | Low | Medium | P4 |
| Copy & framing updates | Low | Medium | P5 |
| Post-Signup Operational Flow | Medium | High | P6 |

**Note:** Analytics is P0 because we need baseline funnel rates and tier-segmented conversion before changing Results UX. MVP = 6 core events only; additional events added later based on bottleneck diagnosis. P1a/P1b are tightly coupled and should ship together.

### What We're NOT Changing

- Design system (colors, typography, components, spacing)
- Diagnostic flow (16 questions, adaptive)
- Signup screen layout
- Core projection algorithm logic (but filtering input to failed questions only)
- Visual quality standards (no low-quality assets or inconsistent styling)

### Guardrails (Non-Negotiables)

These must be preserved during all changes:

1. **Never add steps before value** unless they increase completion
2. **One primary action per page**
3. **Users always know:** where they are, what's next, and the effort level (e.g., "16 preguntas · ~15 min típico")
4. **Every claim must feel credible** — avoid hype
5. **Preview output when uncertainty is a barrier**
6. **Measure before/after** for any meaningful change
7. **Respect the design system** — use existing components, colors, and typography; no ad-hoc styling
8. **No low-quality visual elements** — avoid emojis in production UI (see note below)

**Emoji Note:** Wireframes in this document use emojis (🎯, ⭐, 💡, etc.) for quick visual communication during planning. **Do NOT implement emojis in production UI** — they render inconsistently across devices and look unprofessional. Instead, use:
- Heroicons or Lucide icons from the design system
- Tailwind-styled badges and visual indicators
- Color-coded borders/backgrounds for emphasis

### Value Framing Framework

Results must answer these questions to trigger "I need this":

| Question | What to Show |
|----------|--------------|
| **Where am I?** | PAES score range (current state) |
| **What should I do next?** | #1 learning route with clear action |
| **How much effort?** | Questions to unlock, vague time framing |
| **Why should I trust this?** | Based on real PAES questions, honest ranges |

The "Aha moment" happens when users connect: current situation → achievable outcome → manageable path.

### Signup Framing Principle

Convert by "saving progress," not "marketing signup":

- Frame as **continuity of value** (see [Results CTA Copy](#results-cta-copy) for canonical text)
- User understands what they'll receive and when
- Reduce perceived risk (easy opt-out posture)
- Ask AFTER value is delivered, not before

---

## Audience Psychology

### 18-Year-Old Students (Gen Z)

| Behavior | Design Implication |
|----------|-------------------|
| Low tolerance for uncertainty and irrelevant text | Clear hierarchy, scannable content, promise visible immediately |
| Instant gratification | Show value BEFORE asking for time commitment |
| Scan, don't read | Visual > text. Use gauges, progress bars, cards |
| Authenticity detection | Avoid hype. Conservative, honest claims only. |
| Loss aversion affects performance | Frame as "closing a gap" not "gaining points" |
| Challenge framing > threat framing | "Discover your potential" not "You'll fail without this" |

### Parents

| Behavior | Design Implication |
|----------|-------------------|
| Present-bias | Show value NOW, not "later when you sign up" |
| Trust is behavioral | Credibility signals > logical arguments |
| Want to support, not pressure | "Help your child" not "Fix your child" |

### Chile-Specific Context

| Context | Implication |
|---------|-------------|
| PAES is high-stakes and stressful | Don't add stress. Frame as clarity & confidence. |
| Official advice: "Don't overwhelm yourself" | Validates our simplification approach |
| Strong family involvement | Consider parent-specific messaging |

---

## Data Defensibility

**Reference:** See `docs/diagnostic-atom-coverage-analysis.md` for full simulation of all 65,536 possible diagnostic outcomes.

### Coverage Source of Truth

**Canonical statement:** Maximum observable coverage in simulation ranges **55–64%** depending on route; absolute best case observed was **63.8%** (Route B, all 16 correct). All coverage percentages in this document reference this range.

| Route | Best Case Coverage | Notes |
|-------|-------------------|-------|
| Route A (easy) | 60.7% | R1 score 0-3 |
| Route B (medium) | **63.8%** | R1 score 4-6, highest overall |
| Route C (hard) | 54.6% | R1 score 7-8, overlapping prerequisites |

### Diagnostic Coverage Constraints

> **Internal-only:** These counts must never appear in user-facing copy.

Key constraints from the outcome analysis that inform what we can/cannot show:

| Constraint | Value | Implication |
|------------|-------|-------------|
| Total atoms in system | 229 | Never show specific counts to users |
| Atoms never reachable | 45 (19.7%) | Some knowledge is unknowable from diagnostic |
| Maximum coverage (best case) | 55–64% | Even perfect scores don't reveal everything |
| Typical coverage (6-10 correct) | 15-24% | Most students have limited but actionable signal |
| Below Average coverage (3-5 correct) | ~10% | All have similar coverage; generic messaging appropriate |

**Route coverage paradox:** Route C (hard path, 7-8/8 on R1) provides *less* coverage than Route B (medium path) because advanced atoms share prerequisites. A 15/16 student may have less information than a 13/16 student. The tier system accounts for this via conservative projections for Near-Perfect.

### Critical Rule: Routes From Failed Questions Only {#routes-failed-only}

> **This is a canonical rule referenced throughout the document.**

**Routes must ONLY be based on atoms from questions the student got wrong.** Untested atoms (`source: not_tested`) should NEVER be used to generate route recommendations.

| Atom Source | Use for Routes? | Rationale |
|-------------|-----------------|-----------|
| `direct` + `mastered: false` | **Yes** | Student demonstrably doesn't know this |
| `direct` + `mastered: true` | No (already mastered) | — |
| `inferred` + `mastered: true` | No (already mastered) | — |
| `not_tested` | **No** | We have no evidence they don't know this |

**Implications by tier:**

| Tier | Wrong Answers | Route Source |
|------|---------------|--------------|
| Perfect (16/16) | 0 | None — no failed questions to base routes on |
| Near-Perfect (14-15) | 1-2 | Only atoms from those 1-2 wrong answers |
| High (11-13) | 3-5 | Atoms from 3-5 wrong answers |
| Average (6-10) | 6-10 | Atoms from 6-10 wrong answers |
| Below Average (3-5) | 11-13 | Many gaps, but use generic "Fundamentos" |
| Very Low (0-2) | 14-16 | Too many gaps, generic messaging only |

**Algorithm note:** The current Question Unlock algorithm treats `not_tested` atoms as gaps. For implementation, either:
1. Filter algorithm output to only include atoms with `source: direct`, OR
2. Modify algorithm to accept a flag for "direct failures only" mode

### Evidence Rules for Strengths/Weaknesses {#evidence-rules-for-strengthsweaknesses}

Apply the same "direct evidence only" principle to all strength/weakness UI claims:

| UI Element | Evidence Required | Label Guidance |
|------------|-------------------|----------------|
| **Weaknesses** | `source: direct` + `mastered: false` (wrong answers only) | Never show weaknesses without direct evidence |
| **Strengths** | `source: direct` + `mastered: true` (correct answers) | Use "base sólida" not "dominas X%" |
| **Inferred strengths** | `source: inferred` + `mastered: true` | Optional; if shown, label as "conceptos relacionados" |

**UI Non-Negotiables:**
- **Never show "Tu mayor oportunidad: X" for perfect scores** — no failed questions = no evidence of gaps
- **Never show axis comparisons without failed questions** — comparison requires detected weakness
- **Never show "X% dominio" for any axis** — incomplete coverage makes percentages misleading
- **Near-Perfect (14-15/16) must stay conservative** — only claim gaps for the 1-2 specific wrong answers

This rule prevents regressions where someone reintroduces weakness claims that lack direct evidence.

### Projection Rules (Implementation Contract) {#projection-rules}

All point projections must follow these rules to prevent overclaiming.

**Inputs:** Same as [Routes From Failed Questions Only](#routes-failed-only):
- Only atoms with `source: direct` AND `mastered: false` (from wrong answers)
- Never include `not_tested` or `inferred` atoms in projection calculations

**Output Style:**
- Always use "hasta +X" or ranges ("+X–Y puntos")
- Never use "garantizado", "seguro", or absolute language
- **Always include a conditional clause in the same sentence:** "si sigues la ruta", "al dominar estos conceptos", "con práctica enfocada"
- **Always scope to the diagnostic:** The projection is about gaps WE IDENTIFIED, not total possible improvement. Use "según este diagnóstico" or similar.

**Tier Caps:**

| Tier | Projection Rule |
|------|-----------------|
| Perfect (16/16) | **Off** — no failed questions, no basis for projection |
| Near-Perfect (14-15/16) | **Micro only** — "+3–6 puntos" tied explicitly to the 1-2 wrong answers |
| High (11-13/16) | **Full** — aggregate projection from all wrong answers allowed |
| Average (6-10/16) | **Moderate** — show top route projection only, not aggregate total |
| Below Average (3-5/16) | **Off** — large numbers are daunting, generic messaging only |
| Very Low (0-2/16) | **Off** — limited signal, no projections |

**Example compliant copy:**
- ✅ "Según este diagnóstico, podrías subir hasta +48 puntos al dominar los conceptos identificados."
- ✅ "Al dominar estos conceptos, podrías desbloquear hasta +48 puntos en preguntas PAES."
- ✅ "Tu mejora estimada con esta ruta: hasta +48 puntos."
- ❌ "Estás a 48 puntos de tu potencial." (implies cap on total improvement)
- ❌ "Ganarás +48 puntos." (implies guarantee)
- ❌ "Puedes subir +48 puntos en X horas." (time estimates are unreliable)

**What the projection means:** Points from mastering the specific atoms identified in THIS diagnostic → unlocking specific PAES questions. It is NOT a cap on total improvement, nor a time-based promise. Students can always improve more by studying beyond the identified gaps.

### Defensible Elements (Keep Prominently)

| Element | Why It's Solid |
|---------|----------------|
| **PAES Score (range)** | Based on actual PAES question performance. Range communicates uncertainty. |
| **+X Points Projections** | Based on atoms from failed questions only → questions that would unlock → PAES table lookup. |
| **Learning Routes** | Based on atoms from failed questions. We know these are real gaps. |
| **Low Hanging Fruit** | Questions where only 1-2 *tested* atoms are missing. About proximity to questions student failed. |

### Not Defensible Elements (Remove)

| Element | Why It's Misleading |
|---------|---------------------|
| **Axis Mastery Percentages** | We only test a SUBSET of atoms. Untested atoms default to "not mastered," systematically underestimating real mastery. |
| **"X/Y átomos mastered"** | Same problem. A student who knows 90% might show 50% because we only tested atoms they happened to miss. |
| **Specific total atom counts** | "87 átomos por dominar" implies precision we don't have. |
| **Precise time estimates** | Based on unreliable atom counts. |

### Summary Decision Table

| Show | Remove | Reframe |
|------|--------|---------|
| PAES score + range | Axis mastery percentages | Time estimates → vague ("progreso en semanas, no meses") |
| +X points projections (from failed questions only) | "X/Y átomos" displays | |
| Learning route cards (tiers with signal only) | "Maximum Potential" section | |
| Low hanging fruit | Precise time calculations | |
| Questions unlocked | Axis comparisons (unless direct evidence) | |

**Note:** "Tu mayor oportunidad: Álgebra" can only be shown if there are wrong answers in that axis. See [Evidence Rules](#evidence-rules-for-strengthsweaknesses).

---

## Performance Tier System

### Core Insight

A 16-question diagnostic gives different amounts of information depending on performance. Different performance levels require fundamentally different messaging strategies.

| Tier | Correct | What We Know | What We Don't Know |
|------|---------|--------------|-------------------|
| **Perfect** | 16/16 | Everything tested was correct | Where their gaps actually are |
| **Near-Perfect** | 14-15/16 | Strong + 1-2 specific weak areas | Whether weak areas are systematic |
| **High** | 11-13/16 | Clear pattern of strengths/gaps | Full extent of knowledge |
| **Average** | 6-10/16 | Mix of strengths and gaps | Full picture |
| **Below Average** | 3-5/16 | Struggling significantly | Whether it's ability, preparation, or test conditions |
| **Very Low** | 0-2/16 | Very limited signal | Results might be noise |

### Why Tiers Matter for Conversion

**Wrong message kills conversion:**

| Tier | Wrong Approach | Result |
|------|----------------|--------|
| Perfect | "Here are your weaknesses" | "This test is broken" → distrust |
| Near-Perfect | "+200 points improvement!" | "That's not realistic" → distrust |
| Average | Show all weaknesses | "This is overwhelming" → abandonment |
| Below Average | "+500 points possible!" | "That's impossible for me" → defeat |
| Very Low | Show low score prominently | "I'm terrible at math" → disengagement |

**Right message builds trust:**

| Tier | Right Approach | Result |
|------|----------------|--------|
| Perfect | "You're advanced, here's what's next" | "They understand my level" → trust |
| Near-Perfect | "Here's the ONE thing to fix" | "Specific and actionable" → trust |
| High | "Good foundation + clear path" | Standard full experience |
| Average | "Good foundation + clear next step" | "I can do this" → motivation |
| Below Average | "Starting point found, one step at a time" | "Manageable path" → hope |
| Very Low | "Let's start from foundations" | "They're not judging me" → openness |

### Behavioral Science Foundation

**Self-Determination Theory:** Feedback must make students feel capable of improvement. Every tier preserves "I can do this."

**Attribution Theory:**
| Attribution Type | Effect | Our Approach |
|------------------|--------|--------------|
| Internal + Controllable (effort) | Motivating | Frame gaps as "not learned YET" |
| Internal + Uncontrollable (ability) | Demotivating | Never imply fixed ability |
| External (test unfair) | Disengaging | Acknowledge test limitations honestly |

**Low Performer Research:** Negative feedback distorts learning and affective states. For struggling students: supportive not evaluative, focus on small wins, lead with what they DID get right.

**High Achiever Research:** May have perfectionism tendencies. Don't create anxiety with unfounded weakness claims.

### Tier Configuration (Source of Truth)

The `TIER_CONFIG` object below is the **single source of truth** for all tier-specific rules. Individual tier sections below provide wireframes and psychological context, but defer to this config for projection rules, limitation copy, and display flags.

```typescript
type PerformanceTier = 
  | 'perfect'      // 16/16
  | 'nearPerfect'  // 14-15/16
  | 'high'         // 11-13/16
  | 'average'      // 6-10/16
  | 'belowAverage' // 3-5/16
  | 'veryLow';     // 0-2/16

type SignalQuality = 'high' | 'medium' | 'low';
type ProjectionRule = 'none' | 'conservative' | 'moderate' | 'full';

type ScoreEmphasis = 'primary' | 'secondary' | 'minimal';

interface TierConfig {
  tier: PerformanceTier;
  signalQuality: SignalQuality;
  projectionRule: ProjectionRule;
  limitationCopy: string;
  showRoutes: boolean;
  showScore: boolean;
  scoreEmphasis: ScoreEmphasis; // primary = prominent, secondary = smaller, minimal = present but de-emphasized
}

function getPerformanceTier(totalCorrect: number): PerformanceTier {
  if (totalCorrect === 16) return 'perfect';
  if (totalCorrect >= 14) return 'nearPerfect';
  if (totalCorrect >= 11) return 'high';
  if (totalCorrect >= 6) return 'average';
  if (totalCorrect >= 3) return 'belowAverage';
  return 'veryLow';
}

const TIER_CONFIG: Record<PerformanceTier, TierConfig> = {
  perfect: {
    tier: 'perfect',
    // Signal is strong on strengths, weak on gap localization; keep medium by design.
    // Do not "fix" to 'high' — we cannot personalize without knowing gaps.
    signalQuality: 'medium',
    projectionRule: 'none',
    limitationCopy: 'No detectamos áreas de debilidad en los conceptos evaluados.',
    showRoutes: false,
    showScore: true,
    scoreEmphasis: 'primary',
  },
  nearPerfect: {
    tier: 'nearPerfect',
    signalQuality: 'high',
    // GUARDRAIL: Always conservative. Projections tied ONLY to the 1-2 wrong answers.
    // Never aggregate or imply large improvements. See "Near-Perfect Guardrail" section.
    projectionRule: 'conservative',
    limitationCopy: 'Identificamos área(s) específica(s) a partir de tus respuestas incorrectas.',
    showRoutes: true, // specific area only, from wrong answers
    showScore: true,
    scoreEmphasis: 'primary',
  },
  high: {
    tier: 'high',
    signalQuality: 'high',
    projectionRule: 'full',
    limitationCopy: 'Basado en tus respuestas, identificamos patrones claros.',
    showRoutes: true,
    showScore: true,
    scoreEmphasis: 'primary',
  },
  average: {
    tier: 'average',
    signalQuality: 'medium',
    projectionRule: 'moderate', // top route only
    limitationCopy: 'Tu diagnóstico nos da información valiosa sobre dónde enfocarnos.',
    showRoutes: true, // #1 only
    showScore: true,
    scoreEmphasis: 'primary',
  },
  belowAverage: {
    tier: 'belowAverage',
    signalQuality: 'low',
    projectionRule: 'none',
    limitationCopy: 'Identificamos un punto de partida. El diagnóstico breve no captura todo.',
    showRoutes: false, // generic "Fundamentos" next step, not calculated routes
    showScore: true,
    scoreEmphasis: 'secondary', // show but smaller/less prominent
  },
  veryLow: {
    tier: 'veryLow',
    signalQuality: 'low',
    projectionRule: 'none',
    limitationCopy: 'Con 16 preguntas, el resultado puede no reflejar todo lo que sabes.',
    showRoutes: false,
    showScore: true,
    scoreEmphasis: 'minimal', // present but de-emphasized, transparency for parents
  },
};
```

### Quick Reference: Tier Behavior

Derived from `TIER_CONFIG` above. **Do not modify this table directly** — update `TIER_CONFIG` instead.

| Tier | `projectionRule` | `showRoutes` | `scoreEmphasis` |
|------|------------------|--------------|-----------------|
| Perfect | `none` | `false` | `primary` |
| Near-Perfect | `conservative` | `true` (specific area) | `primary` |
| High | `full` | `true` | `primary` |
| Average | `moderate` | `true` (#1 only) | `primary` |
| Below Average | `none` | `false` | `secondary` |
| Very Low | `none` | `false` | `minimal` |

**Weaknesses:** Only shown when we have direct evidence from wrong answers. See [Evidence Rules](#evidence-rules-for-strengthsweaknesses).

### UX Invariant: Explain Why Something Is Missing

**Rule:** When a module is absent (routes, projections, weaknesses), always show `limitationCopy` near where that module would appear.

This is the strongest protection against "test is broken" reactions, especially for Perfect and Very Low tiers.

| Tier | Missing Module | Explanation Source |
|------|----------------|-------------------|
| Perfect | Routes, projections, weaknesses | `TIER_CONFIG.perfect.limitationCopy` |
| Near-Perfect | Aggregate projections | `TIER_CONFIG.nearPerfect.limitationCopy` |
| Below Average | Routes, projections | `TIER_CONFIG.belowAverage.limitationCopy` |
| Very Low | Routes, projections, score emphasis | `TIER_CONFIG.veryLow.limitationCopy` |

**Implementation:** `limitationCopy` from `TIER_CONFIG` is **mandatory** on every results screen. Position it:
- Near the top for low-signal tiers (Very Low, Below Average)
- Near absent modules (e.g., where routes would be for Perfect)

### Routes vs. Next Steps (Important Distinction)

| Concept | What It Is | When to Use |
|---------|-----------|-------------|
| **Route Card** | Calculated learning path with projections (questions unlocked, points gained) | Tiers with enough signal: high, average, nearPerfect (specific area only) |
| **Next Step Card** | Generic framing of what comes next, no projections | Tiers with limited signal: perfect, belowAverage, veryLow (`showRoutes: false`) |

**Key:** `showRoutes: false` in config means no calculated route cards, but we still show a "next step" to maintain the "I need this" hook. See [Routes From Failed Questions Only](#routes-failed-only) for the canonical rule.

### Signal Quality Variable (Future-Proofing)

`signalQuality` is included in `TIER_CONFIG` above. For now, tier maps directly to confidence. Later we can incorporate additional factors:

- Item difficulty (harder questions answered = stronger signal)
- Response time patterns (very fast responses = possible guessing)
- Adaptive path taken (reached harder questions = more data points)

This structure allows future refinement without restructuring tier logic.

### Edge Case Handling

| Scenario | Handling |
|----------|----------|
| **No clear strongest area** (correct answers evenly distributed) | Show "Tienes una base equilibrada" instead of specific axis |
| **No routes returned** from Question Unlock algorithm | Fall back to generic "Fundamentos" next step (same as Very Low) |
| **No low hanging fruit** (no questions within 1-2 atoms) | Omit that line from results display |
| **Calculation error** | Show completion message + contact support option |

### Wireframe Values

Values shown in tier wireframes below (score ranges, points, questions unlocked) are **illustrative examples**. Actual values are calculated by:
- PAES score range: `lib/diagnostic/paesScoreTable.ts`
- Points & questions unlocked: `lib/diagnostic/questionUnlock/`
- Low hanging fruit: `lib/diagnostic/questionUnlock/unlockCalculator.ts`
- Limitation copy: `TIER_CONFIG[tier].limitationCopy` (see [Tier Configuration](#tier-configuration-source-of-truth))

**Visual Note:** Wireframes use emojis for quick communication. In production, replace with design system icons (Heroicons/Lucide). See [Guardrails](#guardrails-non-negotiables).

---

### Tier 1: Perfect Score (16/16)

**Psychology:** Possibly perfectionist. We have NO detected weaknesses — can't claim to know gaps.

**What to Show:**
```
┌─────────────────────────────────────────────────────────────┐
│  Tu Puntaje PAES Estimado: 807-1000                        │
│                                                             │
│  🎉 ¡Resultado excepcional!                                │
│                                                             │
│  Respondiste las 16 preguntas correctamente.               │
│                                                             │
│  ℹ️ Este diagnóstico no detectó áreas de debilidad en los │
│     conceptos evaluados. Tu dominio es sólido.             │
│                                                             │
│  🎯 Tu siguiente paso (cuando lancemos):                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Práctica avanzada + Simulacros                      │   │
│  │ • Afinar tu tiempo y estrategia bajo presión       │   │
│  │ • Preguntas de dificultad máxima                    │   │
│  │ • Maximizar tu puntaje el día del test             │   │
│  │ Guarda tu progreso para recibir acceso prioritario │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
│                                                             │
│  ℹ️ ¿Por qué un rango? Con 16 preguntas tenemos alta      │
│     confianza, pero más práctica permite afinar aún más.  │
└─────────────────────────────────────────────────────────────┘
```

**Key:** Even without calculated routes, we give a concrete next step that feels real and valuable. The "Práctica avanzada + Simulacros" is framed as what will be available when we launch, not a current feature.

**What NOT to Show:**
- "Tu mayor oportunidad: Geometría" (no failed questions → no evidence of gaps)
- "+X puntos de mejora" (no failed questions → no basis for improvement claims)
- Learning route cards (routes require failed questions to identify gaps)
- Axis comparisons (no basis without failed questions)

---

### Tier 2: Near-Perfect (14-15/16)

**Psychology:** High achiever, may be frustrated by 1-2 mistakes. We CAN identify specific areas from wrong answers.

**What to Show:**
```
┌─────────────────────────────────────────────────────────────┐
│  Tu Puntaje PAES Estimado: 750-950                         │
│                                                             │
│  ⭐ ¡Excelente resultado!                                  │
│                                                             │
│  Respondiste 15/16 correctamente. Muy cerca del máximo.   │
│                                                             │
│  📍 Identificamos 1 área específica a partir de tu        │
│     respuesta incorrecta:                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Geometría: Transformaciones isométricas            │   │
│  │ • 1 concepto por reforzar                          │   │
│  │ • +3-6 puntos al dominar este tema                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Reforzar este concepto específico puede acercarte     │
│     al rango más alto.                                    │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
└─────────────────────────────────────────────────────────────┘
```

**Key principles:**
- Show specific concept(s) from wrong questions only
- Frame as "reforzar" not "debilidad"
- **Conservative projections:** Only show points from the 1-2 missed concepts ("+3-6 puntos"), never aggregate totals ("+150 puntos")
- This tier has `projectionRule: 'conservative'` — see `TIER_CONFIG` above

**Near-Perfect Guardrail (Implementation Rule):**

Due to the route coverage paradox (Route C provides less coverage than Route B), a 15/16 student may have less diagnostic information than a 13/16 student. Therefore:

1. **Never imply "higher score = more diagnostic signal"** in messaging
2. **Always tie projections explicitly to the 1-2 wrong answers** — not aggregate improvements
3. **Keep improvement claims minimal** — this tier's value is confirmation of strength, not improvement potential
4. **Edge case:** If `failedDirectAtoms.length === 0` (all wrong question atoms already inferred mastered), show "No detectamos áreas específicas…" and use generic next step

---

### Tier 3: High Performer (11-13/16)

**Psychology:** Competent and motivated. Clear patterns we can act on. This is the ideal case for standard results flow.

**Wireframe:** Uses the standard two-phase design shown in [Implementation: Results Screen](#implementation-results-screen). The Phase 1/Phase 2 wireframes there represent this tier's experience.

**What to Show:**
- Score + range (primary emphasis)
- Improvement projection (+X puntos, `projectionRule: 'full'`)
- Top learning route (#1 prominent, with "Ver más rutas" expansion)
- Low hanging fruit

**Tone:** "Buen punto de partida. Al dominar [Axis], podrías subir hasta +X puntos."

---

### Tier 4: Average (6-10/16)

**Psychology:** May feel uncertain. Need encouragement that improvement is achievable. Don't overwhelm.

**What to Show:**
```
┌─────────────────────────────────────────────────────────────┐
│  Tu Puntaje PAES Estimado: 520-700                         │
│                                                             │
│  📊 Ya tienes una base para construir                      │
│                                                             │
│  Respondiste 8/16 correctamente — información valiosa     │
│  sobre dónde enfocarnos.                                   │
│                                                             │
│  ✅ Lo que ya dominas:                                     │
│  • [Área más fuerte basada en correctas]                  │
│                                                             │
│  🎯 Tu ruta de mayor impacto:                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Álgebra y Funciones                                │   │
│  │ +12 preguntas PAES · +35 puntos potenciales        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Tienes 6 preguntas a solo 1 concepto de distancia.    │
│     Son puntos al alcance.                                 │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- Lead with what they got RIGHT
- Show ONE clear next step
- Emphasize quick wins (low hanging fruit)
- Frame as "building" not "fixing"

---

### Tier 5: Below Average (3-5/16)

**Psychology:** May feel defeated. Attribution risk: "I'm bad at math." Large improvement numbers would be daunting.

**What to Show:**
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Tu Diagnóstico                                         │
│                                                             │
│  🌱 Hemos identificado tu punto de partida                 │
│                                                             │
│  Respondiste 4/16 correctamente. Lo importante es que     │
│  tomaste el diagnóstico — ahora sabemos por dónde empezar.│
│                                                             │
│  ℹ️ Identificamos un punto de partida. El diagnóstico     │
│     breve no captura todo.                                 │
│                                                             │
│  ✅ Ya demuestras dominio en:                              │
│  • [Concepto específico de las correctas]                 │
│                                                             │
│  🎯 Tu primer paso (cuando lancemos):                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Fundamentos de Números                             │   │
│  │ Cuando la plataforma esté lista, continuaremos    │   │
│  │ por estos conceptos que desbloquean muchos otros  │   │
│  │ Guarda tu progreso para recibir acceso prioritario │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📈 Con los fundamentos sólidos, el progreso se acelera.  │
│     Un paso a la vez.                                      │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
│                                                             │
│  Tu rango estimado: 420-550                 (secondary)    │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Limitation + supportive framing FIRST** — user reads this before any number
- Score at bottom with "rango estimado" wording (secondary emphasis)
- Never show huge improvement numbers (daunting)
- Focus on "starting point discovered"
- Show what they DID get right
- Frame first step as "foundations"

**Critical implementation detail:** The first thing the user reads must be supportive framing, NOT the score. This prevents shame-driven drop-off while maintaining transparency for parents.

---

### Tier 6: Very Low (0-2/16)

**Psychology:** Could be testing anxiety, unfamiliarity, or external factors. Very limited signal. Risk of complete disengagement.

**What to Show:**
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Diagnóstico Completado                                 │
│                                                             │
│  Gracias por completar el diagnóstico.                    │
│                                                             │
│  ℹ️ Con solo 16 preguntas, a veces el resultado no refleja│
│     todo lo que sabes — especialmente si estabas bajo     │
│     presión o el formato era nuevo.                        │
│                                                             │
│  🎯 Tu siguiente paso (cuando lancemos):                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Fundamentos                                         │   │
│  │ Cuando la plataforma esté lista, continuaremos    │   │
│  │ por los conceptos base que desbloquean todo lo    │   │
│  │ demás. Un paso a la vez.                          │   │
│  │ Guarda tu progreso para recibir acceso prioritario │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Muchos estudiantes que empiezan aquí logran mejoras   │
│     significativas con práctica constante.                 │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
│                                                             │
│  ¿Tienes dudas? Escríbenos por WhatsApp →  (low-contrast)  │
│                                                             │
│  Tu rango estimado: 350-480                   (minimal)    │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Limitation + supportive framing FIRST** — the first thing user reads, before any number
- Score at very bottom with "rango estimado" wording (minimal emphasis, small text)
- Concrete next step ("Fundamentos") even without routes — maintains "I need this"
- Don't show improvement projections
- Provide social proof and human support option

**Critical implementation detail:** For veryLow and belowAverage, reading order matters. Limitation copy → supportive framing → next step → CTA → score (last). This prevents shame-driven drop-off while maintaining parent transparency.

**Autonomy Escape Hatches (instead of retake):**

Since retake with identical questions provides no value, offer alternative options:

| Option | Purpose | Implementation |
|--------|---------|----------------|
| "Guardar mi progreso" | Preserves progress, reduces pressure | Same as main CTA |
| "Hablar con nosotros" | Human support for uncertain students | Use `CONTACT_CONFIG` (see [Configuration Constants](#configuration-constants)) |
| "Ver ejemplo de resultados" | Shows what diagnostic results look like | Link to example or modal |

These maintain engagement without false promise of different results.

---

## Implementation: Results Screen

### Current Flow Change

```
CURRENT FLOW:
Landing → Welcome → Questions (16) → Transition → Results → Signup → Thank You

RESULTS SCREEN CHANGES:
[-] REMOVE axis mastery percentages
[-] REMOVE "X/Y átomos" displays
[-] REMOVE "Tu Potencial Máximo" section
[-] REMOVE precise time estimates
[~] SIMPLIFY RouteCard (keep questions + points only)
[+] IMPLEMENT 6-tier results system
[+] Two-phase reveal (essential above fold, details on expand)
```

### Two-Phase Design

#### Phase 1: Essential (Above Fold)

```
┌─────────────────────────────────────────────────────────────┐
│  [Arbor Logo]                                              │
│                                                             │
│  ✓ Diagnóstico Completado                                  │
│                                                             │
│  Tu Puntaje PAES Estimado                                  │
│              ┌───────────┐                                  │
│              │  680-740  │                                  │
│              └───────────┘                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⭐ Buen punto de partida                            │   │
│  │ 📈 Al dominar los conceptos identificados, podrías │   │
│  │    subir hasta +48 puntos en preguntas PAES.       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tu ruta de mayor impacto:                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 RECOMENDADO                                      │   │
│  │ Álgebra y Funciones                                │   │
│  │ • Desbloquear +8 preguntas PAES                    │   │
│  │ • Subir hasta +24 puntos                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 Tienes 5 preguntas a solo 1 concepto de distancia.    │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
│                                                             │
│  ▽ Ver más rutas de aprendizaje          (low-contrast)    │
└─────────────────────────────────────────────────────────────┘
```

#### Phase 2: Expanded Details (On Click)

```
┌─────────────────────────────────────────────────────────────┐
│  Otras rutas de aprendizaje:                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Geometría                                           │   │
│  │ +6 preguntas · +18 puntos potenciales              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Números                                             │   │
│  │ +4 preguntas · +12 puntos potenciales              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 Tu desempeño: 10/16 correctas                          │
│  📋 Revisar mis respuestas →              (low-contrast)   │
│                                                             │
│  [  Guardar mi progreso y recibir acceso  ]                 │
│  Te avisamos cuando la plataforma esté lista para           │
│  continuar. 1–2 correos, sin spam. Puedes darte de baja    │
│  cuando quieras.                                            │
└─────────────────────────────────────────────────────────────┘
```

### Secondary Actions Styling Guardrail

**Rule:** The CTA must be the only high-contrast button on the results screen.

| Element | Styling | Rationale |
|---------|---------|-----------|
| **CTA button** | High contrast, primary color, full-width on mobile | Single primary action |
| **"Ver más rutas"** | Low-contrast text + chevron, no button styling | Curiosity option, not competing action |
| **"Revisar mis respuestas"** | Low-contrast link, smaller text | Secondary utility |

**Implementation:**

```tsx
// ❌ Wrong: button styling competes with CTA
<button className="bg-primary text-white">Ver más rutas</button>

// ✅ Correct: disclosure row, low contrast
<button className="text-cool-gray text-sm flex items-center gap-1 hover:text-charcoal">
  <ChevronDownIcon className="w-4 h-4" />
  Ver más rutas de aprendizaje
</button>
```

This prevents "Ver más rutas" from becoming a curiosity trap that reduces CTA clicks, especially for Gen Z users.

---

### Simplified RouteCard Component

```tsx
import { StarIcon, LockOpenIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid'

<div className="card p-5">
  {isRecommended && (
    <Badge className="bg-primary/10 text-primary">
      <StarIcon className="w-4 h-4 mr-1" />
      RECOMENDADO
    </Badge>
  )}
  <h4 className="font-bold text-lg">{route.title}</h4>
  <p className="text-cool-gray text-sm mb-4">
    Dominar estos conceptos te permitiría:
  </p>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <LockOpenIcon className="w-5 h-5 text-cool-gray" />
      <span>+{route.questionsUnlocked} preguntas PAES</span>
    </div>
    <div className="flex items-center gap-2 text-success font-semibold">
      <ArrowTrendingUpIcon className="w-5 h-5" />
      <span>+{route.pointsGain} puntos</span>
    </div>
  </div>
</div>
```

### Mobile Requirements

- Phase 1 MUST fit on one mobile screen
- CTA visible without scrolling
- Score and improvement projection above fold
- Single route card initially

---

## Implementation: Example Preview Modal

### Purpose

Reduce uncertainty before users commit time. Let them SEE what they'll get.

### Location

- Landing page: "Ver ejemplo de resultados" button in hero section
- Optional: Welcome screen

### Design

```
┌─────────────────────────────────────────────────────────────┐
│  [X] Close                                                  │
│                                                             │
│  Así se verán tus resultados                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Tu Puntaje PAES Estimado                    │   │
│  │              ┌───────────┐                          │   │
│  │              │  650-720  │                          │   │
│  │              └───────────┘                          │   │
│  │                                                     │   │
│  │  ⭐ Buen punto de partida                          │   │
│  │  📈 Podrías subir hasta +68 puntos al dominar     │   │
│  │     los conceptos identificados                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tu ruta de mayor impacto:                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 RECOMENDADO                                      │   │
│  │ Geometría                                           │   │
│  │ • Desbloquear +12 preguntas PAES                   │   │
│  │ • Hasta +32 puntos al dominar esta ruta           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💡 5 preguntas a solo 1 concepto de distancia.            │
│                                                             │
│  [  Descubrir mi puntaje real  ]                           │
│                                                             │
│  16 preguntas · ~15 min · Puntaje inmediato ·              │
│  Guardas tu progreso · Continuación cuando lancemos        │
│                                                             │
│  ℹ️ Ejemplo ilustrativo. Tu resultado será personalizado.  │
└─────────────────────────────────────────────────────────────┘
```

**Note:** The example preview modal uses "Descubrir mi puntaje real" (not the canonical CTA) because the user hasn't completed the diagnostic yet. This is intentional — it drives to action, not signup.

### Requirements

1. **Highly visual** — Gen Z scans, doesn't read
2. **Show only defensible data** — Score range, points projection, questions unlocked, low hanging fruit. NO axis percentages.
3. **Realistic example** — Score range 650-720, +68 points improvement
4. **Mobile-first**
5. **Clear CTA** — "Descubrir mi puntaje real"
6. **Subtle disclaimer** — "Ejemplo ilustrativo"

---

## Implementation: Credibility Elements

**Icon Convention:** All code examples use [Heroicons](https://heroicons.com/) (`@heroicons/react`). Use `24/solid` or `24/outline` variants consistently within each component.

### Welcome Screen Additions

#### Credibility Badge

```tsx
import { CheckCircleIcon } from '@heroicons/react/24/solid'

<div className="inline-flex items-center gap-2 text-sm text-cool-gray 
  bg-primary/5 px-3 py-1.5 rounded-full mb-4">
  <CheckCircleIcon className="w-4 h-4 text-primary" />
  Basado en preguntas PAES oficiales
</div>
```

#### Expandable "¿Cómo funciona?"

```tsx
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

<details className="bg-white/50 rounded-xl p-4 mt-6 text-left">
  <summary className="font-medium text-charcoal cursor-pointer flex items-center gap-2">
    <QuestionMarkCircleIcon className="w-5 h-5 text-primary" />
    ¿Cómo funciona este diagnóstico?
  </summary>
  <div className="mt-4 text-sm text-cool-gray space-y-3">
    <p><strong>Preguntas reales:</strong> Usamos preguntas PAES oficiales.</p>
    <p><strong>Diagnóstico adaptativo:</strong> Las preguntas se ajustan a tu desempeño.</p>
    <p><strong>Continuación:</strong> Guarda tu progreso para recibir acceso cuando lancemos la experiencia completa.</p>
  </div>
</details>
```

#### Footer Update

Current: "Tu diagnóstico se guarda automáticamente al final"  
New: "Tus resultados se guardan cuando ingresas tu email."

**Note:** Results are persisted at signup (email submission), not at diagnostic completion. Only say "Puedes cerrar y continuar después" if session resume is actually implemented.

### Landing Page Additions

#### Social Proof (subtle)

```tsx
<p className="text-sm text-cool-gray mt-4">
  Únete a estudiantes que ya descubrieron su potencial
</p>
```

**Note:** Keep subtle. Avoid specific numbers unless real.

#### Parent Section (optional)

```tsx
import { UsersIcon } from '@heroicons/react/24/outline'

<div className="mt-8 p-4 bg-primary/5 rounded-xl">
  <h4 className="font-medium text-charcoal flex items-center gap-2">
    <UsersIcon className="w-5 h-5 text-primary" />
    Para padres
  </h4>
  <p className="text-sm text-cool-gray mt-2">
    Arbor detecta qué conceptos reforzar y por dónde empezar, 
    sin perder tiempo en contenido que ya domina.
  </p>
</div>
```

---

## Implementation: Copy Updates

### Copy Principles

| Do | Don't |
|----|-------|
| Be concrete with defensible data | Use hype language |
| Use time anchors ("En 15 minutos") | Use threat framing |
| Challenge framing ("Descubre tu potencial") | Vague promises |
| Loss prevention subtle ("No dejes puntos sobre la mesa") | Pressure tactics |
| Conservative claims ("hasta X puntos") | Fake social proof |
| Use ranges for uncertainty | Precise metrics from incomplete data |

### Defensible Language Guardrail

**Core rule:** Say "detectamos" (what we observed) rather than "necesitas" (what we assume globally).

| Risky (overpromise) | Safe (defensible) |
|---------------------|-------------------|
| "exactamente qué conceptos dominar para subir tu puntaje" | "exactamente qué conceptos detectamos en este diagnóstico" |
| "sabrás todo lo que necesitas aprender" | "sabrás por dónde empezar a mejorar" |
| "tu ruta personalizada completa" | "los primeros temas que trabajaremos" |
| "puedes cerrar y continuar después" | Only if resume is actually implemented |

**Where "exactamente" is safe:**
- ✅ "exactamente qué conceptos detectamos en este diagnóstico"
- ✅ "exactamente por dónde empezar"
- ❌ "exactamente todo lo que necesitas" (implies total coverage we don't have)

**Scope pattern:** Add "en este diagnóstico" or "a partir de tus respuestas" anywhere you use "exactamente" or claim knowledge about gaps.

**Example transformations:**
- "Identificamos exactamente los conceptos que te faltaron" → "Identificamos exactamente los conceptos que detectamos en este diagnóstico"
- "Ya sabemos qué necesitas dominar" → "Ya sabemos por dónde empezar"
- "Tu ruta personalizada te espera" → "Estos serán los primeros temas que trabajaremos (cuando la plataforma esté lista)"

### Specific Copy Changes

| Location | Current | New |
|----------|---------|-----|
| Landing CTA | "Tomar el Diagnóstico Gratis" | "Descubrir mi Puntaje" |
| Welcome Subtitle | "Descubre tu nivel actual y qué necesitas..." | "En ~15 minutos sabrás tu puntaje estimado y exactamente qué conceptos detectamos en este diagnóstico para empezar a mejorar." |
| Welcome Time | "30 Minutos" | "~15 min" (or "15-20 min típico") |
| Results Improvement | "Con trabajo enfocado puedes subir +48 puntos" | "Al dominar los conceptos identificados, podrías subir hasta +48 puntos." |

**Improvement copy must follow projection rules:** Always "hasta +X", always conditional ("si sigues la ruta", "con práctica enfocada"). See [Projection Rules](#projection-rules).

### Results CTA Copy

**Canonical CTA:** "Guardar mi progreso y recibir acceso"

Use this CTA across all tiers and both phases. Track via `cta_label` property in analytics (see [Core Funnel Events](#core-funnel-events-mvp)).

**Later: A/B Test Variants (only when running experiments)**

| Variant | Copy | Hypothesis |
|---------|------|------------|
| A (default) | "Guardar mi progreso y recibir acceso" | Students: continuity + access framing |
| B | "Guardar mis resultados y recibir acceso" | Parents: results-focused |
| C | "Guardar mi diagnóstico y recibir acceso" | Neutral baseline |

**Implementation rule:** One CTA label per release. Do not mix labels in the same experiment. Add `variant_cta` property only when actively A/B testing (see [A/B Testing Support](#later-ab-testing-support-only-when-running-experiments)).

**Expectation line + privacy reassurance (required under every CTA):**

**Canonical expectation line (platform not yet live):**

"Te avisamos cuando la plataforma esté lista para continuar. 1–2 correos, sin spam. Puedes darte de baja cuando quieras."

Optional add-on (if true operationally): "Tus resultados quedan guardados."

**Future (when platform is live):**

"Guardamos tu diagnóstico y te enviamos el acceso a la plataforma. 1 correo, sin spam. Puedes darte de baja cuando quieras."

**Critical:** Match the copy to operational reality. Never promise features that don't exist yet.

This addresses:
- "What happens next?" uncertainty
- "Will they spam me?" fear (high sensitivity in Chile)
- Sets realistic expectation (must match actual delivery)
- Reduces parent resistance with opt-out reassurance

---

## Post-Signup Operational Contract

The UI copy makes specific promises. This section defines what the backend must deliver to fulfill them.

### What the UI Promises

| UI Element | Promise Made |
|------------|--------------|
| CTA: "Guardar mi progreso y recibir acceso" | Results are saved; user gets early access |
| Expectation line: "Te avisamos cuando la plataforma esté lista" | User will be notified (1-2 emails) |
| Expectation line: "Puedes darte de baja cuando quieras" | Easy opt-out exists |

### Immediate Post-Signup Delivery (Required)

After email submission, the user must **immediately** receive:

| Delivery | Content | Channel |
|----------|---------|---------|
| **1. Confirmation** | "Tus resultados están guardados" | Thank You screen + email |
| **2. Results snapshot** | PAES score range + top route summary | Thank You screen + email |
| **3. Access timeline** | "Te avisamos cuando la plataforma esté lista" | Thank You screen + email |

**Implementation options:**

**Option A: Thank You Screen + Confirmation Email (Recommended)**

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ ¡Listo! Tus resultados están guardados                  │
│                                                             │
│  Tu Puntaje PAES Estimado: 680-740                         │
│                                                             │
│  Tu ruta de mayor impacto:                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Álgebra y Funciones                                │   │
│  │ +8 preguntas PAES · +24 puntos potenciales         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📧 Te enviamos una copia a [email]                        │
│                                                             │
│  ¿Qué sigue?                                               │
│  Te avisamos cuando la plataforma esté lista para          │
│  continuar con tu ruta personalizada.                      │
│                                                             │
│  [  Volver al inicio  ]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Option B: Saved Results Page (permalink)**

Create `/resultados/[session_id]` that shows:
- Full results (score, route card, low hanging fruit)
- "Guardado" badge
- "Te avisamos cuando puedas continuar" note

User can bookmark/share this page. Email links to it.

### Confirmation Email Content

```
Subject: Tus resultados PAES están guardados

Hola [nombre],

Tu diagnóstico está guardado. Aquí está tu resumen:

📊 Tu Puntaje PAES Estimado: 680-740

🎯 Tu ruta de mayor impacto: Álgebra y Funciones
   • +8 preguntas PAES que podrías desbloquear
   • +24 puntos potenciales

¿Qué sigue?
Te avisamos cuando la plataforma esté lista para continuar 
con tu ruta personalizada.

—
El equipo de Arbor

---
Puedes darte de baja cuando quieras: [unsubscribe_link]
```

### Platform Launch Email (Later)

When platform is ready:

```
Subject: Tu ruta de aprendizaje está lista

Hola [nombre],

La plataforma está lista. Puedes continuar donde lo dejaste:

📊 Tu puntaje estimado: 680-740
🎯 Tu ruta: Álgebra y Funciones

[  Continuar mi ruta  ] → links to platform with session restored

—
El equipo de Arbor
```

### Email Cadence Contract

| Email | Trigger | Content |
|-------|---------|---------|
| **1. Confirmation** | Immediately after signup | Results snapshot + "te avisamos" |
| **2. Platform launch** | When platform is live | "Tu ruta está lista" + CTA |
| **(Optional) Reminder** | 1 week before PAES | Only if platform is live |

**Maximum emails:** 2 (confirmation + launch). No marketing emails unless user opts in separately.

### Database Requirements

Store at signup:

```typescript
interface SavedDiagnosticResult {
  sessionId: string;
  email: string;
  createdAt: Date;
  
  // Results snapshot (immutable)
  totalCorrect: number;
  performanceTier: PerformanceTier;
  paesScoreMin: number;
  paesScoreMax: number;
  
  // Top route snapshot
  topRoute: {
    axis: string;
    questionsUnlocked: number;
    pointsGain: number;
  } | null;  // null for tiers without routes
  
  // For platform launch notification
  notifiedPlatformLaunch: boolean;
  unsubscribed: boolean;
}
```

### Operational Checklist

- [ ] Thank You screen shows results snapshot (not just "gracias")
- [ ] Confirmation email sends immediately with results
- [ ] Unsubscribe link works and is honored
- [ ] Results are persisted in database
- [ ] Platform launch email template is ready (even if not sent yet)
- [ ] No emails sent beyond confirmation until platform launch

---

### Tone Guidelines

- **For students:** Direct, confident, slightly casual. Peer-to-peer energy.
- **For parents:** Reassuring, professional, supportive.

---

## Configuration Constants

Centralized configuration objects referenced throughout this document. **Do not hardcode these values** — import from the config files.

### Contact Configuration {#configuration-constants}

```typescript
// lib/config/contact.ts
export const CONTACT_CONFIG = {
  whatsapp: {
    number: '+56993495075',
    displayNumber: '+56 9 9349 5075',
    url: 'https://wa.me/56993495075',
  },
  email: 'contacto@arbor.school',
  // Update here when channels change
} as const;
```

### Tier Configuration

See [Performance Tier System](#performance-tier-system) for the full `TIER_CONFIG` object with all tier-specific rules.

---

## Analytics Specification

### Analytics Scope Policy

**MVP (ship now):** 6 core funnel events only.

**Later (only if needed):** abandonment, expansion, viewport, A/B variant plumbing.

**Why P0:** Analytics is required to avoid opinion-driven UI changes; we need baseline funnel rates and tier-segmented conversion before changing Results UX.

**MVP Definition of Done:** Events are firing in PostHog for real sessions, funnel is visible, and `performance_tier` segmentation works on `results_viewed`.

**Rule:** Do not create per-tier events (e.g., `tier_perfect_viewed`). Use `performance_tier` property on shared events instead.

### Recommended Tool: PostHog

Free tier (1M events/month), funnel analysis, session recordings, A/B testing support.

### Installation

```bash
npm install posthog-js
```

```tsx
// app/providers/PostHogProvider.tsx
'use client'

import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized.current) {
      initialized.current = true
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false
      })
      posthog.register({ build_version: process.env.NEXT_PUBLIC_BUILD_VERSION })
    }
  }, [])
  
  return <>{children}</>
}
```

**Implementation rule (Next.js App Router):** Init in a client component with `'use client'`, guard with a `useRef` to prevent double init (do not use `posthog.__loaded` as it's a private field), use `useEffect` to avoid SSR issues, and call `posthog.register({ build_version })` immediately after init.

### Core Funnel Events (MVP)

PostHog handles identity via `distinct_id` automatically. Don't add manual `session_id` to avoid duplication and identity edge cases.

**Global property (all events):** `build_version` — git SHA or semver (e.g., `"1.2.3"` or `"abc123"`). Required for before/after comparisons across releases.

| Event | Trigger | Properties |
|-------|---------|------------|
| `landing_page_viewed` | Landing loads | `device_type`, `utm_source`, `utm_medium`, `utm_campaign` |
| `diagnostic_started` | Click "Comenzar" | `utm_source`, `utm_medium`, `utm_campaign` |
| `diagnostic_completed` | Finish Q16 | `total_correct`, `performance_tier`, `time_elapsed_seconds` |
| `results_viewed` | Results loads | `paes_score_min`, `paes_score_max`, `performance_tier`, `total_correct`, `cta_label` |
| `results_cta_clicked` | Click CTA | `performance_tier`, `cta_label`, `signup_intent` |
| `signup_completed` | Submit email | `paes_score_min`, `paes_score_max`, `performance_tier`, `utm_source`, `utm_medium`, `utm_campaign`, `signup_intent` |

**Important property: `signup_intent`**

Add `signup_intent: 'access_waitlist'` to `results_cta_clicked` and `signup_completed` events. This distinguishes waitlist conversion from future "product signup" conversion when the platform launches.

```typescript
// Current phase (platform not live)
posthog.capture('signup_completed', {
  ...baseProperties,
  signup_intent: 'access_waitlist',
});

// Future phase (platform live) - update to:
// signup_intent: 'create_account'
```

**Property notes:**
- `build_version`: Essential for release comparisons.
  
  **Implementation rule:** Set via `posthog.register({ build_version })` once on app init, so it's automatically attached to every event. Do not rely on adding it manually per `capture()` call.
- `paes_score_min`, `paes_score_max`: Numeric values (e.g., `680`, `740`). Use min/max for analysis flexibility.
- `cta_label`: The actual CTA text shown (e.g., `"Guardar mi progreso y recibir acceso"`). Enables historical comparison across releases without A/B plumbing.

**UTM Attribution Implementation:**

```typescript
// On landing_page_viewed, capture and persist UTMs:
const utmData = {
  utm_source: getUrlParam('utm_source'),
  utm_medium: getUrlParam('utm_medium'),
  utm_campaign: getUrlParam('utm_campaign'),
};
sessionStorage.setItem('arbor_utms', JSON.stringify(utmData));

// Include UTMs on conversion events: diagnostic_started, signup_completed
// Let PostHog handle distinct_id and session tracking automatically
```

**Decision Rule:** If baseline shows low completion, add `diagnostic_abandoned`. If results→CTA is low, add `results_expanded`. If running A/B tests, add `variant_cta`.

### Later: Additional Events (Only When Needed)

Add these events only when diagnosing specific bottlenecks:

| Event | When to Add | Properties |
|-------|-------------|------------|
| `diagnostic_abandoned` | If completion rate < 70% | `last_question_index`, `time_elapsed_seconds` |
| `results_expanded` | If results→CTA rate is low | — |
| `example_preview_opened` | If adding preview modal | — |
| `results_cta_viewed` | If investigating above-fold issues | — |

### Later: A/B Testing Support (Only When Running Experiments)

Add variant tracking only when `EXPERIMENT_FLAGS.enabled === true`:

```typescript
// Only include when actively running experiments
interface VariantProperties {
  variant_cta?: 'A' | 'B' | 'C';        // CTA label variant
  variant_summary?: 'v1' | 'v2';        // Results summary copy variant
}

// Add to results_viewed, results_cta_clicked, signup_completed
posthog.capture('results_viewed', {
  ...baseProperties,
  variant_cta: getActiveVariant('results_cta'),  // Only when experimenting
});
```

**Rule:** Without variant tracking, A/B test results are inconclusive. Only add this when you're actually running experiments.

---

## Success Metrics

### Primary Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Start Rate** | >60% | `diagnostic_started` / `landing_page_viewed` |
| **Completion Rate** | >70% | `diagnostic_completed` / `diagnostic_started` |
| **Signup Rate** | >40% | `signup_completed` / `results_viewed` |

**Note:** Signup rate target assumes qualified traffic. If missed, evaluate by `utm_source` and `device_type` before concluding "copy is bad" — channel quality may be the real issue.

**Interpretation rule:** Evaluate metrics by `performance_tier` first. A drop in overall signup can be caused by traffic shifting to more low-signal tiers, not copy/UI regression.

### Secondary Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **CTA click rate** | >50% | `results_cta_clicked / results_viewed` — measures CTA appeal |
| Mobile completion rate | Within 10% of desktop | Parity across devices |

**Later metrics (add when investigating specific issues):**

| Metric | When to Add | Notes |
|--------|-------------|-------|
| Example preview engagement | After adding preview modal | If low, make more prominent |
| Results details expansion | If results→CTA is low | Shows users want depth |
| Abandonment question index | If completion < 70% | Requires `diagnostic_abandoned` event |

### Funnel Diagnosis Rule

Use metrics to diagnose problems and prioritize fixes:

| Symptom | Likely Cause | Solution Focus |
|---------|--------------|----------------|
| Low start rate (<60%) | Uncertainty/trust problem | Improve preview, add credibility signals |
| Low completion rate (<70%) | Friction/cognitive load | Shorten, simplify, clarify diagnostic |
| High completion, low signup (<40%) | Value framing or CTA problem | Improve results messaging, CTA placement/copy |

**Key insight:** Fix ability (simplify) before trying to increase motivation (hype).

---

## Implementation Checklist

**Sequencing Rule:** Do not deploy P1+ without MVP analytics live for at least a small internal test cohort. Phase 1 must ship first.

**Priority → Phase Mapping:**
| Priority | Phase | Description |
|----------|-------|-------------|
| P0 | Phase 1 | Analytics Foundation (MVP) |
| P1a | Phase 2 | Results Screen — Remove Misleading Data |
| P1b | Phase 3 | Results Screen — Two-Phase Reveal |
| P2 | Phase 4 | Performance Tier System |
| P3 | Phase 5 | Example Preview Modal |
| P4+P5 | Phase 6 | Credibility & Copy |
| P6 | Phase 7 | Post-Signup Operational Flow |
| — | Phase 8 | Iteration (ongoing) |

### Phase 1: Analytics Foundation (P0)

- [x] Install PostHog
- [x] Implement 6 core funnel events (MVP)
- [x] Add `signup_intent: 'access_waitlist'` to `results_cta_clicked` and `signup_completed` events
- [x] Use `useRef` guard for PostHog init (not `posthog.__loaded`)
- [x] Persist UTMs on landing, attach to `diagnostic_started` + `signup_completed`
- [ ] Baseline dashboard: Start Rate, Completion Rate, Signup Rate + breakdown by `performance_tier` and `device_type` *(requires PostHog setup in production)*

### Phase 2: Results Screen — Remove Misleading Data (P1a)

- [x] Remove "Tu Perfil por Eje" section (axis percentages)
- [x] Remove "Tu Potencial Máximo" section
- [x] Remove "X/Y átomos" displays
- [x] Remove specific time estimates
- [x] Simplify RouteCard (questions + points only)
- [x] Remove/repurpose `AxisProgressBar` component
- [x] Clean up unused helper functions

### Phase 3: Results Screen — Two-Phase Reveal (P1b)

- [x] Implement Phase 1 (essential above fold)
- [x] Add "Ver más rutas" toggle
- [x] Implement Phase 2 (expanded details)
- [x] Ensure CTA above fold on mobile
- [x] Update copy to loss/challenge framing

### Phase 4: Performance Tier System (P2)

- [x] Add `getPerformanceTier()` function and `TIER_CONFIG` object
- [x] **Filter routes to failed questions only** — see [canonical rule](#routes-failed-only)
- [x] Implement tier-based conditional rendering
- [x] Implement tier-specific projection rules (per `TIER_CONFIG`):
  - [x] Perfect: no projections (no failed questions)
  - [x] Near-perfect: conservative, tied to 1-2 wrong answers only
  - [x] High: projections from 3-5 wrong answers
  - [x] Average: moderate (top route from 6-10 wrong answers)
  - [x] Below Average: no projections (generic "Fundamentos")
  - [x] Very Low: no projections (generic messaging)
- [x] Create tier components in `TierContent.tsx` (consolidated approach instead of separate files)
- [x] Test edge cases: 0, 2, 3, 5, 6, 10, 11, 13, 14, 15, 16

### Phase 5: Example Preview Modal (P3)

- [x] Create `ExampleResultsModal.tsx`
- [x] Add "Ver ejemplo de resultados" button to Landing
- [x] Mobile optimization
- [ ] (Optional) Add `example_preview_opened` event if measuring preview engagement

### Phase 6: Credibility & Copy (P4+P5)

- [x] Add credibility badge to Welcome
- [x] Add expandable "¿Cómo funciona?" (with platform-accurate copy)
- [x] Update footer text
- [x] Update all "plan" copy to "acceso/progreso" language
- [x] Add expectation-setting copy to Welcome

### Phase 7: Post-Signup Flow (P6)

- [x] **Thank You screen** shows results snapshot (score + top route), not just "gracias"
- [x] **Database:** persist `SavedDiagnosticResult` with score, tier, top route snapshot
- [x] **Confirmation email** sends immediately with results summary
- [x] **Unsubscribe link** works and is honored
- [x] **(Optional)** Saved Results page at `/resultados/[session_id]`
- [x] **Platform launch email template** ready (send when platform is live)
- [x] Verify: no emails sent beyond confirmation until platform launch

### Phase 8: Iteration (Ongoing)

Data-driven improvements after baseline is established:

- [ ] Review baseline analytics data
- [ ] If completion < 70%, add `diagnostic_abandoned` event
- [ ] If results→CTA is low, add `results_expanded` event
- [ ] Only when A/B testing, add `variant_cta` to events
- [ ] A/B test copy variants (requires variant tracking)
- [ ] Add parent section if data suggests
- [ ] When platform launches, update `signup_intent` from `'access_waitlist'` to `'create_account'`
- [ ] When platform launches, send platform launch email to waitlist
- [ ] Iterate based on funnel analysis

---

## Files Reference

### Major Changes

| File | Changes |
|------|---------|
| `app/diagnostico/components/ResultsScreen.tsx` | Major refactor: remove misleading sections, two-phase reveal, tier-based rendering |
| `app/diagnostico/components/ResultsComponents.tsx` | Remove `AxisProgressBar`, simplify `RouteCard`, remove atom-related helpers |

### Moderate Changes

| File | Changes |
|------|---------|
| `app/page.tsx` | Example preview button, social proof |
| `app/diagnostico/components/WelcomeScreen.tsx` | Credibility badge, expandable section, copy updates |
| `app/diagnostico/page.tsx` | Analytics events |
| `app/layout.tsx` | PostHog provider |
| `app/diagnostico/components/SignupScreen.tsx` | Pass results data to Thank You screen |
| `app/diagnostico/components/ThankYouScreen.tsx` | Show results snapshot (score + top route), not just "gracias" |
| `app/api/diagnostic/signup/route.ts` | Persist `SavedDiagnosticResult`, trigger confirmation email |

### New Files

| File | Purpose |
|------|---------|
| `app/diagnostico/components/ExampleResultsModal.tsx` | Preview modal |
| `app/diagnostico/components/TierContent.tsx` | All tier-specific components (headlines, messages, CTAs) |
| `lib/analytics/tracker.ts` | Analytics event tracking with PostHog |
| `lib/analytics/types.ts` | Analytics type definitions |
| `lib/config/tiers.ts` | Tier detection, signal quality, limitation copy |
| `lib/config/contact.ts` | Contact channels configuration |
| `lib/email/index.ts` | Email module exports |
| `lib/email/service.ts` | Resend email service wrapper |
| `lib/email/types.ts` | Email type definitions |
| `lib/email/confirmationEmail.ts` | Confirmation email template with results snapshot |
| `lib/email/platformLaunchEmail.ts` | Platform launch notification template |
| `app/api/unsubscribe/route.ts` | Unsubscribe endpoint for email links |
| `app/api/resultados/[sessionId]/route.ts` | API for fetching saved results |
| `app/resultados/[sessionId]/page.tsx` | Saved results permalink page |

**Note:** Results snapshot fields were added to existing `users` table instead of creating a separate `savedResults` table.

### Components/Functions to Remove

From `app/diagnostico/components/ResultsComponents.tsx`:
- `AxisProgressBar` component
- `ATOM_COUNTS` constant
- `calculateAtomsDominated` function
- `calculateTotalAtomsRemaining` function
- `getWeeksByStudyTime` function

---

## Appendix: Copy Dictionary (Find/Replace)

Quick reference for migrating from "plan" language to "platform/access" language. **Source of truth for canonical copy:** [Results CTA Copy](#results-cta-copy) section.

### Legacy → Current Mappings

| Legacy Copy | Current Copy |
|-------------|--------------|
| `Guardar y recibir mi plan` | `Guardar mi progreso y recibir acceso` |
| `Guardar mi diagnóstico` | `Guardar mi progreso` |
| `Ver ejemplo de plan` | `Ver ejemplo de resultados` |
| `Guardar y seguir después` | `Guardar mi progreso` |
| `Te avisamos cuando tu plan esté listo` | `Te avisamos cuando la plataforma esté lista para continuar` |
| `Puedes darte de baja en cualquier momento` | `Puedes darte de baja cuando quieras` |
| `Resultados inmediatos` | `Puntaje inmediato · Guardas tu progreso · Continuación cuando lancemos` |
| `Plan personalizado: Identificamos exactamente qué conceptos dominar` | `Continuación guiada: te mostraremos qué detectamos y por dónde empezar cuando la plataforma esté lista` |
| `Tu plan partirá por...` | `Cuando la plataforma esté lista, continuaremos por...` |
| `Tu siguiente paso:` (low-signal tiers) | `Tu siguiente paso (cuando lancemos):` |

### Canonical Copy Summary

| Element | Copy |
|---------|------|
| **Results CTA** | `Guardar mi progreso y recibir acceso` |
| **Expectation Line** | `Te avisamos cuando la plataforma esté lista para continuar. 1–2 correos, sin spam. Puedes darte de baja cuando quieras.` |
| **Modal Footer** | `16 preguntas · ~15 min · Puntaje inmediato · Guardas tu progreso · Continuación cuando lancemos` |
| **Analytics: signup_intent** | `'access_waitlist'` (on `results_cta_clicked`, `signup_completed`) |
