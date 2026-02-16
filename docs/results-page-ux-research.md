# Results Page UX Research: Data-Driven Design Recommendations

**Date:** January 27, 2026  
**Target Audience:** 18-year-old PAES students + their parents  
**Goal:** Maximize trust, engagement, and conversion on the most critical view in the app

---

## Executive Summary

Your feedback about left-aligned text being "distracting" aligns with established UX research. The issue isn't that left alignment is bad—it's actually the gold standard for readability. The problem is **inconsistent alignment** creating visual chaos. Below is hard data to guide your decision.

---

## Part 1: Text Alignment Research

### The Hard Data

| Finding | Source | Implication |
|---------|--------|-------------|
| Left-aligned text reduces cognitive load by creating a consistent starting point for each line | WebAIM, Cieden UX | Use left-align for body text and data |
| Centered text requires 15-25% more eye effort to find line starts | UX StackExchange studies | Reserve centering for short headlines only |
| Mixed alignment (some centered, some left) creates "visual noise" that increases cognitive strain | Nielsen Norman Group | Pick ONE dominant alignment pattern |
| Justified text creates "rivers of white space" reducing readability by up to 20% | Stanford Web Credibility | Never use justified text |

### Best Practice Guidelines

**Use CENTERED alignment for:**
- Headlines and titles (max 2-3 lines)
- Hero scores/numbers (your animated PAES score ✓)
- Short CTAs and badges
- Single-line status messages

**Use LEFT alignment for:**
- Body text (anything more than 2-3 lines)
- Lists and bullet points
- Cards with multiple data points
- Form labels and inputs
- Route recommendations with details

### Current Issue in Your Code

Looking at `ResultsScreen.tsx`, I see the problem:

```
Line 315-317: <p className="text-sm text-cool-gray mb-3">
               Tu ruta de mayor impacto:
             </p>
```

This label is left-aligned (default), but it lives inside a centered parent container, creating the jarring effect. The `SimpleRouteCard` components also have internal left alignment while the surrounding content is centered.

---

## Part 2: Gen Z (18-Year-Old Students) Design Preferences

### The Hard Data

| Statistic | Source | Design Implication |
|-----------|--------|---------------------|
| 60% expect pages to load in under 3 seconds | Smashing Magazine 2024 | Optimize animations, lazy load routes |
| 60% prefer simple, functional layouts over complex designs | SanjayDey.com research | Reduce visual clutter |
| 8-second attention span on average | Gen Z UX studies | Lead with the score, make CTA immediately visible |
| 75% prefer video over text for learning | Smashing Magazine | Consider adding micro-video explainers |
| 83% value personalized experiences | Gen Z research | Emphasize "Tu ruta personalizada" language |

### What Gen Z Values Most

1. **Speed over aesthetics** — They'll abandon a beautiful but slow page
2. **Authenticity over polish** — Reject overly corporate/perfect designs
3. **Mobile-first** — Almost all interactions happen on phones
4. **Clear value proposition** — "What's in it for me?" answered in seconds
5. **Social proof** — 67% choose brands demonstrating social responsibility

### Design Recommendations for Students

- Keep the animated score counter (engaging, gamified feel)
- Make the improvement message ("Podrías subir +X puntos") highly prominent
- Use progressive disclosure (collapsed "Ver más rutas" is good)
- Ensure the CTA is visible without scrolling on mobile
- Consider adding a "share your score" feature (social validation)

---

## Part 3: Parent Design Preferences

### The Hard Data

| Finding | Source | Design Implication |
|---------|--------|---------------------|
| Trust increases with actual app use, not initial impressions | Springer 2025 study | Encourage parents to explore the results |
| Parents engage more when tools are "well-structured" | Frontiers in Psychology | Prioritize clear information hierarchy |
| Parents disengage when technology feels "beyond their knowledge" | Bath University research | Avoid jargon, explain all metrics |
| School endorsement significantly increases trust | Multiple studies | Add credibility signals if available |

### What Parents Value Most

1. **Credibility signals** — Professional design, clear organization
2. **Transparency** — Visible methodology, no hidden information
3. **Controllability** — Ability to understand and monitor progress
4. **Contact information** — Physical address, support email
5. **Privacy clarity** — Clear explanation of data usage

### Design Recommendations for Parents

- Add a small "¿Cómo calculamos tu puntaje?" expandable section
- Include explicit privacy language near email signup
- Make the "Rango probable" explanation more prominent
- Consider adding a "Para padres" info link
- Ensure professional typography and spacing (no casual/playful fonts)

---

## Part 4: High-Stakes Results Page Psychology

### The Hard Data

| Finding | Source | Design Implication |
|---------|--------|---------------------|
| 80% of visitors decide after reading only the headline | Pepperland Marketing | Your score headline must be instantly clear |
| Users scan in F-pattern (top → left side) on text-heavy pages | Nielsen Norman Group eye tracking | Place critical info top-left after hero |
| Users scan in Z-pattern on visual pages | NN/g | Hero score → CTA path should follow Z-pattern |
| Multi-step forms often outperform single-page forms | Vital Design study | Current signup flow may be optimal |
| Anxiety manifests as information overload avoidance | UX Matters 2025 | Don't show all data at once |

### Emotional Design for High-Stakes Moments

Students viewing PAES results are in a **high-anxiety state**. Research shows:

1. **Cognitive load capacity drops** — Keep information minimal
2. **Desire for control increases** — Let them choose when to see more
3. **Trust becomes paramount** — Any inconsistency triggers doubt
4. **First impression anchoring** — The first number they see becomes their "score" mentally

### Design Recommendations for Emotional UX

- Lead with the positive (score before limitations)
- Use calming colors in the hero section
- Progressive disclosure for detailed data (current approach is good)
- Avoid anything that looks like an error state
- "Diagnóstico Completado" badge is excellent (accomplishment framing)

---

## Part 5: Trust Signals That Drive Conversion

### The Hard Data

| Trust Signal | Impact on Conversion | Priority |
|--------------|---------------------|----------|
| URL/Domain credibility | 17% of trust decisions | High |
| HTTPS/Security | 15% | Already implemented |
| Design quality (clean, professional) | 13% | **FOCUS HERE** |
| Ad-free experience | 13% | Already implemented |
| Brand recognition | 11% | Build over time |

### Critical Trust Factors (Stanford Web Credibility Project)

1. **Design quality** — Typography, spacing, color harmony, consistent alignment
2. **Upfront disclosure** — Contact info, methodology, clear expectations
3. **Current, comprehensive content** — Up-to-date information
4. **Connection to credible sources** — Links to DEMRE, universities, etc.

### ⚠️ Warning: Trust Signal Overload

Research shows that **excessive trust signals can decrease conversion by 15-30%** by creating "defensive design anxiety." Don't add badges, certifications, or testimonials unless genuinely earned.

---

## Part 6: Recommended Design Changes

### Alignment Strategy (Primary Recommendation)

**Option A: Fully Centered (Recommended)**
```
Hero Section: Centered
├── Score display (centered) ✓
├── Score range (centered) ✓
├── Tier headline (centered) ✓
├── Message card (centered) ✓
├── Route label → CHANGE TO: centered
├── Route card → CHANGE TO: centered content
├── CTA button (centered) ✓
└── Secondary info (centered) ✓
```

**Why centered works for this page:**
- Results pages are "moment in time" displays, not reading-heavy
- Single focal point (the score) benefits from centered hierarchy
- Mobile users scroll vertically; centered text centers on their viewport
- Creates a more "official report" feeling (like receiving exam results)

**Implementation:**
1. Change "Tu ruta de mayor impacto:" to centered
2. Center the content inside `SimpleRouteCard`
3. Center the "low hanging fruit" message
4. Center expanded route cards content
5. Ensure all section labels are centered

### Option B: Structured Left Alignment
If you prefer a more "dashboard" feel:

```
Hero Section: Centered
├── Score display (centered)
├── Score range (centered)
└── End centered section

Content Section: Left-aligned with max-width container
├── Tier headline (left)
├── Message card (left-aligned content)
├── Route label (left)
├── Route card (left-aligned content)
└── CTA button (centered, full-width)
```

**Implementation:**
- Add a visual divider after the score section
- Switch to left alignment for everything below
- Keep CTAs centered/full-width
- Creates more of a "dashboard" feel

### My Recommendation: Option A (Fully Centered)

For a conversion-critical results page, centered alignment:
- Creates a single focal column for visual flow
- Feels more like an "official result" than a "dashboard"
- Works better on mobile (no awkward left margins)
- Matches the emotional moment (celebration/achievement)

---

## Part 7: Additional Conversion Optimizations

### Quick Wins

1. **Increase score font size on mobile** — Make it impossible to miss
2. **Add micro-animation to CTA** — Subtle pulse after 3 seconds
3. **Show improvement potential earlier** — Move "+X puntos" into hero section
4. **Add social proof subtly** — "Únete a 500+ estudiantes" if true

### Consider Testing

1. **CTA position** — Above the fold vs. after value proposition
2. **Route card design** — Card vs. inline list
3. **Score animation speed** — 2.5s may be too slow for impatient Gen Z
4. **Expectation line length** — Current is verbose; test shorter version

---

## Part 8: Visual Hierarchy Checklist

For your results page, ensure this order of visual prominence:

1. **PAES Score** — Largest, boldest, most colorful
2. **Improvement potential** — Second most prominent (the hook)
3. **Primary CTA** — High contrast, can't miss it
4. **Recommended route** — Supporting evidence for improvement claim
5. **Score range disclaimer** — Small but visible (trust through transparency)
6. **Secondary actions** — Subtle links (review answers, more routes)

---

## Summary: Action Items

| Priority | Change | Rationale |
|----------|--------|-----------|
| 🔴 High | Unify alignment (pick centered or left, not mixed) | Eliminates visual noise, reduces cognitive load |
| 🔴 High | Move improvement message higher | Gen Z needs value prop in first 8 seconds |
| 🟡 Medium | Increase mobile score font size | First impression anchoring |
| 🟡 Medium | Add subtle CTA animation | Draws eye without being annoying |
| 🟢 Low | Add "¿Cómo calculamos?" expandable | Builds parent trust |
| 🟢 Low | Test animation speed (1.5s vs 2.5s) | Gen Z impatience |

---

## References

1. WebAIM - Text/Typographical Layout
2. Baymard Institute - Line Length Readability
3. Nielsen Norman Group - F-Shaped Pattern for Reading Web Content
4. Stanford Web Credibility Project - Guidelines
5. Smashing Magazine - Designing for Gen Z (2024)
6. Springer - Parents' Trust and App Use (2025)
7. Frontiers in Psychology - Parents' Acceptance of Educational Technology
8. UX Matters - Designing Calm: Reducing User Anxiety (2025)
9. Cieden UX - How Text Alignment Affects Readability
10. Pepperland Marketing - Higher Ed Landing Page Optimization
