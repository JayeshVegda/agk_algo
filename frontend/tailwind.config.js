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
          bg: 'var(--akg-bg)',
          bgDeep: 'var(--akg-bg-deep)',
          surface: 'var(--akg-bg-elevated)',
          surfaceElevated: 'var(--akg-bg-elevated-2)',
          card: 'var(--akg-bg-card)',
          text: 'var(--akg-text)',
          textSecondary: 'var(--akg-text-secondary)',
          muted: 'var(--akg-text-muted)',
          hairline: 'var(--akg-hairline)',
          border: 'var(--akg-border)',
          borderSubtle: 'var(--akg-hairline)',
          green: 'var(--akg-accent)',
          greenDark: 'var(--akg-accent-deep)',
          // Aliases to gracefully absorb old references into the clean emerald system
          gold: 'var(--akg-accent)',
          goldDeep: 'var(--akg-accent-deep)',
          goldLight: 'var(--akg-accent)',
          goldPale: 'var(--akg-accent-soft)',
          silver: 'var(--akg-text)',
          silverDark: 'var(--akg-text-secondary)',
        },
        background: 'var(--akg-bg)',
        surface: 'var(--akg-bg-elevated)',
        card: 'var(--akg-bg-card)',
        'card-hover': 'var(--akg-bg-elevated-2)',
        border: 'var(--akg-hairline)',
        'border-light': 'var(--akg-hairline)',
        primary: {
          DEFAULT: 'var(--akg-accent)',
          hover: 'var(--akg-accent-deep)',
          light: 'var(--akg-accent-soft)',
          dark: 'var(--akg-accent-deep)',
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
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      transitionTimingFunction: {
        'akg': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'ticker': 'ticker 45s linear infinite',
      },
    },
  },
  plugins: [],
}
