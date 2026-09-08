/**
 * @pos/domain — 零執行期依賴的純 TypeScript 領域層。
 *
 * P1（領域抽離）階段將在此填入 `priceOrder()`、金額型別 `Minor`、折扣
 * 管線等計價邏輯（見重構規劃書 §7）。P0 階段僅先建立套件邊界，並放入
 * 供迴歸比對用的黃金資料集。
 */
export { GOLDEN_ORDERS } from './fixtures/golden-orders'
export { DEFAULT_OFTEN_USE_RATES } from './fixtures/often-use-rates'
export * from './money'
export * from './pricing'
export * from './business-date'
export * from './ulid'
export * from './shift'
export * from './refund'
