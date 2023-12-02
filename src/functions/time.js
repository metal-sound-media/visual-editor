export function debounce(func, wait) {
  let timeout = null

  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(later, wait)
  }
}
