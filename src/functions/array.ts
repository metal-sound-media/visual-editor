function arrayMove<T extends Array<unknown>>(items: T, from: number, to: number): T {
  const arr = [...items] as T
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
  return arr
}

export function moveItem<T extends Array<unknown>>(
  items: T,
  from: number,
  to: number
): T {
  return arrayMove(items, from, to)
}

export function insertItem<T extends Array<any>>(
  items: T,
  index: number,
  value: any
) {
  const clone = [...items]
  clone.splice(index, 0, value)
  return clone
}
