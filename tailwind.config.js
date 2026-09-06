/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#10151f",
          900: "#151b27",
          850: "#1a2130",
          800: "#202838",
          700: "#2a3345",
          600: "#384056",
          500: "#4b5570",
          400: "#6b7690",
          300: "#98a2b8",
          200: "#c1c8d6",
          100: "#e6e9f0",
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
