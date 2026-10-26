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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
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
          goldPale: '#FFF4D1',
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
      // Metallic gold gradient stops for .text-metallic and .bg-metallic
      backgroundImage: {
        'metallic-gold': 'linear-gradient(115deg, #8A6420 0%, #F3C653 28%, #FFF4D1 46%, #F3C653 62%, #A87927 88%)',
        'metallic-silver': 'linear-gradient(115deg, #6E7686 0%, #E7E9EF 30%, #FFFFFF 48%, #C9CEDA 65%, #7C8496 90%)',
        'panel-glow': 'radial-gradient(60% 50% at 50% 0%, rgba(243, 198, 83, 0.08) 0%, rgba(243, 198, 83, 0) 100%)',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'gold': '0 0 25px -5px rgba(243, 198, 83, 0.25)',
        'green': '0 0 25px -5px rgba(0, 216, 120, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glass': '0 18px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      transitionTimingFunction: {
        'akg': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'ticker': 'ticker 38s linear infinite',
        'ticker-fast': 'ticker 22s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'float-y': 'float-y 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
