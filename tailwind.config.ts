import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B2545',
          dark: '#07162C',
          light: '#133E68',
        },
        crimson: {
          DEFAULT: '#E63946',
          hover: '#C9182B',
          dark: '#F87171',
          soft: '#FEE8E8',
        },
        surface: {
          light: '#F8FAFC',
          cardLight: '#FFFFFF',
          borderLight: '#E2E8F0',
          dark: '#0A0E17',
          cardDark: '#111827',
          borderDark: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [],
};

export default config;
