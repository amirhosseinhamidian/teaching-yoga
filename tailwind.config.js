/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        primary: '#FECD1A',
        secondary: '#FFAF29',
        accent: '#64F4AB',
        red: '#F82525',
        blue: '#25A4F8',
        green: '#327A56',
        background: {
          light: '#F6F6F6',
          dark: '#2D2E32',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#25262A',
        },
        text: {
          light: '#25262A',
          dark: '#FFFFFF',
        },
        subtext: {
          light: '#5D5E65',
          dark: '#BFBFBF',
        },
        priceText: '#9A9A9A',
      },
      fontFamily: {
        main: ['MainFont', 'sans-serif'],
        faNa: ['PersianNumbers', 'sans-serif'],
        fancy: ['FancyFont', 'cursive'],
      },
      // eslint-disable-next-line no-unused-vars
      fill: (theme) => ({
        primary: '#FFAF29',
        secondary: {
          light: '#F6F6F6',
          dark: '#2D2E32',
        },
      }),
      screens: {
        xs: '410px',
      },
      fontSize: {
        '2xs': ['10px', '16px'],
      },
    },
    container: {
      padding: '2rem',
      center: true,
    },
  },
  variants: {
    fill: ['hover', 'focus'],
  },
  plugins: [],
};
