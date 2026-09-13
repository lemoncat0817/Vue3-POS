import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from './FormField.vue'

describe('FormField.vue', () => {
  it('渲染標籤與基本輸入框屬性', () => {
    const wrapper = mount(FormField, {
      props: {
        name: 'username',
        label: '員工帳號',
        placeholder: '請輸入帳號',
        type: 'text'
      }
    })

    expect(wrapper.find('label').text()).toContain('員工帳號')
    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('請輸入帳號')
    expect(input.attributes('type')).toBe('text')
  })

  it('支援 disabled 屬性', () => {
    const wrapper = mount(FormField, {
      props: {
        name: 'disabledField',
        label: '不可修改',
        disabled: true
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
