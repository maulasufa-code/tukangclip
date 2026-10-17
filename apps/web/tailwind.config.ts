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
        // Token landing. Alasan tiap nilai dan rasio kontrasnya ada di DESIGN.md.
        arang: "#0c0a09",
        permukaan: "#1a1513",
        garis: "#332c26",
        "garis-terang": "#6b6157",
        teks: "#f4f1ee",
        "teks-lembut": "#b3aaa2",
        kuning: "#fcc401",
        "kuning-tekan": "#ffd83d",
        "kuning-tinta": "#1a1408"
      },
      fontFamily: {
        archivo: ["var(--font-archivo)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
