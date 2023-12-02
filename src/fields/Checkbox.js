import { defineField } from './index.js'

let checkboxId = 0

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  const id = `ve-checkbox-${++checkboxId}`

  const row = document.createElement('label')
  row.className = 've-checkbox-wrapper'
  row.htmlFor = id

  const el = document.createElement('input')
  el.className = 've-checkbox'
  el.type = 'checkbox'
  el.id = id
  el.checked = value ?? options.default ?? false
  el.addEventListener('change', (e) => onChange(e.target.checked))
  row.appendChild(el)

  if (options.label) {
    const span = document.createElement('span')
    span.textContent = options.label
    row.appendChild(span)
  }

  wrapper.appendChild(row)
  container.appendChild(wrapper)

  return {
    update(newValue) {
      el.checked = newValue ?? options.default ?? false
    },
  }
}

export const Checkbox = defineField({
  defaultOptions: { default: false, label: '' },
  mount,
})
