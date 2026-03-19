/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        card: '#f7f9fc',
        primary: '#2d6be4',
        heading: '#1c1d1f',
        body: '#3e4143',
        muted: '#6a6f73',
        border: '#e0e0e0',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        panel: '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
