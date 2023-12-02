import { defineField } from './index.js'

let fieldId = 0

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  const id = `ve-text-${++fieldId}`

  if (options.label) {
    const label = document.createElement('label')
    label.htmlFor = id
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const el = options.multiline
    ? document.createElement('textarea')
    : document.createElement('input')

  el.className = 've-input'
  el.id = id
  if (!options.multiline) el.type = 'text'
  el.value = value ?? options.default ?? ''
  el.addEventListener('input', (e) => onChange(e.target.value))

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

export const Text = defineField({
  defaultOptions: { default: '', label: '', multiline: false },
  mount,
})
