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
        "kuning-tinta": "#1a1408",
        // Token landing versi cerebrium-style. Nilai dan rasio kontras ada di DESIGN.md.
        "cb-kertas": "#ffffff",
        "cb-kabut": "#eef2f5",
        "cb-tinta": "#1b2540",
        "cb-tinta-lembut": "#4a5878",
        "cb-malam": "#0f1b3d",
        "cb-malam-lembut": "#b8c3dc",
        "cb-garis": "#d5dce8",
        "cb-garis-gelap": "#2a3a66"
      },
      fontFamily: {
        archivo: ["var(--font-archivo)", "system-ui", "sans-serif"],
        "cb-headline": ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        "cb-body": ["var(--font-inter)", "system-ui", "sans-serif"],
        "cb-mono": ["var(--font-mono-cb)", "ui-monospace", "monospace"]
      }
    }
  },
  plugins: []
};
