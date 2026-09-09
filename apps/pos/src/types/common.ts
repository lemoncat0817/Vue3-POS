// 表單輸入與資料模型的 id／金額型別，因歷史表單未加 .number 可能為 string 或 number。
export type FormNumeric = number | string

// 描述後台以空物件代表未選取的既有慣例。
export type MaybeSelected<T> = Partial<T>
