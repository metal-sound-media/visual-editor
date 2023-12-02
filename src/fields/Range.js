import { defineField } from './index.js'

let fieldId = 0

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  const id = `ve-range-${++fieldId}`

  if (options.label) {
    const label = document.createElement('label')
    label.htmlFor = id
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const el = document.createElement('input')
  el.className = 've-range'
  el.type = 'range'
  el.id = id
  el.min = options.min ?? 0
  el.max = options.max ?? 100
  if (options.step) el.step = options.step
  el.value = value ?? options.default ?? el.min
  el.addEventListener('input', (e) => onChange(parseFloat(e.target.value)))
  wrapper.appendChild(el)

  container.appendChild(wrapper)

  return {
    update(newValue) {
      el.value = newValue ?? options.default ?? el.min
    },
  }
}

export const Range = defineField({
  defaultOptions: { default: 0, label: '', min: 0, max: 100 },
  mount,
})
