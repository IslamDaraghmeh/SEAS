/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Semantic dark mode colors using CSS variables
        dark: {
          bg: {
            primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
            secondary: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
            tertiary: 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
            elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          },
          surface: {
            DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
            hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
            active: 'rgb(var(--color-surface-active) / <alpha-value>)',
          },
          border: {
            DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
            light: 'rgb(var(--color-border-light) / <alpha-value>)',
            focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
          },
          text: {
            primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
            tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
            muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          },
        },
      },
      spacing: {
        // RTL-friendly spacing using logical properties
      },
    },
  },
  plugins: [],
  // Enable RTL support
  corePlugins: {
    // Use logical properties for RTL support
  },
};
