function arrayMove(items, from, to) {
  const arr = [...items]
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
  return arr
}

export function moveItem(items, from, to) {
  return arrayMove(items, from, to)
}

export function insertItem(items, index, value) {
  const clone = [...items]
  clone.splice(index, 0, value)
  return clone
}
