export function strToDom(str) {
  return document
    .createRange()
    .createContextualFragment(`<div>${str.trim()}</div>`)
    .firstChild
}

export function offsetTop(element, acc = 0) {
  if (element.offsetParent) {
    return offsetTop(element.offsetParent, acc + element.offsetTop)
  }
  return acc + element.offsetTop
}
