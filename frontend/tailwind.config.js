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
          base: '#FAFBFC',
          surface: '#FFFFFF',
          subtle: '#F4F6F8',
          inverse: '#4338CA',
        },
        border: {
          default: '#E5E7EB',
          strong: '#D1D5DB',
          focus: '#6366F1',
        },
        text: {
          primary: '#111827',
          secondary: '#4B5563',
          muted: '#9CA3AF',
          inverse: '#FFFFFF',
          link: '#6366F1',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          subtle: '#EEF2FF',
          text: '#4338CA',
        },
        success: {
          DEFAULT: '#10B981',
          subtle: '#D1FAE5',
          text: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          subtle: '#FEF3C7',
          text: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle: '#FEE2E2',
          text: '#DC2626',
        },
        neutral: {
          DEFAULT: '#6B7280',
          subtle: '#F3F4F6',
          text: '#374151',
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