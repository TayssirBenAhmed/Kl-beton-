/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kl: {
          white:   '#FFFFFF',
          card:    '#F8FAFC',
          border:  '#E2E8F0',
          text:    '#000000',
          muted:   '#374151',
          faint:   '#6B7280',
          accent:  '#2F81F7',
          navy:    '#0F172A',
          success: '#16A34A',
          danger:  '#DC2626',
          warn:    '#D97706',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        grotesk: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'kpi':      ['72px',  { lineHeight: '1',   fontWeight: '900' }],
        'employee': ['28px',  { lineHeight: '1.2', fontWeight: '700' }],
        'senior':   ['20px',  { lineHeight: '1.4', fontWeight: '600' }],
        'label':    ['15px',  { lineHeight: '1.4', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}
