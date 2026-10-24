/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#070d17',
        card: '#0e1824',
        border: '#1f2e42',
        primary: '#3b82f6',
        mint: '#10b981',
        amber: '#f59e0b',
        rose: '#ef4444',
      }
    },
  },
  plugins: [],
}