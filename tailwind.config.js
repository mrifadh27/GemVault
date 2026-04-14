/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      colors: {
        obsidian: {
          DEFAULT: 'rgb(10 10 15)',
          mid: 'rgb(18 18 26)',
          light: 'rgb(26 26 42)',
          border: 'rgb(42 42 58)',
        },
        gold: {
          DEFAULT: 'rgb(201 169 110)',
          light: 'rgb(220 193 148)',
          muted: 'rgb(140 115 75)',
        },
        ivory: {
          DEFAULT: 'rgb(232 224 213)',
          muted: 'rgb(160 160 176)',
          subtle: 'rgb(100 100 120)',
        },
      },
      boxShadow: {
        gold: '0 0 30px rgba(201, 169, 110, 0.15)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        glow: '0 0 60px rgba(201, 169, 110, 0.08)',
      },
      backgroundImage: {
        'hero-mesh': `
          radial-gradient(ellipse at 20% 50%, rgba(201, 169, 110, 0.06) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(83, 60, 154, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 60% 80%, rgba(49, 130, 206, 0.06) 0%, transparent 60%),
          rgb(10, 10, 15)
        `,
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'gradient': 'gradientShift 4s ease infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
};
