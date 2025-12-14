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
        xsrn: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#14b8a6',
          dark: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
