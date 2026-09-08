import { ref, watchEffect } from 'vue'

/**
 * 深色模式（規劃書 §12「深色模式」：店內光線差異大，這對實際使用有
 * 意義，不只是展示項目）。
 *
 * Tailwind 的 darkMode: 'class' 只認根元素上有沒有 `dark` 這個 class，
 * 不看 prefers-color-scheme——這裡自己讀一次系統偏好當初始值，之後
 * 完全交給使用者手動切換並記住選擇（存 localStorage），不用另外監聽
 * 系統設定變化：使用者一旦手動選過，代表這是他的明確意圖，不該被
 * OS 設定變化蓋掉。
 */
const STORAGE_KEY = 'pos-theme'
type Theme = 'light' | 'dark'

function loadInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage 在部分環境（隱私模式、封鎖第三方儲存）可能直接擲出，
    // 這種情況安靜地退回系統偏好，不影響畫面能不能用。
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(loadInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // 存不了就算了（見上方說明），純粹是下次造訪記不住選擇，不影響這次的顯示。
  }
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggleTheme }
}
