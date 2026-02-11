/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C5A95E',
          dark: '#B8973A',
          light: '#E0C67B',
          50: '#FBF7ED',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          100: '#1A1A1A',
          200: '#111111',
        },
        warm: {
          white: '#FAFAF5',
          ivory: '#F5F0E8',
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        lato: ['"Lato"', 'sans-serif'],
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '992px',   // Realty ONE
        'xl': '1440px',  // Realty ONE
        '2xl': '1920px', // Realty ONE
        '3xl': '2900px', // Realty ONE
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
        screens: {
          'xl': '2300px', // Realty ONE max-width
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'premium': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'premium-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
        'gold-glow': '0 8px 32px rgba(197, 169, 94, 0.25)',
        'gold-glow-lg': '0 16px 48px rgba(197, 169, 94, 0.35)',
      },
    },
  },
  plugins: [],
}
