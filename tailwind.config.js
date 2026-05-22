/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Figtree', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base:    'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised:  'var(--bg-raised)',
        overlay: 'var(--bg-overlay)',
        accent:  {
          green: 'var(--accent-green)',
          blue:  'var(--accent-blue)',
          red:   'var(--accent-red)',
          amber: 'var(--accent-amber)',
        },
      },
      animation: {
        'fade-up':  'fadeUp 0.4s ease forwards',
        'fade-in':  'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'spin-slow':'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity:'0', transform:'translateY(12px)' },
          '100%':{ opacity:'1', transform:'translateY(0)' },
        },
        fadeIn: {
          '0%':  { opacity:'0' },
          '100%':{ opacity:'1' },
        },
        slideUp: {
          '0%':  { transform:'translateY(100%)' },
          '100%':{ transform:'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
