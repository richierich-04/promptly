/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    theme: {
      extend: {
        // Add any custom colors from landing page
      backgroundImage: {
        'dot-white': 'radial-gradient(white 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot': '20px 20px',
      },
    },
    plugins: [],
  }
}