import colors from 'tailwindcss/colors'

// P8：整體視覺重構的起點（規劃書原本的「組件庫替換」章節）。這個專案
// 原本完全沒有設計 token——每個畫面各自寫死 bg-red-500／border-2
// border-black／bg-yellow-400 這類具體的 Tailwind 色階，同一個「這是
// 主要品牌色」的意圖散落在幾十個檔案裡，沒有共用的語意名稱。這裡開始
// 建立語意化的色彩 token：
// - primary：品牌紅（沿用現有識別，MAJI Tea 的主色，也是 vite.config.ts
//   PWA manifest 的 theme_color #ef4444 所在的色階）
// - accent：品牌黃（沿用既有慣例——目前導覽列「當前分頁」、圖表分頁籤
//   選取狀態都用 yellow-400/500 當「已選取」的語意色，這裡把它明確
//   收斂成 accent，而不是繼續讓每個檔案各自硬寫 yellow-400）
// - surface：中性色階，取代原本到處都是的純黑邊框（border-black）跟
//   突兀的陰影，改用有層次的灰階邊框／背景
//
// 這是漸進式的重構起點：先在新頁面（P8 的替換示範）套用這套 token，
// 舊頁面暫時維持原樣，不強迫一次全面套用（見 P8 commit 的說明）。
/** @type {import('tailwindcss').Config} */
export default {
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
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      height: {
        'calc': 'calc(100vh - 80px)'
      }
    },
  },
  plugins: [],
}
