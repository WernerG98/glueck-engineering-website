/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        neutral: {
          450: "#8c8c8c",
        },
        accent: {
          DEFAULT: "#d4af37",
          light: "#e3c565",
          dark: "#a3841f",
        },
      },
    },
  },
  plugins: [],
};
