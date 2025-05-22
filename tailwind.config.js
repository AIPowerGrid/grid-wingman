/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/sidePanel/index.html",
  ],
  theme: {
    extend: {
      borderColor: {
        'subtle-light': 'rgba(0, 0, 0, 0.3)',
        'subtle-dark': 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide'), require('tailwind-scrollbar')],
}