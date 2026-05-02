import { defineField } from './index.js'

let fieldId = 0

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  const id = `ve-select-${++fieldId}`

  if (options.label) {
    const label = document.createElement('label')
    label.htmlFor = id
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const el = document.createElement('select')
  el.className = 've-input'
  el.id = id

  for (const opt of options.options ?? []) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.label
    el.appendChild(option)
  }

  el.value = value ?? options.default ?? ''
  el.addEventListener('change', (e) => onChange(e.target.value))
  wrapper.appendChild(el)

  if (options.help) {
    const help = document.createElement('div')
    help.className = 've-field-help'
    help.textContent = options.help
    wrapper.appendChild(help)
  }

  container.appendChild(wrapper)

  return {
    update(newValue) {
      el.value = newValue ?? options.default ?? ''
    },
  }
}

export const Select = defineField({
  defaultOptions: { default: '', label: '', options: [] },
  mount,
})
