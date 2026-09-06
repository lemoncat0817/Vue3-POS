import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'

/**
 * 這是 P0 階段唯一的元件測試，目的是證明 jsdom + @vue/test-utils +
 * vue-router 這套工具鏈本身可用（見重構規劃書 §11、§13）。功能切片各自
 * 的元件測試留給後續階段依實際重構內容補上，這裡不預先寫尚不存在的
 * 測試案例。
 */
describe('App', () => {
  it('掛載後渲染目前路由對應的畫面', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>已掛載</div>' } }],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] },
    })

    expect(wrapper.html()).toContain('已掛載')
  })
})
