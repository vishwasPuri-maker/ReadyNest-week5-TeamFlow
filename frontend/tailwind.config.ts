import type { Config } from 'tailwindcss';

// Cal.com monochrome system (see frontend/Design.md). The `brand-*` scale is
// remapped to grayscale so existing utility classes across the app become
// on-theme without touching every file.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#101010',
        graphite: '#242424',
        slate: '#6b7280',
        stone: '#898989',
        silver: '#e5e7eb',
        paper: '#f4f4f4',
        actionblue: '#0099ff',
        brand: {
          50: '#f4f4f4', // paper — soft accent bg (active nav, chips)
          100: '#e5e7eb', // silver — borders/rings
          500: '#101010', // ink — primary actions
          600: '#000000', // hover
          700: '#242424', // graphite — strong text / active
        },
      },
    },
  },
  plugins: [],
};

export default config;
