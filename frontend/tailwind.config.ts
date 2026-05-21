/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        border: 'var(--border-color)',
        accent: {
          DEFAULT: '#6C4FF6',
          hover: '#5A3DE0',
          light: 'rgba(108, 79, 246, 0.12)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        danger: '#E24B4A',
        success: '#3B6D11',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        ui: '13px',
        body: '15px',
        heading: '18px',
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
        pill: '20px',
        input: '4px',
      },
      spacing: {
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
        24: '24px',
        32: '32px',
        48: '48px',
        64: '64px',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
