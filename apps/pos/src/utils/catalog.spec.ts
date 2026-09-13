import { describe, expect, it } from 'vitest'
import { formatAddList } from './catalog'

describe('catalog utils', () => {
  it('formatAddList 將加購陣列以頓號串接', () => {
    expect(formatAddList(['珍珠', '椰果', '布丁'])).toBe('珍珠、椰果、布丁')
  })

  it('formatAddList 字串維持原狀', () => {
    expect(formatAddList('無添加配料')).toBe('無添加配料')
  })
})
