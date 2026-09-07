import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'

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

    const wrapper = mount(App, {
      global: { plugins: [createPinia(), router] },
    })
    await flushPromises()

    // pageStore.currentPage 預設為 0，掛載後應導向 /home。
    expect(router.currentRoute.value.path).toBe('/home')
    expect(wrapper.html()).toContain('點餐')
  })
})
