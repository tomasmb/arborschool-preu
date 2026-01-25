# Arbor PoC Conversion Pillars (Research-Backed)

**Scope:** These pillars are intentionally *high-level* and durable. They are designed to guide UX/UI and journey decisions for an education product whose current PoC is **diagnostic → results → “save results / get notified”**.

**North Star (for this PoC stage):** *Maximize the number of users who experience clear value and then express intent to continue.*  
Practically, that means optimizing for:
- **Value experienced:** Diagnostic completed + results understood  
- **Intent captured:** “Save results / notify me” signup **after** value

---

## Pillar 1 — Compress Time-to-Value (TTV)
**Principle:** The faster a first-time user reaches a credible, personalized outcome, the higher the conversion and retention potential.

**What this means for any implementation:**
- Design the shortest possible path from entry → diagnostic start → diagnostic complete → results understood.
- Remove or defer any step that does not directly increase completion or comprehension.
- Treat every extra field, click, and decision as “cost.”

**Checklist:**
- [ ] Value is visible within minutes, not “later.”
- [ ] Any required input is clearly justified (why you need it, what the user gets).
- [ ] The interface never makes users wonder “what happens next?”

**Research basis:** Time-to-value is a core PLG and UX lever; minimizing it improves upgrade and conversion likelihood. citeturn0search16

---

## Pillar 2 — Make the Aha Moment Explicit and Measurable
**Principle:** Conversion improves when the product intentionally engineers a first “Aha” experience, then repeatedly drives users to it.

**Definition:** The **Aha Moment** is when the user first experiences the product’s core value (in your case: *a credible diagnostic + clear next steps that feel doable*).

**Checklist:**
- [ ] The results page answers: “Where am I?” “What should I do next?” “How much effort?” “Why should I trust this?”
- [ ] There is a single, dominant “next action” aligned with the Aha moment (for your PoC: *save results / reserve plan*).
- [ ] The Aha moment is tracked as an event in analytics.

**Research basis:** Reforge’s activation guidance frames the Aha Moment as the first experience of core value and stresses defining it in data. citeturn0search2turn0search6

---

## Pillar 3 — Reduce Cognitive Load and Decision Load
**Principle:** Users abandon when the journey feels mentally heavy, ambiguous, or “too much work.”

**What this means broadly:**
- Prefer clear defaults over choices.
- Chunk information into a small number of sections.
- Use progressive disclosure (show essentials first; detail on demand).

**Checklist:**
- [ ] One obvious primary action per page.
- [ ] Explanations use plain language; jargon is optional/secondary.
- [ ] The user can predict effort required (time, number of steps).
- [ ] Pages are scannable (headings, short blocks, bullets).

**Research basis:** Reducing cognitive load in forms improves completion and helps users gauge effort. citeturn0search5

---

## Pillar 4 — Maintain Visibility of System Status (Progress, Feedback, Control)
**Principle:** People continue when they feel oriented, informed, and in control.

**Checklist (especially for diagnostics):**
- [ ] Show progress in a way that reduces anxiety and keeps momentum.
- [ ] Provide immediate feedback where appropriate.
- [ ] Offer “save & resume” if interruptions are likely.

**Research basis:** Visibility of system status is a foundational usability heuristic; progress indicators reduce perceived pain of waiting and improve experience. citeturn0search1  
Additional evidence suggests progress feedback patterns can influence abandonment and completion in questionnaires. citeturn0search9

---

## Pillar 5 — Increase Ability at the Moment of Action (Behavior Design)
**Principle:** Conversion is a behavior. Behaviors happen when **Motivation, Ability, and Prompt** converge.

**How to apply this without overfitting:**
- If users don’t start/finish the diagnostic, **increase ability** (simplify, shorten, clarify) before trying to hype motivation.
- If users finish but don’t sign up, **increase prompt quality** (CTA framing, timing, relevance) and **reduce perceived risk**.

**Checklist:**
- [ ] Every step has a clear prompt (“Do X now”) aligned with the user’s goal.
- [ ] The “hardest step” is made easier than you think it needs to be.
- [ ] Prompts appear when motivation is highest (typically right after value delivery).

**Research basis:** Fogg Behavior Model (B=MAP) is the standard framework for behavior-driven design. citeturn0search3turn0search15

---

## Pillar 6 — Establish Credibility Early (Especially for Parents)
**Principle:** In education purchases, trust is often the gating factor—especially when a parent is the payer.

**What credibility looks like (high-level):**
- “This is serious” (professional design, clarity, not hype)
- “This is safe” (data/privacy language that feels responsible)
- “This is real” (grounding in the PAES context and actual past tests)

**Checklist:**
- [ ] Basic “who/why” is accessible within one click (not buried).
- [ ] The product avoids exaggerated claims; uses conservative language and ranges.
- [ ] Privacy/data handling is summarized simply for non-technical readers.

**Research basis:** Responsible data practices and transparency are emphasized by global education/edtech guidance and materially influence adoption and trust. citeturn0search0

---

## Pillar 7 — Let Users Preview Value Before They Commit (Example Results, Proof of Output)
**Principle:** When users can *see what they will get*, they start. This reduces uncertainty and increases diagnostic starts.

**Checklist:**
- [ ] A “See example result” preview exists in the top funnel (landing or pre-diagnostic).
- [ ] The preview demonstrates the *shape* of the output: estimated score band + prioritized next steps + effort framing.
- [ ] The preview is understandable in <30 seconds.

**Research basis:** First-time-use research consistently emphasizes reducing initial friction and uncertainty to improve adoption. citeturn0search4turn0search8

---

## Pillar 8 — Frame Value in the User’s Language: Outcome + Effort + Plan
**Principle:** The “I need this” thought happens when the user can connect:
1) their current situation,  
2) an achievable desired outcome, and  
3) a clear path that feels manageable.

**Checklist:**
- [ ] Outcome is expressed in user terms (score band, readiness, “where you stand”).
- [ ] Effort is concrete (minutes/day, hours/week, number of sessions).
- [ ] Next steps are prioritized (“start here”) rather than exhaustive.

**Research basis:** This is a direct application of activation/Aha engineering (value must be understood, not just computed). citeturn0search2turn0search6

---

## Pillar 9 — Convert by “Saving Progress,” Not by “Marketing Signup”
**Principle:** The most conversion-friendly way to capture contact info is to frame it as **continuity of value**.

**High-level checklist:**
- [ ] The ask is positioned as “save / continue / reserve” rather than “subscribe.”
- [ ] The user understands what they will receive and when.
- [ ] The product reduces perceived risk (easy opt-out, no spam posture).

**Research basis:** Activation design emphasizes sequencing: deliver value first, then ask for the next commitment. citeturn0search6turn0search10

---

## Pillar 10 — Instrument Everything, Then Iterate with Small, Fast Tests
**Principle:** “Best UX” is what measurably improves completion, comprehension, and intent—on your traffic.

**Minimum instrumentation (conceptual):**
- Diagnostic started → completed
- Results viewed → interactions (scroll, expand details)
- Signup prompt viewed → signup completed
- Drop-off points (question index, device, channel)

**Testing discipline:**
- Change one thing at a time.
- Favor tests that reduce friction or increase comprehension over cosmetic changes.
- Treat copy as a product lever (often higher ROI than layout tweaks).

**Research basis:** Activation playbooks and Reforge-style activation analysis emphasize measurement, drop-off diagnosis, and iterative improvement. citeturn0search22turn0search10


---

## Pillar 11 — Match the Entry Mechanism to Visitor Intent (Diagnostic Is Powerful, Not Universal)
**Principle:** A full diagnostic is an excellent conversion path for *high-intent* visitors, but it can underperform for *low-intent* or uncertain visitors due to upfront effort and anxiety. The conversion-optimized architecture is usually **one primary high-value path + one low-friction alternative**, both converging on the same value.

### How to apply this (high-level)
- Treat the **full diagnostic** as the primary path for users ready to engage now.
- Add **one** low-friction entry that previews value and reduces uncertainty, then invites the full diagnostic (progressive disclosure).

### Candidate low-friction entries (pick one)
- **Example Results Preview:** Show a realistic sample output (“what you’ll get”) before asking for time investment.
- **Quick Check (60–120s):** A small set of inputs that yields a *rough* estimate + prompts the full diagnostic for accuracy.
- **Micro-Diagnostic (1–2 questions):** Give a “taste” of atom mapping and explain how the plan is generated.

### Decision rule (so you don’t guess)
Instrument:
- Landing → diagnostic start
- Diagnostic start → completion
- Completion → signup-after-results

Interpret:
- Low start rate ⇒ uncertainty/trust problem ⇒ preview value (example results)
- Low completion rate ⇒ friction/cognitive load problem ⇒ shorten/simplify diagnostic
- High completion but low signup-after-results ⇒ value framing / CTA / perceived risk problem

**Outcome:** You keep the diagnostic as your “serious” conversion engine while capturing more of the funnel with a lightweight preview path.


---

# Practical “Guardrails” (So You Don’t Regress)
Use these as non-negotiables during rapid iteration:
1. **Never add steps before value** unless they increase completion.
2. **One primary action per page.**
3. **Users should always know: where they are, what’s next, and how long it will take.**
4. **Every claim must feel credible; avoid hype.**
5. **Preview output (example results) whenever uncertainty is a barrier.**
6. **Measure before/after for any meaningful change.**

---

## Sources (for internal reference)
- Nielsen Norman Group: *Product-Led Growth and UX*; *Progress Indicators…*; *Reducing Cognitive Load in Forms*; onboarding guidance.  
- Reforge: *Define your Aha Moment*; *Define Customer Activation Moments*; *Analyze Activation*.  
- BJ Fogg / Stanford: *Fogg Behavior Model* (B=MAP) and related academic paper on persuasive design.  
- FTUE / onboarding literature discussing first-time use friction and adoption effects.

