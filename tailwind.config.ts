import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Superficies (Apple HIG)
        canvas: '#F2F2F7', // systemGroupedBackground
        surface: '#FFFFFF', // secondarySystemGroupedBackground
        'surface-elevated': '#FFFFFF',
        // Texto
        ink: '#000000',
        ash: '#3C3C43', // 60% / 30% según uso
        // Separadores
        mist: '#C6C6C8',
        // Compatibilidad (antes pearl = superficie secundaria)
        pearl: '#FFFFFF',
        // Acentos de estado
        alarm: '#FF3B30', // iOS red
        accent: '#007AFF', // iOS blue
        success: '#34C759', // iOS green
        warning: '#FF9500', // iOS orange
        brand: {
          50: '#EAF3FF',
          100: '#D6E8FF',
          200: '#AFCFFF',
          300: '#7FB0FF',
          400: '#4A8CFF',
          500: '#007AFF',
          600: '#0066D6',
          700: '#0052AD',
          800: '#003D80',
          900: '#002952',
        },
      },
      fontFamily: {
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        ui: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        editorial: '-0.02em',
        wider2: '0.08em',
      },
      borderRadius: {
        none: '0',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
        focus: '0 0 0 3px rgba(0, 122, 255, 0.35)',
      },
      transitionTimingFunction: {
        edit: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
