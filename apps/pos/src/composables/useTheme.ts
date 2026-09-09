import { ref, watchEffect } from 'vue'

/** 深色模式切換與持久化（基於 HTML class 與 localStorage，預設讀取系統偏好）。 */
const STORAGE_KEY = 'pos-theme'
type Theme = 'light' | 'dark'

function loadInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // 隱私模式等環境無法存取 localStorage 時安靜回退。
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(loadInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // 存儲失敗時不影響當前顯示。
  }
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggleTheme }
}
