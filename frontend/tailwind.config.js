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
          base: '#fbfefb',
          surface: '#ffffff',
          subtle: '#efe5dc',
          inverse: '#d0b8ac',
        },
        border: {
          default: '#e5ddd5',
          strong: '#d0c8bf',
          focus: '#c9a88a',
        },
        text: {
          primary: '#4a4540',
          secondary: '#6a5a50',
          muted: '#8a7a70',
          inverse: '#4a4540',
          link: '#8b6f5a',
        },
        accent: {
          DEFAULT: '#c9a88a',
          hover: '#b89570',
          subtle: '#f3d8c7',
          text: '#8b6f5a',
        },
        success: {
          DEFAULT: '#7d9a6f',
          subtle: '#e8f0e5',
          text: '#4a6340',
        },
        warning: {
          DEFAULT: '#c9a04a',
          subtle: '#f5f0e0',
          text: '#7a6020',
        },
        danger: {
          DEFAULT: '#c47a7a',
          subtle: '#f8e8e8',
          text: '#8a4a4a',
        },
        neutral: {
          DEFAULT: '#8a847a',
          subtle: '#f0ebe5',
          text: '#5a544d',
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