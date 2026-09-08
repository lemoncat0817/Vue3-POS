import { z } from 'zod'
import { paymentUseMethodSchema } from './order'

/**
 * 付款方式管理（P18：規劃書 §10 P18「菜單與權限管理接上伺服端」）。
 * permissionManagement.vue 原本的付款方式新增／編輯／刪除只改本機
 * Pinia 狀態（見 apps/pos/src/stores/order.ts 的 paymentList），這裡
 * 補上對應的伺服端資源——跟訂單實際送出時 tenders[] 裡的 method 是
 * 自由字串不同，這裡的付款方式清單是「後台設定允許用哪些方式收款」，
 * 兩者故意不是同一份 schema：tenderInputSchema 的 method 不因為伺服端
 * 還沒同步到這份清單就拒絕送單，見 order.ts 的說明。
 */
export const paymentMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  disabled: z.boolean(),
  useMethod: paymentUseMethodSchema,
})
export type PaymentMethodRecord = z.infer<typeof paymentMethodSchema>

export const createPaymentMethodRequestSchema = paymentMethodSchema.omit({ id: true })
export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodRequestSchema>

export const updatePaymentMethodRequestSchema = createPaymentMethodRequestSchema
export type UpdatePaymentMethodRequest = z.infer<typeof updatePaymentMethodRequestSchema>
