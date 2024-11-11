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
        foreground: {
          light: '#E7E7E7',
          dark: '#35363A',
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
        '2xs': ['10px', '20px'],
        xs: ['12px', '22px'],
        sm: ['14px', '26px'],
        base: ['16px', '30px'],
        lg: ['18px', '34px'],
        xl: ['20px', '38px'],
        '2xl': ['24px', '42px'],
        '3xl': ['30px', '50px'],
        '4xl': ['36px', '60px'],
        '5xl': ['48px', '72px'],
        '6xl': ['60px', '84px'],
        '7xl': ['72px', '86px'],
        '8xl': ['96px', '96px'],
        '9xl': ['128px', '128px'],
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
