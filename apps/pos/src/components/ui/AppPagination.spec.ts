import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from './AppPagination.vue'

describe('AppPagination.vue', () => {
  it('顯示目前頁碼與總頁數', () => {
    const wrapper = mount(AppPagination, {
      props: { page: 2, pageCount: 5, total: 50 }
    })
    expect(wrapper.text()).toContain('2/5 頁')
  })

  it('total 為 0 時顯示 0/0 頁', () => {
    const wrapper = mount(AppPagination, {
      props: { page: 1, pageCount: 0, total: 0 }
    })
    expect(wrapper.text()).toContain('0/0 頁')
  })

  it('在第一頁時上一頁按鈕被禁用', () => {
    const wrapper = mount(AppPagination, {
      props: { page: 1, pageCount: 3, total: 30 }
    })
    const prevBtn = wrapper.find('button[aria-label="上一頁"]')
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  it('點擊下一頁按鈕發出 update:page 事件', async () => {
    const wrapper = mount(AppPagination, {
      props: { page: 2, pageCount: 5, total: 50 }
    })
    const nextBtn = wrapper.find('button[aria-label="下一頁"]')
    await nextBtn.trigger('click')

    expect(wrapper.emitted('update:page')?.[0]).toEqual([3])
  })

  it('在最後一頁時下一頁按鈕被禁用', () => {
    const wrapper = mount(AppPagination, {
      props: { page: 5, pageCount: 5, total: 50 }
    })
    const nextBtn = wrapper.find('button[aria-label="下一頁"]')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })
})
