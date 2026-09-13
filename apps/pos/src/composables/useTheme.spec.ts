import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useTheme } from './useTheme'

describe('useTheme composable', () => {
  it('toggleTheme() 能在 light 與 dark 之間切換並連動 HTML class', async () => {
    const { theme, toggleTheme } = useTheme()
    const initial = theme.value

    toggleTheme()
    await nextTick()
    expect(theme.value).toBe(initial === 'dark' ? 'light' : 'dark')
    expect(document.documentElement.classList.contains('dark')).toBe(theme.value === 'dark')

    toggleTheme()
    await nextTick()
    expect(theme.value).toBe(initial)
  })
})
