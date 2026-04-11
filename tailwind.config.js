/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          dark: '#B49A3A',
          light: '#D4B96A',
          50: '#FBF7EC',
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
        // Dashboard design system colors
        dashboard: {
          gold: '#C9A84C',
          black: '#0A0A0A',
          offwhite: '#FAFAF5',
          body: '#333333',
          secondary: '#888888',
          surface: '#F5F5F0',
          border: '#E5E5E0',
          teal: '#0D9488',
          'teal-light': '#CCFBF1',
          accent: '#F59E0B',
        },
        score: {
          hot: '#DC2626',
          warm: '#EA580C',
          cool: '#2563EB',
          cold: '#9CA3AF',
        },
        status: {
          success: '#16A34A',
          error: '#DC2626',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        // PUBLIC WEBSITE fonts — Realty ONE Group brand standards
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],        // luxury headings
        lato: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],        // body text (Museo Sans equiv)
        jakarta: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],     // explicit public body
        // DASHBOARD fonts — enterprise SaaS standard (Google / Claude / Stripe)
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
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
        'gold-glow': '0 8px 32px rgba(201, 168, 76, 0.25)',
        'gold-glow-lg': '0 16px 48px rgba(201, 168, 76, 0.35)',
      },
    },
  },
  plugins: [],
}
