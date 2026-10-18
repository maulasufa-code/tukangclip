/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Token halaman aplikasi, dipakai apa adanya sejak Fase 1.
        tinta: "#1f1400",
        kertas: "#fff9e6",
        aksen: "#8a3a00",
        // Token landing. Nilai dan arah visual ada di DESIGN.md.
        cl: {
          bg: "#0d0803",
          night: "#1b1308",
          paper: "#fffdf6",
          slate: "#fff0b8",
          sun: "#fcc501",
          ink: "#1f1400",
          "ink-soft": "#7a5a00",
          muted: "#dccdae",
          accent: "#fcc501",
          "accent-hi": "#ffd84a",
          "accent-ink": "#1f1400",
          orange: "#ff8a1f",
          rust: "#7a3300",
          seg: "#3a2a00"
        },
        // Netral hangat untuk halaman aplikasi: border dan teks sekunder condong ke kuning.
        stone: {
          200: "#f1e3b4",
          300: "#b08a35",
          400: "#8f7020",
          600: "#6b5200",
          700: "#4a3600",
          900: "#1f1400"
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
