/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
        'calc': 'calc(100vh - 80px)'
      }
    },
  },
  plugins: [],
}

