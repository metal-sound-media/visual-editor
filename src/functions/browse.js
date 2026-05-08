let _callback = null

export function setBrowseCallback(fn) {
  _callback = fn
}

export function getBrowseCallback() {
  return _callback
}
