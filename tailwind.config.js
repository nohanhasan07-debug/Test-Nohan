/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#B5482C', light: '#CC6240', dark: '#1D2B3A' },
        cream: { DEFAULT: '#FBF6EE', dark: '#F3E9D8' },
        gold: { DEFAULT: '#D4E157', light: '#E6EE8C', dark: '#626D0E' },
        clay: { DEFAULT: '#B42323', light: '#D9534F' },
        olive: { DEFAULT: '#3F6B4A', light: '#6E9A78' },
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
