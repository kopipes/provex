/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#F7F7F6',
          surface: '#FFFFFF',
          subtle: '#F0EFED',
          inverse: '#18181B',
        },
        border: {
          default: '#E4E4E1',
          strong: '#CDCDC9',
          focus: '#3B6EF8',
        },
        text: {
          primary: '#18181B',
          secondary: '#6B6B6B',
          muted: '#A3A3A0',
          inverse: '#FFFFFF',
          link: '#3B6EF8',
        },
        accent: {
          DEFAULT: '#3B6EF8',
          hover: '#2D5DE8',
          subtle: '#EEF2FF',
          text: '#2040C0',
        },
        success: {
          DEFAULT: '#16A34A',
          subtle: '#F0FDF4',
          text: '#14532D',
        },
        warning: {
          DEFAULT: '#CA8A04',
          subtle: '#FEFCE8',
          text: '#713F12',
        },
        danger: {
          DEFAULT: '#DC2626',
          subtle: '#FEF2F2',
          text: '#7F1D1D',
        },
        neutral: {
          DEFAULT: '#71717A',
          subtle: '#F4F4F5',
          text: '#3F3F46',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
        'space-10': '40px',
      },
      borderRadius: {
        'radius-sm': '6px',
        'radius-md': '8px',
        'radius-lg': '12px',
        'radius-xl': '16px',
      },
    },
  },
  plugins: [],
}