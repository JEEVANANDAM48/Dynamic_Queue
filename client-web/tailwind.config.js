/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569'
        },
        brand: {
          blue: '#1E40AF',
          cyan: '#06B6D4',
          teal: '#0D9488',
          lightBg: '#F8FAFC',
          card: '#FFFFFF'
        },
        queueStatus: {
          waiting: '#F59E0B',   // Amber
          called: '#3B82F6',    // Blue
          serving: '#10B981',   // Emerald Green
          completed: '#64748B', // Slate
          cancelled: '#EF4444'  // Red
        }
      }
    },
  },
  plugins: [],
}
