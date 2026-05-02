import { defineField } from './index.js'

const ALIGNMENTS_H = [
  { value: 'left', label: 'Left', icon: '⬅' },
  { value: 'center', label: 'Center', icon: '↔' },
  { value: 'right', label: 'Right', icon: '➡' },
  { value: 'justify', label: 'Justify', icon: '≡' },
]

const ALIGNMENTS_V = [
  { value: 'left', label: 'Left', icon: '⬅' },
  { value: 'center', label: 'Center', icon: '↔' },
  { value: 'right', label: 'Right', icon: '➡' },
]

function mount(container, value, onChange, options) {
  const alignments = options.vertical ? ALIGNMENTS_V : ALIGNMENTS_H
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const btnRow = document.createElement('div')
  btnRow.className = 've-align-btns'

  const buttons = []
  for (const align of alignments) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 've-align-btn'
    btn.title = align.label
    btn.setAttribute('aria-pressed', (value === align.value).toString())
    btn.innerHTML = `<span>${align.icon}</span>`
    btn.addEventListener('click', () => {
      const newValue = align.value
      onChange(newValue)
      for (const b of buttons) {
        b.setAttribute('aria-pressed', (b.dataset.value === newValue).toString())
      }
    })
    btn.dataset.value = align.value
    buttons.push(btn)
    btnRow.appendChild(btn)
  }

  wrapper.appendChild(btnRow)
  container.appendChild(wrapper)

  return {
    update(newValue) {
      for (const btn of buttons) {
        btn.setAttribute('aria-pressed', (btn.dataset.value === newValue).toString())
      }
    },
  }
}

export const TextAlign = defineField({
  defaultOptions: { label: '', vertical: false },
  mount,
})

export const Alignment = defineField({
  defaultOptions: { label: '', vertical: false },
  mount,
})
