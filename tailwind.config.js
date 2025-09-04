
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./apps/terminal-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chimera-dark': '#0e1117',
        'chimera-lightdark': '#1c1f26',
        'chimera-grey': '#21262d',
        'chimera-lightgrey': '#8b949e',
        'chimera-blue': '#3bc9f4',
        'chimera-green': '#2ecc71',
        'chimera-red': '#e74c3c',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
