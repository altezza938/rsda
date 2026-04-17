/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#2D6A4F',
        secondary: '#52B788',
        pale:      '#D8F3DC',
        charcoal:  '#1B1B1B',
        pass:      '#27AE60',
        fail:      '#E74C3C',
        sls:       '#1A6EA0',
        uls:       '#E9A820',
      },
    },
  },
  plugins: [],
}

