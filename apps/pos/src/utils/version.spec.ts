import { describe, it, expect, vi } from 'vitest'
import { APP_BUILD_INFO, logVersionBadge } from './version'

describe('version utility', () => {
  it('APP_BUILD_INFO 提供有效的版本欄位', () => {
    expect(APP_BUILD_INFO.commitHash).toBeDefined()
    expect(APP_BUILD_INFO.buildTime).toBeDefined()
    expect(APP_BUILD_INFO.env).toBeDefined()
    expect(APP_BUILD_INFO.displayText).toContain(APP_BUILD_INFO.commitHash)
    expect(APP_BUILD_INFO.shortText).toContain(APP_BUILD_INFO.commitHash)
  })

  it('logVersionBadge 會呼叫 console.log 輸出格式化資訊', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logVersionBadge()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('%c POS %c'),
      expect.any(String),
      expect.any(String)
    )
    consoleSpy.mockRestore()
  })
})
