import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NumericKeypad from './NumericKeypad.vue'

describe('NumericKeypad.vue', () => {
  it('點選數字鍵發出 update:modelValue 事件', async () => {
    const wrapper = mount(NumericKeypad, {
      props: { modelValue: 10 }
    })

    const buttons = wrapper.findAll('button')
    // 點擊數字 5
    const btn5 = buttons.find((b) => b.text() === '5')!
    await btn5.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([105])
  })

  it('點選清除鍵將 modelValue 重置為 0', async () => {
    const wrapper = mount(NumericKeypad, {
      props: { modelValue: 999 }
    })

    const clearBtn = wrapper.findAll('button').find((b) => b.text() === '清除')!
    await clearBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0])
  })

  it('點選退格鍵移除最後一碼數字', async () => {
    const wrapper = mount(NumericKeypad, {
      props: { modelValue: 123 }
    })

    const backspaceBtn = wrapper.findAll('button').find((b) => b.text() === '⌫')!
    await backspaceBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([12])
  })

  it('超過 max 限制時不發出 update 事件', async () => {
    const wrapper = mount(NumericKeypad, {
      props: { modelValue: 50, max: 100 }
    })

    // 50 加上 5 = 505 > 100
    const btn5 = wrapper.findAll('button').find((b) => b.text() === '5')!
    await btn5.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disabled 為 true 時所有按鈕皆設為 disabled', () => {
    const wrapper = mount(NumericKeypad, {
      props: { modelValue: 0, disabled: true }
    })

    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      expect(btn.attributes('disabled')).toBeDefined()
    }
  })
})
