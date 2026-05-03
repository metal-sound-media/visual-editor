export function createPreview(store, { previewUrl }) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-preview'

  const spinner = document.createElement('div')
  spinner.className = 've-preview-spinner'
  spinner.innerHTML = '<div class="ve-spinner"></div>'
  wrapper.appendChild(spinner)

  const iframe = document.createElement('iframe')
  iframe.className = 've-preview-iframe ve-loading'
  iframe.title = 'Preview'
  wrapper.appendChild(iframe)

  let debounceTimer = null

  /**
   * POST the current block data to `previewUrl` and write the returned HTML
   * directly into the iframe's document.
   *
   * Using `doc.open() / doc.write() / doc.close()` instead of setting
   * `iframe.src` avoids a full page navigation on every update, which would
   * reset scroll position and trigger the browser's loading indicator.
   * Network errors are silently swallowed — a broken preview should not
   * interrupt editing.
   */
  async function fetchPreview(data) {
    try {
      const r = await fetch(previewUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/html',
        },
        body: JSON.stringify(data),
      })
      if (!r.ok) return
      const html = await r.text()
      const doc = iframe.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    } catch (e) {
      // network error — fail silently
    }
  }

  /**
   * Debounce preview refreshes to 300 ms so that every keystroke in a text
   * field doesn't fire a server request. The timer resets on each store
   * `data` change, meaning only the final value after a burst of edits is
   * actually sent.
   */
  function scheduleUpdate() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const { data } = store.get()
      fetchPreview(data)
    }, 300)
  }

  iframe.addEventListener('load', () => {
    iframe.classList.remove('ve-loading')
    spinner.style.display = 'none'
  })

  // Initial load: fetch immediately without debounce.
  const { data } = store.get()
  fetchPreview(data).then(() => {
    iframe.classList.remove('ve-loading')
    spinner.style.display = 'none'
  })

  store.on('data', scheduleUpdate)
  store.on('device', () => {
    const { device } = store.get()
    applyDeviceSize(iframe, device)
  })

  /**
   * Resize the iframe to simulate the selected device.
   * When height is '100%' (Desktop), `calc(100vh - 50px)` fills the viewport
   * minus the 50 px header so the iframe doesn't overflow the page.
   */
  function applyDeviceSize(iframe, device) {
    if (!device) return
    const w = device.width === '100%' ? '100%' : `${device.width}px`
    const h = device.height === '100%' ? 'calc(100vh - 50px)' : `${device.height}px`
    iframe.style.width = w
    iframe.style.height = h
    iframe.style.maxWidth = '100%'
  }

  const { device } = store.get()
  applyDeviceSize(iframe, device)

  return wrapper
}
