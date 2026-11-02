/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#3D0C15', light: '#5C1A26', dark: '#2B080F' },
        cream: { DEFAULT: '#FDF6E9', dark: '#F4E8CF' },
        gold: { DEFAULT: '#D89F3A', light: '#EBC77F', dark: '#A8741F' },
        clay: { DEFAULT: '#8C2B39', light: '#B9505F' },
        olive: { DEFAULT: '#4F6B3A', light: '#7A9A5F' },
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
