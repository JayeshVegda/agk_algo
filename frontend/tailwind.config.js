/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Montserrat', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        akg: {
          bg: '#07090D',
          surface: '#10141B',
          surfaceElevated: '#171D26',
          gold: '#F3C653',
          goldDeep: '#A87927',
          goldLight: '#FFE58A',
          silver: '#E7E9EF',
          silverDark: '#282D36',
          green: '#00D878',
          greenDark: '#00A35B',
          muted: '#A6ADB9',
          border: 'rgba(243, 198, 83, 0.16)',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
        },
        background: '#07090D',
        surface: '#10141B',
        card: '#10141B',
        'card-hover': '#171D26',
        border: 'rgba(255, 255, 255, 0.1)',
        'border-light': 'rgba(255, 255, 255, 0.05)',
        primary: {
          DEFAULT: '#F3C653',
          hover: '#FFE58A',
          light: '#FFF4D1',
          dark: '#A87927',
        },
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'gold': '0 0 25px -5px rgba(243, 198, 83, 0.25)',
        'green': '0 0 25px -5px rgba(0, 216, 120, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
