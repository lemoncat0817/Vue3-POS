/**
 * @pos/contract — API 契約單一來源。
 *
 * 以 Zod 定義請求／回應 schema，供 apps/api（Hono 路由的執行期驗證）、
 * apps/pos（用戶端型別，P3 接上 TanStack Query 時使用）共用同一份定義，
 * 避免契約漂移。
 */
export * from './common'
export * from './catalog'
export * from './device'
export * from './promotion'
export * from './order'
export * from './staff'
export * from './reports'
export * from './shift'
