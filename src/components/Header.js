const DEVICE_ICONS = {
  mobile: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>`,
  tablet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>`,
  desktop: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`,
}

export function createHeader(store) {
  const el = document.createElement('div')
  el.className = 've-header'

  function render() {
    const { devices, device: currentDevice } = store.get()
    el.innerHTML = ''
    for (const device of devices) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 've-header-btn'
      btn.title = device.name
      btn.setAttribute('aria-selected', String(device === currentDevice))
      btn.innerHTML = DEVICE_ICONS[device.icon] ?? device.name
      btn.addEventListener('click', () => store.setDevice(device))
      el.appendChild(btn)
    }
  }

  render()
  store.on('device', () => render())
  store.on('devices', () => render())

  return el
}
