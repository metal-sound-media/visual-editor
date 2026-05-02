import { defineField } from './index.js'
import { colorToProperty } from '../functions/css.js'

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  let currentValue = value ?? null
  let paletteEl = null

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 've-color-btn'

  const inner = document.createElement('span')
  inner.className = 've-color-btn-inner'
  updateInner(inner, currentValue)
  btn.appendChild(inner)
  wrapper.appendChild(btn)

  function updateInner(el, color) {
    if (color) {
      el.className = 've-color-btn-inner'
      el.style.setProperty('--ve-selected-color', colorToProperty(color))
    } else {
      el.className = 've-color-btn-inner ve-transparent'
      el.style.removeProperty('--ve-selected-color')
    }
  }

  function closePalette() {
    if (paletteEl) {
      paletteEl.remove()
      paletteEl = null
      document.removeEventListener('mousedown', onOutside)
    }
  }

  function onOutside(e) {
    if (paletteEl && !paletteEl.contains(e.target) && e.target !== btn) {
      closePalette()
    }
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    if (paletteEl) {
      closePalette()
      return
    }

    paletteEl = document.createElement('div')
    paletteEl.className = 've-color-palette'

    const transparent = document.createElement('button')
    transparent.type = 'button'
    transparent.className = 've-color-swatch'
    transparent.style.background = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
    transparent.addEventListener('click', () => {
      currentValue = null
      updateInner(inner, null)
      onChange(null)
      closePalette()
    })
    paletteEl.appendChild(transparent)

    for (const color of options.colors ?? []) {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 've-color-swatch'
      swatch.style.setProperty('--ve-swatch-color', colorToProperty(color))
      swatch.style.background = `var(--ve-swatch-color)`
      swatch.addEventListener('click', () => {
        currentValue = color
        updateInner(inner, color)
        onChange(color)
        closePalette()
      })
      paletteEl.appendChild(swatch)
    }

    wrapper.style.position = 'relative'
    wrapper.appendChild(paletteEl)
    setTimeout(() => document.addEventListener('mousedown', onOutside), 0)
  })

  container.appendChild(wrapper)

  return {
    update(newValue) {
      currentValue = newValue ?? null
      updateInner(inner, currentValue)
    },
  }
}

export const Color = defineField({
  defaultOptions: { default: null, label: '', colors: [] },
  mount,
})
