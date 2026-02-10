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
          DEFAULT: '#c5a95e',  // Realty ONE gold
          light: '#d4b76f',
          dark: '#b09850',
        },
        black: {
          DEFAULT: '#000000',  // Pure black
          light: '#262626',    // Realty ONE dark
          medium: '#1a1a1a',
        },
        white: {
          DEFAULT: '#ffffff',  // Pure white for bright design
          off: '#fafafa',
        },
      },
      fontFamily: {
        sans: ['"Exo 2"', 'system-ui', 'sans-serif'],
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
