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
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#9AA0A6',
          500: '#6B6F73',
          600: '#5F6368',
          700: '#3C4043',
          800: '#303134',
          900: '#292A2D',
          950: '#202124',
        },
        accent: {
          blue: '#2F6BFF',
          teal: '#2F6BFF',
          lime: '#2F6BFF',
          violet: '#2F6BFF',
          amber: '#2F6BFF',
          coral: '#2F6BFF',
        },
        semantic: {
          success: '#2F6BFF',
          successMuted: 'rgba(47, 107, 255, 0.14)',
          warning: '#6B6F73',
          warningMuted: 'rgba(107, 111, 115, 0.16)',
          error: '#202124',
          errorMuted: 'rgba(32, 33, 36, 0.12)',
          info: '#2F6BFF',
          infoMuted: 'rgba(47, 107, 255, 0.15)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
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
