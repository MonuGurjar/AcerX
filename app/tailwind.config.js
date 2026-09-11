/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gnome: {
          bg: '#18181b',          // Base window background (Libadwaita dark)
          sidebar: '#1e1e22',     // Navigation split view sidebar
          card: '#242428',        // Adwaita card background
          cardHover: '#2a2a30',   // Hover state
          border: '#323238',      // Border color
          accent: '#2dd4bf',      // Refined cyan accent
          accentHover: '#14b8a6',
          accentMuted: 'rgba(45, 212, 191, 0.12)',
          text: '#f4f4f5',
          subtext: '#a1a1aa',
          dimmed: '#71717a',
          headerbar: '#202024'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Cantarell', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        adwaita: '0 1px 2px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        window: '0 25px 65px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      }
    }
  },
  plugins: [],
}
