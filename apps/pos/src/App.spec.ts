import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

// App.vue 掛載時也會啟動離線送單佇列的背景同步（見 src/offline/），
// 需要 IndexedDB——jsdom 沒有原生實作，用 fake-indexeddb 補上。

// App.vue 掛載時會嘗試呼叫 GET /api/catalog（見 P3 的菜單同步邏輯）。
// 單元測試環境沒有真的後端可打，這裡固定讓 fetch 失敗，驗證的重點正是
// 「連不到伺服端時，畫面仍然照常掛載，不會因為這個背景請求失敗而壞掉」。
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('測試環境沒有後端，模擬離線'))),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * 這是 P0 階段唯一的元件測試，目的是證明 jsdom + @vue/test-utils +
 * vue-router 這套工具鏈本身可用（見重構規劃書 §11、§13）。功能切片各自
 * 的元件測試留給後續階段依實際重構內容補上，這裡不預先寫尚不存在的
 * 測試案例。
 *
 * P1 修復 D-07 後，App.vue 會在掛載時依 pageStore.currentPage 導向
 * /home 或 /order（見該元件），因此這裡的假路由需要真的定義這兩條路徑，
 * 並提供一個 Pinia 實例。
 */
describe('App', () => {
  it('掛載後依上次瀏覽的頁籤導向對應路由（D-07：還原邏輯掛在根元件上）', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>root</div>' } },
        { path: '/home', component: { template: '<div>點餐</div>' } },
        { path: '/order', component: { template: '<div>查看訂單</div>' } },
      ],
    })
    router.push('/')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router, [VueQueryPlugin, { queryClient }]] },
    })
    await flushPromises()

    // pageStore.currentPage 預設為 0，掛載後應導向 /home。
    expect(router.currentRoute.value.path).toBe('/home')
    expect(wrapper.html()).toContain('點餐')

    // 卸載時要停掉背景同步（見 App.vue 的 onUnmounted），不然 setInterval
    // 會在這個測試結束後繼續跑。
    wrapper.unmount()
  })
})
