import { defineField } from './index.js'

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const row = document.createElement('div')
  row.className = 've-image-wrapper'

  const el = document.createElement('input')
  el.className = 've-input'
  el.type = 'text'
  el.placeholder = options.placeholder ?? 'https://'
  el.value = value ?? ''
  el.addEventListener('input', (e) => onChange(e.target.value))
  row.appendChild(el)

  if (options.onBrowse) {
    const btn = document.createElement('button')
    btn.className = 've-btn ve-btn-secondary ve-btn-small'
    btn.type = 'button'
    btn.textContent = '...'
    btn.addEventListener('click', async () => {
      try {
        const url = await options.onBrowse(el.value)
        if (url != null) {
          el.value = url
          onChange(url)
        }
      } catch (e) {
        console.error(e)
      }
    })
    row.appendChild(btn)
  }

  wrapper.appendChild(row)
  container.appendChild(wrapper)

  return {
    update(newValue) {
      el.value = newValue ?? ''
    },
  }
}

export const ImageUrl = defineField({
  defaultOptions: { default: '', label: '' },
  mount,
})
