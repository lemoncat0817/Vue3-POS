export function formatAddList(addList: string | string[] | undefined | null): string {
  if (!addList) return ''
  if (Array.isArray(addList)) return addList.join('、')
  return addList
}
