import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingStore } from './setting'

describe('useSettingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始 currentSettingPage 為 0，可進行切換', () => {
    const store = useSettingStore()
    expect(store.currentSettingPage).toBe(0)

    store.currentSettingPage = 2
    expect(store.currentSettingPage).toBe(2)
  })
})
