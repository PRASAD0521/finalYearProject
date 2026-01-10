/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // Slate 900
        secondary: '#64748b', // Slate 500
        accent: '#3b82f6', // Blue 500
        danger: '#ef4444', // Red 500
        success: '#10b981', // Emerald 500
      }
    },
  },
  plugins: [],
}
