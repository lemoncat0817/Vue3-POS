import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

// 模擬離線環境以驗證後端連線失敗時根元件仍可正常掛載。
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('測試環境沒有後端，模擬離線'))),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

// 驗證 App 根元件掛載與離線容錯。
describe('App', () => {
  it('掛載後能正常渲染目前的路由，連不到伺服端也不影響掛載', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>root</div>' } },
        { path: '/home', component: { template: '<div>點餐</div>' } },
        { path: '/order', component: { template: '<div>查看訂單</div>' } },
      ],
    })
    router.push('/home')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router, [VueQueryPlugin, { queryClient }]] },
    })
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/home')
    expect(wrapper.html()).toContain('點餐')

    // 卸載元件以停止背景計時器。
    wrapper.unmount()
  })
})
