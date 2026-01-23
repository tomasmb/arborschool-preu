# UX/UI Improvements Roadmap

Key improvements to enhance student experience in the diagnostic app.

---

## Summary

| Priority | Item | Status |
|----------|------|--------|
| High | Accessibility Compliance | ✅ Done |
| High | Mobile Responsiveness | ✅ Done |
| High | Timer Visibility & Warnings | ✅ Done |
| High | Loading & Error States | ✅ Done |
| Medium | "No lo sé" Button Distinction | ✅ Done |
| Medium | Results Screen Organization | ✅ Done |
| Medium | Touch Target Sizes | ✅ Done |
| Medium | Question Review UX Refactor | ✅ Done |
| Low | Navigation Clarity | Pending |
| Low | Confetti Performance | Pending |

**Completion: 8/10 items done**

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

### Timer Visibility & Warnings (Done Jan 2026)

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

### Loading & Error States (Done Jan 2026)

**Changes made:**
- ✅ Created `QuestionSkeleton` component in `shared.tsx` that mimics question layout
- ✅ Skeleton shows animated placeholder for metadata badges, question text, 4 answer options, and buttons
- ✅ Created `OfflineIndicator` component for local storage fallback mode
- ✅ Indicator shows dismissible toast when operating offline, explaining responses save locally
- ✅ Error states with retry already existed (up to 2 retries before maintenance screen)
- ✅ Added proper `role="status"` and `aria-label` for screen reader announcements

**Files updated**: `shared.tsx`, `QuestionScreen.tsx`, `page.tsx`, `index.ts`

---

### "No lo sé" Button Distinction (Done Jan 2026)

**Changes made:**
- ✅ Repositioned button below answer options with visual separator (border-top + margin)
- ✅ Changed to subtle ghost style with ring highlight when selected
- ✅ Smaller, more secondary appearance (text-sm, py-3)
- ✅ Updated skeleton to match new layout

**Files updated**: `QuestionScreen.tsx`, `shared.tsx`

---

### Results Screen Organization (Done Jan 2026)

**Changes made:**
- ✅ Created `CollapsibleSection` component for organizing content
- ✅ Wrapped Axis Performance, Learning Routes, and Maximum Potential in collapsible sections
- ✅ Added help tooltips explaining each metric
- ✅ Maximum Potential starts collapsed by default (less critical info)
- ✅ Shows summary text in header when collapsed

**Files updated**: `shared.tsx`, `ResultsScreen.tsx`, `index.ts`

---

### Touch Target Sizes (Done Jan 2026)

**Changes made:**
- ✅ Close button in QuestionReviewDrawer: 40px → 44px (w-11 h-11)
- ✅ Help info button in CollapsibleSection: p-1 → w-8 h-8 (32px minimum)
- ✅ Dismiss button in OfflineIndicator: p-1 → w-8 h-8 (32px minimum)
- ✅ All primary interactive buttons already meet 44px guideline
- ✅ Answer option buttons have full-width touch areas

**Files updated**: `QuestionReviewDrawer.tsx`, `shared.tsx`

---

### Question Review UX Refactor (Done Jan 2026)

**Changes made:**
- ✅ Completely redesigned from scrollable list to single-question view with navigation
- ✅ Navigation sidebar with numbered question pills (color-coded: green/red/gray)
- ✅ Active question highlighted with ring + scale effect
- ✅ Prev/Next buttons in footer with keyboard support (Arrow keys, Escape)
- ✅ Click any pill to jump directly to that question
- ✅ Mobile responsive: sidebar becomes horizontal scrollable row at top
- ✅ Deleted `QuestionReviewItem.tsx` (consolidated into drawer)
- ✅ Split into `QuestionReviewDrawer.tsx` (397 lines) + `QuestionReviewContent.tsx` (230 lines)

**Files updated**: `QuestionReviewDrawer.tsx`, `QuestionReviewContent.tsx` (new), `index.ts`

**Files deleted**: `QuestionReviewItem.tsx`

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

---

## Architecture & Code Quality

### File Size Limits
All component files maintained under 500 lines:
- `shared.tsx`: 494 lines (reusable components)
- `QuestionScreen.tsx`: 398 lines
- `QuestionReviewDrawer.tsx`: 397 lines
- `ResultsScreen.tsx`: 362 lines
- All others: < 250 lines

### SOLID Principles Applied

**Single Responsibility:**
- `QuestionSkeleton` - only renders loading skeleton
- `OfflineIndicator` - only handles offline status display
- `CollapsibleSection` - only handles expand/collapse behavior
- `Timer` - only handles time display and warning states

**Open/Closed:**
- `Timer` uses configurable `TIMER_THRESHOLDS` constant
- `CollapsibleSection` accepts children for flexible content

**DRY (Don't Repeat Yourself):**
- Shared icons in `Icons` object (shared.tsx)
- Reusable `CollapsibleSection` used 3x in ResultsScreen
- `formatTime()` helper exported for reuse
- QTI parsing logic shared between QuestionScreen and QuestionReviewDrawer

### Responsive Design Patterns
- Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Flex direction changes: `flex-col sm:flex-row`
- Hidden elements: `hidden sm:block`, `sm:hidden`
- Touch targets: minimum 32-44px on all interactive elements
- Text scaling: `text-sm sm:text-base`

### Accessibility Standards
- All buttons have `aria-label`
- Toggle buttons use `aria-pressed`
- Live regions: `role="status"`, `role="timer"`, `role="alert"`
- Critical announcements: `aria-live="assertive"`
- Decorative elements: `aria-hidden="true"`
