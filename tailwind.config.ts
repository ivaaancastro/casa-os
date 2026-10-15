import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        ink: '#0A0A0A',
        ash: '#6B6B6B',
        mist: '#E4E4E4',
        pearl: '#F5F5F5',
        alarm: '#8E2222',
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        ui: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '-0.015em',
        wider2: '0.08em',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
      },
      boxShadow: {
        focus: '0 0 0 2px #0A0A0A',
      },
      transitionTimingFunction: {
        edit: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
