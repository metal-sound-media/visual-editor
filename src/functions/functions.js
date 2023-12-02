export function prevent(callback) {
  if (!callback) {
    return
  }
  return (e) => {
    e.preventDefault()
    callback(e)
  }
}

export function preventPropagation(callback) {
  if (!callback) {
    return
  }
  return (e) => {
    e.preventDefault()
    e.stopPropagation()
    callback(e)
  }
}
