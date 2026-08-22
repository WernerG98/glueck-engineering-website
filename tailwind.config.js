/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
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
