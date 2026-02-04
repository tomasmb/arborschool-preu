# Arbor Design System

## Colors

### Primary Palette
```
Navy Primary     #0B3A5B   ← Brand color, headings, buttons
Navy Light       #134B73   ← Hover states
Navy Dark        #072A42   ← Pressed states
```

### Accent Palette
```
Gold Accent      #D97706   ← CTAs, highlights, links
Gold Light       #F59E0B   ← Hover states, subtle accents
Gold Dark        #B45309   ← Pressed states
```

### Neutral Palette
```
Charcoal         #1A1D1E   ← Primary text
Cool Gray        #64748B   ← Secondary text
Light Gray       #94A3B8   ← Disabled, placeholders
```

### Background Palette
```
White            #FFFFFF   ← Cards, modals
Off-white        #F1F5F9   ← Page backgrounds
Light BG         #E2E8F0   ← Alternate sections
Cream            #FFFBF5   ← Warm backgrounds
```

### Semantic Colors
```
Success          #059669   ← Positive actions
Error            #DC2626   ← Errors, warnings
```

---

## Typography

| Usage      | Font Family   | Weight   |
|------------|---------------|----------|
| Headings   | Merriweather  | Bold     |
| Body       | Inter/Roboto  | Regular  |
| Captions   | Inter/Roboto  | Light    |

**Google Slides Note:** Use Roboto instead of Inter (Inter may not be available).

---

## Logo Assets

### Available Variants

| File | Color | Use Case |
|------|-------|----------|
| `logo-arbor-navy.svg/png` | Navy #0B3A5B | Light backgrounds (default) |
| `logo-arbor-white.svg/png` | White #FFFFFF | Dark/Navy backgrounds |
| `logo-arbor-gold.svg/png` | Gold #D97706 | Special emphasis |
| `logo-arbor-charcoal.svg/png` | Charcoal #1A1D1E | Neutral dark option |

### Usage Guidelines

- **Light backgrounds (cream, white, off-white):** Use Navy or Charcoal logo
- **Dark backgrounds (navy, charcoal):** Use White logo
- **Accent slides:** Gold logo can be used sparingly

### Minimum Size
- Digital: 60px height minimum
- Print: 15mm height minimum

---

## Google Slides Theme Colors

When setting up a Google Slides theme, use these mappings:

| Slot | Color | Hex |
|------|-------|-----|
| Texto y fondo 1 | Charcoal | `1A1D1E` |
| Texto y fondo 2 | White | `FFFFFF` |
| Texto y fondo 3 | Cool Gray | `64748B` |
| Texto y fondo 4 | Cream | `FFFBF5` |
| Énfasis 1 | Navy | `0B3A5B` |
| Énfasis 2 | Gold | `D97706` |
| Énfasis 3 | Navy Light | `134B73` |
| Énfasis 4 | Gold Light | `F59E0B` |
| Énfasis 5 | Success | `059669` |
| Énfasis 6 | Off-white | `F1F5F9` |
| Vínculo | Gold | `D97706` |

---

## File Structure

```
design-system/
├── README.md
├── logo-arbor.svg          ← Original isotipo (navy)
├── logo-arbor-navy.svg
├── logo-arbor-navy.png
├── logo-arbor-white.svg
├── logo-arbor-white.png
├── logo-arbor-gold.svg
├── logo-arbor-gold.png
├── logo-arbor-charcoal.svg
├── logo-arbor-charcoal.png
└── email-signature.html    ← Gmail signature template
```

---

## Email Signature

### Setup Instructions

1. **Host the isotipo PNG:**
   - Upload `logo-arbor-navy.png` to your website or Imgur
   - Copy the direct image URL

2. **Configure signature:**
   - Open `email-signature.html` in a text editor
   - Replace `LOGO_URL_HERE` with your hosted image URL
   - Open the HTML file in a browser
   - Select all (Cmd+A) → Copy (Cmd+C)
   - Go to Gmail → Settings → See all settings → General → Signature
   - Paste (Cmd+V)

### Email Signature Colors

| Element | Color | Hex |
|---------|-------|-----|
| Name | Charcoal | `#1A1D1E` |
| Title | Cool Gray | `#64748B` |
| Accent line | Gold | `#D97706` |
| Links | Navy | `#0B3A5B` |
