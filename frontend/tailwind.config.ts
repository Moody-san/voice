import type { Config } from "tailwindcss";

/**
 * Modernist design system, ported from the cover repo's `.ff-app` palette:
 * a monochrome, editorial look — warm off-white ground, near-black "ink",
 * hairline rules, Archivo for UI and JetBrains Mono for data.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--ff-bg)",
        surface: "var(--ff-surface)",
        card: "var(--ff-card)",
        ink: "var(--ff-ink)",
        "ink-2": "var(--ff-ink-2)",
        text: "var(--ff-text)",
        soft: "var(--ff-soft)",
        muted: "var(--ff-muted)",
        faint: "var(--ff-faint)",
        line: "var(--ff-line)",
        "line-2": "var(--ff-line-2)",
        rule: "var(--ff-rule)",
        "rule-soft": "var(--ff-rule-soft)",
        ok: "var(--ff-ok)",
        success: "var(--ff-success)",
        "success-soft": "var(--ff-success-soft)",
        "success-text": "var(--ff-success-text)",
        warning: "var(--ff-warning)",
        "warning-text": "var(--ff-warning-text)",
        danger: "var(--ff-danger)",
        "danger-soft": "var(--ff-danger-soft)",
        "danger-text": "var(--ff-danger-text)",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
