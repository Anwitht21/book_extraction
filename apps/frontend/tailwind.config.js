/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // Indigo 600
        secondary: '#0ea5e9', // Sky 500
        accent: '#f97316', // Orange 500
        success: '#10b981', // Emerald 500
        warning: '#f59e0b', // Amber 500
        danger: '#ef4444', // Red 500
        background: '#f9fafb', // Gray 50
        surface: '#ffffff',
        'surface-hover': '#f3f4f6', // Gray 100
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} 