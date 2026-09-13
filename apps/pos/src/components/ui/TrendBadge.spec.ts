import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendBadge from './TrendBadge.vue'

describe('TrendBadge.vue', () => {
  it('trend 為 null 時不渲染任何內容', () => {
    const wrapper = mount(TrendBadge, {
      props: { trend: null }
    })
    expect(wrapper.find('span').exists()).toBe(false)
  })

  it('trend.up 為 true 時呈現正向綠色樣式與百分比', () => {
    const wrapper = mount(TrendBadge, {
      props: { trend: { pct: 15.2, up: true } }
    })
    const span = wrapper.find('span')
    expect(span.exists()).toBe(true)
    expect(span.text()).toContain('15.2%')
    expect(span.classes()).toContain('text-success-600')
  })

  it('trend.up 為 false 時呈現負向紅色樣式並顯示絕對值百分比', () => {
    const wrapper = mount(TrendBadge, {
      props: { trend: { pct: -8.5, up: false } }
    })
    const span = wrapper.find('span')
    expect(span.exists()).toBe(true)
    expect(span.text()).toContain('8.5%')
    expect(span.classes()).toContain('text-danger-600')
  })
})
