/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        obsidian: {
          DEFAULT: '#080808',
          surface: '#0F0F0F',
          card: '#141414',
          light: '#1A1A1A',
          border: '#222222',
        },
        gold: {
          DEFAULT: '#C4A25D',
          light: '#D4B570',
          dim: '#8B6914',
          subtle: '#3D2E10',
        },
        ivory: {
          DEFAULT: '#F0EDE8',
          muted: '#A8A49E',
          subtle: '#666260',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'heart': 'heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(196,162,93,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(196,162,93,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        heartPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
