# UX/UI Improvements Roadmap

Key improvements to enhance student experience in the diagnostic app.

---

## Completed ✅

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

### 1. Accessibility Compliance

**Problem**: Screen reader users and keyboard-only users face barriers.

**Actions**:
- Add `aria-label` to all interactive buttons (answer options, navigation)
- Add `role="alert" aria-live="polite"` to error messages for screen reader announcements
- Ensure all form inputs have associated labels
- Add icons alongside color-coded feedback (not color-only)

**Files**: `QuestionScreen.tsx`, `SignupScreen.tsx`, `ResultsComponents.tsx`

---

### 2. Timer Visibility & Warnings

**Problem**: Students may not notice the timer or realize when time is running low.

**Actions**:
- Add visual warning state when timer drops below 30 seconds (color change, pulse animation)
- Consider adding a subtle sound cue option for low time

**File**: `page.tsx` (diagnostic)

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
