import { defaultFieldProperties } from './index.js'
import { mountFields } from './index.js'

export function Tabs(...tabs) {
  const allFields = tabs.flatMap((t) => t.fields)

  return {
    group: true,
    fields: allFields,
    options: { tabs },
    mountGroup(container, data, onUpdate, opts) {
      const root = document.createElement('div')
      root.className = 've-tabs'

      const nav = document.createElement('div')
      nav.className = 've-tabs-nav'
      root.appendChild(nav)

      const panelData = []
      const navBtns = []
      let currentData = data

      for (let i = 0; i < opts.tabs.length; i++) {
        const tab = opts.tabs[i]

        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 've-tabs-btn' + (i === 0 ? ' ve-active' : '')
        btn.textContent = tab.label
        btn.dataset.index = i
        nav.appendChild(btn)
        navBtns.push(btn)

        const panel = document.createElement('div')
        panel.className = 've-tabs-panel' + (i === 0 ? ' ve-active' : '')
        root.appendChild(panel)

        let instance = null
        let mounted = false

        // Mount first tab immediately; other tabs are lazily mounted on first click
        if (i === 0) {
          instance = mountFields(panel, tab.fields, currentData, onUpdate)
          mounted = true
        }

        panelData.push({ panel, tab, mounted, getInstance: () => instance, setInstance(v) { instance = v; mounted = true } })
      }

      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.ve-tabs-btn')
        if (!btn) return
        const idx = parseInt(btn.dataset.index)
        for (let i = 0; i < navBtns.length; i++) {
          const isActive = i === idx
          navBtns[i].classList.toggle('ve-active', isActive)
          panelData[i].panel.classList.toggle('ve-active', isActive)
          if (isActive && !panelData[i].mounted) {
            panelData[i].setInstance(
              mountFields(panelData[i].panel, panelData[i].tab.fields, currentData, onUpdate)
            )
          }
        }
      })

      container.appendChild(root)

      return {
        update(newData) {
          currentData = newData
          for (const pd of panelData) {
            if (pd.mounted) {
              pd.getInstance()?.update(newData)
            }
          }
        },
      }
    },
    ...defaultFieldProperties(),
  }
}
