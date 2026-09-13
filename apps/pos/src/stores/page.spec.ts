import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePageStore } from './page'

describe('usePageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始 lastVisitedName 為 null，可手動或被導航守衛更新', () => {
    const store = usePageStore()
    expect(store.lastVisitedName).toBeNull()

    store.lastVisitedName = 'Home'
    expect(store.lastVisitedName).toBe('Home')
  })
})
