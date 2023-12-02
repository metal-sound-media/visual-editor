export function prevent(callback?: Function) {
  if (!callback) {
    return
  }
  return (e: Event) => {
    e.preventDefault()
    callback(e)
  }
}

export function preventPropagation(callback?: Function) {
  if (!callback) {
    return
  }
  return (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    callback(e)
  }
}
