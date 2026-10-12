import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1B3A6B',
          dark: '#122748',
          light: '#284E88',
        },
        moran: {
          blue: '#2E6DB4',
          navy: '#1B3A6B',
          lightBlue: '#EAF1FB',
          border: '#D0D8E8',
          bg: '#F2F5F9',
        },
      },
    },
  },
  plugins: [],
};

export default config;
