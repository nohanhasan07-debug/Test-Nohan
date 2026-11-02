/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070707',
          900: '#0E0E0E',
          800: '#171717',
          700: '#262626',
        },
        paper: '#F5F5F2',
        neon: { DEFAULT: '#C8FF2E', light: '#DDFF70', dark: '#9ACC1F' },
        loss: '#FF5C6C',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
      },
    },
  },
  plugins: [],
};
