import { z } from 'zod'

export const ulidSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, '必須是合法的 ULID')

export const businessDateSchema = z.string().regex(/^\d{8}$/, '必須是 YYYYMMDD 格式')
