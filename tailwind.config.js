/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#f8fafc",
          900: "#f1f5f9",
          850: "#eaeff5",
          800: "#e2e8f0",
          700: "#cbd5e1",
          600: "#94a3b8",
          500: "#64748b",
          400: "#475569",
          300: "#334155",
          200: "#1e293b",
          100: "#0f172a",
        },
        accent: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        pos: {
          400: "#34d399",
          500: "#10b981",
          cyan: "#22d3ee",
        },
        neg: {
          400: "#f87171",
          500: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
