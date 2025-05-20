/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/sidePanel/index.html",
  ],
  theme: {
    extend: {borderColor: {
      'subtle-light': 'rgba(0, 0, 0, 0.3)',   // For light theme
      'subtle-dark': 'rgba(255, 255, 255, 0.3)', // For dark theme
      keyframes: {
        "border-pulse": {
          "0%, 100%": { borderColor: "rgba(var(--ring), 0.5)" }, // Adjust color and opacity as needed
          "50%": { borderColor: "rgba(var(--ring), 1)" },
        },
      },
      animation: {
        "input-focus": "border-pulse 1.5s ease-in-out infinite", // Adjust duration and easing
      },
    },
  },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide'), require('tailwind-scrollbar')],
}

