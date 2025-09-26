/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx,html}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        charcoal: "var(--color-charcoal)",
        coolgray: "var(--color-cool-gray)",
        offwhite: "var(--color-off-white)",
        accent: "var(--color-accent)"
      },
      fontFamily: {
        serif: ["var(--font-primary)"],
        sans: ["var(--font-secondary)"]
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)"
      }
    }
  },
  plugins: []
};
