import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TablePagination from './TablePagination.vue'

describe('TablePagination.vue', () => {
  it('正確渲染資料筆數與頁碼', () => {
    const wrapper = mount(TablePagination, {
      props: {
        page: 1,
        pageCount: 3,
        total: 25,
        currentCount: 10,
        unit: '筆訂單'
      }
    })

    expect(wrapper.text()).toContain('總共有 25 筆訂單')
    expect(wrapper.text()).toContain('當前頁面有 10 筆訂單')
    expect(wrapper.text()).toContain('1 / 3')
  })

  it('上一頁與下一頁觸發 update:page 事件', async () => {
    const wrapper = mount(TablePagination, {
      props: {
        page: 2,
        pageCount: 3,
        total: 25,
        currentCount: 10
      }
    })

    const buttons = wrapper.findAll('button')
    const prevBtn = buttons[0]!
    const nextBtn = buttons[1]!

    await prevBtn.trigger('click')
    expect(wrapper.emitted('update:page')?.[0]).toEqual([1])

    await nextBtn.trigger('click')
    expect(wrapper.emitted('update:page')?.[1]).toEqual([3])
  })
})
