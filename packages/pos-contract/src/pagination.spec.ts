import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createPaginatedResponseSchema,
  paginationMetaSchema,
  paginationQuerySchema
} from './pagination'

describe('pagination contracts', () => {
  it('paginationQuerySchema 自動轉型字串數字並套用預設值', () => {
    const defaultParsed = paginationQuerySchema.parse({})
    expect(defaultParsed.page).toBe(1)
    expect(defaultParsed.pageSize).toBe(20)

    const coerced = paginationQuerySchema.parse({ page: '3', pageSize: '50' })
    expect(coerced.page).toBe(3)
    expect(coerced.pageSize).toBe(50)
  })

  it('paginationQuerySchema 限制 page >= 1 與 pageSize 邊界 1~100', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    expect(paginationQuerySchema.safeParse({ pageSize: 0 }).success).toBe(false)
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false)
    expect(paginationQuerySchema.safeParse({ pageSize: 100 }).success).toBe(true)
  })

  it('paginationMetaSchema 驗證分頁中繼資訊', () => {
    const meta = {
      page: 1,
      pageSize: 20,
      totalCount: 100,
      totalPages: 5
    }
    expect(paginationMetaSchema.safeParse(meta).success).toBe(true)
  })

  it('createPaginatedResponseSchema 組出符合結構的分頁回應', () => {
    const itemSchema = z.object({ id: z.number(), title: z.string() })
    const responseSchema = createPaginatedResponseSchema(itemSchema)

    const validData = {
      items: [{ id: 1, title: '測試項目' }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1
      }
    }
    expect(responseSchema.safeParse(validData).success).toBe(true)

    expect(
      responseSchema.safeParse({
        items: [{ id: 'not-a-number', title: '錯誤' }],
        pagination: validData.pagination
      }).success
    ).toBe(false)
  })
})
