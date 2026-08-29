/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#08090b",
          900: "#0d0f12",
          850: "#121417",
          800: "#17191d",
          700: "#212429",
          600: "#2c2f36",
          500: "#3d414a",
          400: "#5c6270",
          300: "#8890a0",
          200: "#b4bac6",
          100: "#e2e5ea",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
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
