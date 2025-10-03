/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0f12',
        surface: '#11161b',
        card: '#141a20',
        'text-primary': '#e7eef5',
        'text-muted': '#a7b3c1',
        accent: '#28c1ff',
        'accent-soft': 'rgba(40, 193, 255, 0.15)',
        'products-accent': '#F6C845',
        'accent-hover': '#E6B82D',
      },
      borderRadius: {
        'lg-custom': '16px',
      },
      maxWidth: {
        'content': '1200px',
      },
    },
  },
  plugins: [],
}