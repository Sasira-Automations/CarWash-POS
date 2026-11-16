/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sparkle: {
          blue: '#185aed',
          navy: '#0b1b3d',
          dark: '#0f172a',
          accent: '#00d2ff',
          lightBlue: '#eef4ff'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(0, 38, 110, 0.05)',
        'card-hover': '0 20px 35px -5px rgba(0, 38, 110, 0.1)',
        'blue-glow': '0 10px 25px -3px rgba(24, 90, 237, 0.35)',
      }
    },
  },
  plugins: [],
}
