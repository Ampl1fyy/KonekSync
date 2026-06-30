/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ede9f8',
          100: '#d4cbf0',
          500: '#5a3fb5',
          600: '#3D2C8D',
          700: '#2e2070',
        },
        secondary: {
          50: '#e8f5ee',
          100: '#c5e6d3',
          500: '#4CAA6B',
          600: '#3a8a54',
          700: '#2d6e42',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
};
