/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Named by role, not lightness: `ink` is the page and surface color, `paper` the text color.
        white: '#2A0A10',
        ink: {
          950: '#FBF8F3',
          900: '#F3ECE2',
          800: '#EAE0D2',
          700: '#DCCFBE',
        },
        paper: '#2A0A10',
        neon: { DEFAULT: '#9A6B1F', light: '#B8842E', dark: '#7A5214' },
        loss: '#B3212F',
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
