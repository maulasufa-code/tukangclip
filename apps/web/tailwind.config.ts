/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tinta: "#1c1917",
        kertas: "#fafaf9",
        aksen: "#b45309"
      }
    }
  },
  plugins: []
};
