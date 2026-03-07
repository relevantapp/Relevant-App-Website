/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          150: '#EDEDED',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1A1A1A',
          900: '#171717',
          925: '#121212',
          950: '#0A0A0A',
          1000: '#000000',
        },
        semantic: {
          success: '#3BB57A',
          successMuted: 'rgba(59, 181, 122, 0.18)',
          warning: '#D4A017',
          warningMuted: 'rgba(212, 160, 23, 0.18)',
          error: '#FF6B6B',
          errorMuted: 'rgba(255, 107, 107, 0.18)',
          info: '#3B82F6',
          infoMuted: 'rgba(59, 130, 246, 0.15)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 4px 8px rgba(0,0,0,0.4)',
        lg: '0 8px 24px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}
