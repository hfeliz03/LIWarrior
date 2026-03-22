/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'li-blue': '#0A66C2',
        'li-dark': '#004182',
        'li-light': '#70B5F9',
        'warrior-gold': '#F5A623',
        'warrior-dark': '#1A1A2E',
        'warrior-navy': '#2C3E50',
      },
    },
  },
  plugins: [],
};
