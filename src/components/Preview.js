const PREVIEW_OVERLAY_CSS = `
.ve-block-wrapper { position: relative; }
.ve-block-wrapper:hover { outline: 2px solid #1771e6; outline-offset: -2px; cursor: pointer; }
.ve-preview-label {
  display: none; position: absolute; top: 0; left: 0;
  background: #1771e6; color: #fff; font-size: 11px; font-family: sans-serif;
  padding: 2px 7px; border-radius: 0 0 4px 0; z-index: 9999; pointer-events: none;
  white-space: nowrap;
}
.ve-block-wrapper:hover .ve-preview-label { display: block; }
.ve-preview-add {
  display: flex; align-items: center; justify-content: center;
  height: 32px; cursor: pointer; opacity: 0; transition: opacity 0.15s;
  font-size: 22px; font-family: sans-serif; color: #1771e6; user-select: none;
}
.ve-preview-add:hover { opacity: 1 !important; background: rgba(23,113,230,0.07); }
.ve-preview-add-bottom { opacity: 0.4; height: 40px; margin-top: 8px; }
`

function injectOverlays(iframe, store) {
  const doc = iframe.contentDocument
  if (!doc) return

  // Inject overlay CSS once
  if (!doc.getElementById('ve-overlay-styles')) {
    const style = doc.createElement('style')
    style.id = 've-overlay-styles'
    style.textContent = PREVIEW_OVERLAY_CSS
    doc.head?.appendChild(style)
  }

  const wrappers = Array.from(doc.querySelectorAll('.ve-block-wrapper'))
  const { definitions } = store.get()

  wrappers.forEach((el, i) => {
    const name = el.dataset.name
    const id = el.dataset.id
    const title = definitions?.[name]?.title ?? name

    // Label
    if (!el.querySelector('.ve-preview-label')) {
      const label = doc.createElement('div')
      label.className = 've-preview-label'
      label.textContent = title
      el.appendChild(label)
    }

    // Click → focus block in sidebar
    el.addEventListener('click', (e) => {
      if (e.target.closest('.ve-preview-add')) return
      store.setFocusIndex(id)
    })

    // "+" button before this block
    if (!el.previousElementSibling?.classList.contains('ve-preview-add')) {
      const addBtn = doc.createElement('div')
      addBtn.className = 've-preview-add'
      addBtn.innerHTML = '+'
      addBtn.title = '+'
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        store.setAddBlockIndex(i)
      })
      el.parentNode.insertBefore(addBtn, el)
    }
  })

  // "+" button at the bottom
  const existing = doc.querySelector('.ve-preview-add-bottom')
  if (existing) existing.remove()
  const addBottom = doc.createElement('div')
  addBottom.className = 've-preview-add ve-preview-add-bottom'
  addBottom.innerHTML = '+'
  addBottom.title = '+'
  addBottom.addEventListener('click', (e) => {
    e.stopPropagation()
    store.setAddBlockIndex(wrappers.length)
  })
  doc.body?.appendChild(addBottom)
}

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
        injectOverlays(iframe, store)
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
