# UX/UI Improvements Roadmap

Key improvements to enhance student experience in the diagnostic app.

---

## Completed ✅

### Accessibility Compliance (Done Jan 2026)

**Changes made:**
- ✅ Added `aria-label` to all interactive buttons (answer options, navigation, retry, skip)
- ✅ Added `aria-pressed` to toggle-style buttons (option selection, "No lo sé")
- ✅ Added `role="alert" aria-live="polite"` to error messages in QuestionScreen and SignupScreen
- ✅ Added `role="status" aria-live="polite"` to loading state for screen reader announcements
- ✅ Added proper `<label>` element to email input with `sr-only` class
- ✅ Added `aria-describedby` and `aria-invalid` to form input for error association
- ✅ Added `aria-hidden="true"` to decorative SVG icons
- ✅ ResultsComponents already had icons alongside color-coded badges (star, trendUp, target)

**Files updated**: `QuestionScreen.tsx`, `SignupScreen.tsx`

---

### Mobile Responsiveness (Done Jan 2026)

**Changes made:**
- ✅ Deleted unused Knowledge Graph (`/graph`) - was dead code
- ✅ Fixed diagnostic header for mobile (stacked layout, smaller elements, separate mobile progress bar)
- ✅ Fixed WelcomeScreen info cards grid (responsive padding/text)
- ✅ Fixed TransitionScreen stats grid (stacks on mobile)
- ✅ Fixed ResultsScreen score text size, stats grid, decorative elements, CTA padding
- ✅ Fixed ResultsComponents route card grid
- ✅ Fixed QuestionReviewDrawer filter buttons (flex-wrap)
- ✅ Fixed SignupScreen input text size (prevents iOS zoom)
- ✅ Fixed QuestionScreen option buttons (responsive gaps, padding, text, touch targets)
- ✅ Fixed QuestionScreen question content text size
- ✅ Fixed ThankYouScreen decorative elements
- ✅ Fixed landing page decorative elements (responsive sizes)
- ✅ Fixed landing page hero text sizes

**Touch targets verified:**
- Option buttons: 40px mobile / 44px desktop (meets 44px guideline on desktop, acceptable on mobile)
- Next/CTA buttons: Large touch area with padding
- All interactive elements have adequate spacing

---

## High Priority

### ~~2. Timer Visibility & Warnings~~ ✅ (Done Jan 2026)

**Changes made:**
- ✅ Created reusable `Timer` component in `shared.tsx` (SOLID/DRY)
- ✅ Added configurable warning thresholds via `TIMER_THRESHOLDS` constant
- ✅ Critical state (≤30s): Red background, white text, pulse animation, bounce icon
- ✅ Warning state (≤5min): Red background with pulse
- ✅ Caution state (≤10min): Amber background
- ✅ Added `role="timer"` and `aria-live` for screen reader announcements
- ✅ Critical state uses `aria-live="assertive"` for urgent announcements

**Files updated**: `shared.tsx`, `page.tsx`, `index.ts`

---

### 3. Loading & Error States

**Problem**: Async operations lack clear feedback, leaving students uncertain.

**Actions**:
- Add loading spinners/skeletons for question loading
- Add clear error messages with retry options
- Show subtle indicator when using local storage fallback (offline mode)

**Files**: `QuestionScreen.tsx`, `page.tsx`

---

## Medium Priority

### 4. "No lo sé" Button Distinction

**Problem**: Button can be confused with answer options.

**Actions**:
- Change to outline/ghost style instead of filled
- Position it separately from answer options (e.g., below with spacing)

**File**: `QuestionScreen.tsx`

---

### 5. Results Screen Organization

**Problem**: Multiple metrics displayed at once can overwhelm students.

**Actions**:
- Group related information into collapsible sections
- Show summary first, details on demand
- Add brief explanations for what each metric means

**Files**: `ResultsScreen.tsx`, `ResultsComponents.tsx`

---

### 6. Touch Target Sizes

**Problem**: Some interactive elements may be too small for comfortable touch interaction.

**Actions**:
- Ensure all buttons are minimum 44x44px
- Add adequate spacing between adjacent touch targets
- Verify on actual mobile devices

**Files**: All component files with buttons

---

### 7. Question Review Performance

**Problem**: Fetching all questions at once can be slow with many questions.

**Actions**:
- Implement lazy loading or pagination
- Show loading indicator while fetching

**File**: `QuestionReviewDrawer.tsx`

---

## Low Priority (Nice to Have)

### 8. Navigation Clarity

**Actions**:
- Add clear messaging that the diagnostic is forward-only (if intentional)
- Or add back button with confirmation dialog

---

### 9. Confetti Performance

**Actions**:
- Reduce particle count on mobile/low-end devices
- Add performance detection to adjust animation intensity

**File**: `Confetti.tsx`

---

## Implementation Notes

- Test all changes on mobile devices (iOS Safari, Android Chrome)
- Run accessibility audit after changes (axe DevTools, Lighthouse)
- Get student feedback on changes before full rollout
