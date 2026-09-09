import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.red,
        accent: colors.amber,
        surface: colors.stone,
        success: colors.emerald,
        danger: colors.rose,
        warning: colors.amber,
        info: colors.sky,
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      height: {
        'calc': 'calc(100vh - 80px)'
      },
      boxShadow: {
        // 浮層專用陰影（對話框、下拉選單），與一般卡片階層區隔。
        overlay: '0 20px 40px -8px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
}
