import { z } from 'zod'

/** ULID：26 碼 Crockford Base32。用於冪等鍵，可依字典序排序。 */
export const ulidSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, '必須是合法的 ULID')

/** 營業日格式 YYYYMMDD（對應 @pos/domain 的 getBusinessDate()）。 */
export const businessDateSchema = z
  .string()
  .regex(/^\d{8}$/, '必須是 YYYYMMDD 格式')
