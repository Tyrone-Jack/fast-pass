/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        allow: "#16a34a",
        deny: "#dc2626",
        pending: "#eab308",
      },
    },
  },
  plugins: [],
};
