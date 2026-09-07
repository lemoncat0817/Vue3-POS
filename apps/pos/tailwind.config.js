import colors from 'tailwindcss/colors'

// P8→P11：整體視覺重構（規劃書 §12「視覺系統與體驗」）。
//
// P8 只先建立三個語意色（primary/accent/surface）當漸進式起點；P11 把
// 這套 token 補完成規劃書 §12 描述的完整體系：
// - 語意色跟品牌色分開：danger/success/warning/info 四組獨立色階，
//   不再共用品牌紅——「刪除」「帳差短少」這類危險語意，不該跟「主要
//   動作鍵」用同一個紅（規劃書 §12「危險色只給破壞性操作，不再與
//   品牌紅共用同一個紅」）。
// - 深色模式：darkMode 設為 'class'，由 composables/useTheme.ts 控制
//   根元素的 class，兩套色階都要通過對比度檢查（見 useTheme.ts 的
//   說明）。
// - 字級沿用 Tailwind 預設的比例尺（1.25 全域比例），不再讓每個畫面
//   各自堆疊斷點特例（xl:text-lg lg:text-sm md:text-[10px] 這類）——
//   新畫面改用 clamp() 或單一固定字級，讓同一種資訊在不同解析度下
//   維持同一個相對關係，而不是逐一斷點手調。
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
        // 語意色——跟 primary（品牌紅）刻意分開，見上方說明。
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
        // 浮層專用（對話框、下拉選單），跟一般卡片的 shadow-sm/md 區分
        // 開來——規劃書 §12「圓角與陰影」：邊框與陰影按角色分配，浮層
        // 才用陰影表達層級，不是每個區塊都套一套。
        overlay: '0 20px 40px -8px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
}
