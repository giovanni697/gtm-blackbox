import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', './content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        scient: {
          primary: '#0030E8',
          'primary-soft': 'rgba(0, 48, 232, 0.08)',
          'primary-hover': '#0026B8',
          dark: '#111111',
          'dark-2': '#282828',
          gray: '#585858',
          divider: '#E6E6E6',
          bg: '#F5F5F7',
          accent: '#40E0A8',
          armv: '#F97316',
          arpe: '#0030E8',
          are: '#40E0A8',
        },
        nivel: {
          0: '#94A3B8',
          1: '#F97316',
          2: '#0030E8',
          3: '#40E0A8',
        },
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        lexend: ['var(--font-lexend)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '10px',
        '3xs': '9px',
        '4xs': '8px',
      },
      borderRadius: {
        sm: '2px',
      },
      letterSpacing: {
        widest: '0.14em',
      },
    },
  },
  plugins: [typography],
}

export default config
