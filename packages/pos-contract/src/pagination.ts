import { z } from 'zod'

// 全站通用的分頁 query／response 形狀，供無上限增長的列表（訂單、會員、
// 稽核紀錄等）共用。page/pageSize 經常直接來自 URL query string（都是
// 字串），用 z.coerce 轉成數字；pageSize 設上限避免被當成繞過分頁的爬取手段。
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  totalCount: z.number().int(),
  totalPages: z.number().int()
})
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

/** 組出某個 item schema 對應的分頁回應 schema：`{ items, pagination }`。 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: paginationMetaSchema
  })
}
