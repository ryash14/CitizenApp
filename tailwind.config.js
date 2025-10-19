/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'aqi-good': '#00E400',
        'aqi-moderate': '#FFFF00',
        'aqi-unhealthy-sensitive': '#FF7E00',
        'aqi-unhealthy': '#FF0000',
        'aqi-very-unhealthy': '#8F3F97',
        'aqi-hazardous': '#7E0023',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #3B82F6, #06B6D4)',
        'gradient-secondary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-danger': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
      }
    },
  },
  plugins: [],
}