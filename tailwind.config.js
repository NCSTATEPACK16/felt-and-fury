/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Colours bind to the CSS-variable design tokens in src/index.css so the
      // utility classes and the raw vars never drift apart.
      colors: {
        gold: "var(--gold)",
        "gold-bright": "var(--gold-bright)",
        crimson: "var(--crimson)",
        felt: "var(--felt)",
        accent: "var(--accent)",
        surface: "var(--surface)",
        win: "var(--win)",
        lose: "var(--lose)",
        info: "var(--info)",
      },
      borderRadius: {
        token: "var(--r-md)",
        "token-lg": "var(--r-lg)",
        "token-xl": "var(--r-xl)",
      },
      boxShadow: {
        card: "var(--shadow-md)",
        lift: "var(--shadow-lg)",
        glow: "var(--glow-gold)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        smooth: "var(--ease-out)",
      },
      // Safe-area inset utilities for iOS (e.g. pt-safe-t, pb-safe-b).
      spacing: {
        "safe-t": "env(safe-area-inset-top)",
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-l": "env(safe-area-inset-left)",
        "safe-r": "env(safe-area-inset-right)",
      },
    },
  },
  plugins: [],
};
