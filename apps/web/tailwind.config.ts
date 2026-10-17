/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Token halaman aplikasi, dipakai apa adanya sejak Fase 1.
        tinta: "#1c1917",
        kertas: "#fafaf9",
        aksen: "#b45309",
        // Token landing. Nilai dan arah visual ada di DESIGN.md.
        cl: {
          bg: "#050208",
          night: "#101421",
          paper: "#ffffff",
          slate: "#eef2f5",
          ink: "#172b76",
          "ink-soft": "#8e99c4",
          muted: "#c9bdd6",
          accent: "#ff488b",
          "accent-hi": "#ff6aa2",
          "accent-ink": "#1a0610",
          seg: "#59679a"
        }
      },
      fontFamily: {
        archivo: ["var(--font-archivo)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      keyframes: {
        mq: { to: { transform: "translateX(-50%)" } }
      },
      animation: {
        mq: "mq 38s linear infinite"
      }
    }
  },
  plugins: []
};
