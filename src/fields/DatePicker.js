import { defineField } from './index.js'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(d) {
  if (!d) return ''
  return d.toISOString().split('T')[0]
}

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const pickerWrapper = document.createElement('div')
  pickerWrapper.className = 've-datepicker'

  const input = document.createElement('input')
  input.className = 've-input'
  input.type = 'text'
  input.readOnly = true
  input.placeholder = 'Pick a date'
  input.value = value ?? ''
  pickerWrapper.appendChild(input)

  let calendarEl = null
  let currentYear = null
  let currentMonth = null
  let selectedDate = parseDate(value)

  function openCalendar() {
    const now = selectedDate ?? new Date()
    currentYear = now.getFullYear()
    currentMonth = now.getMonth()
    renderCalendar()
    setTimeout(() => document.addEventListener('mousedown', onOutside), 0)
  }

  function closeCalendar() {
    if (calendarEl) {
      calendarEl.remove()
      calendarEl = null
      document.removeEventListener('mousedown', onOutside)
    }
  }

  function onOutside(e) {
    if (calendarEl && !calendarEl.contains(e.target) && e.target !== input) {
      closeCalendar()
    }
  }

  function renderCalendar() {
    if (calendarEl) calendarEl.remove()

    calendarEl = document.createElement('div')
    calendarEl.className = 've-calendar'

    // Header
    const header = document.createElement('div')
    header.className = 've-calendar-header'

    const prevBtn = document.createElement('button')
    prevBtn.type = 'button'
    prevBtn.className = 've-calendar-nav'
    prevBtn.innerHTML = '&#8249;'
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      currentMonth--
      if (currentMonth < 0) { currentMonth = 11; currentYear-- }
      renderCalendar()
    })

    const title = document.createElement('span')
    title.className = 've-calendar-title'
    title.textContent = `${MONTHS[currentMonth]} ${currentYear}`

    const nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.className = 've-calendar-nav'
    nextBtn.innerHTML = '&#8250;'
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      currentMonth++
      if (currentMonth > 11) { currentMonth = 0; currentYear++ }
      renderCalendar()
    })

    header.appendChild(prevBtn)
    header.appendChild(title)
    header.appendChild(nextBtn)
    calendarEl.appendChild(header)

    // Grid
    const grid = document.createElement('div')
    grid.className = 've-calendar-grid'

    for (const day of DAYS) {
      const cell = document.createElement('div')
      cell.className = 've-calendar-weekday'
      cell.textContent = day
      grid.appendChild(cell)
    }

    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const today = new Date()

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div')
      grid.appendChild(empty)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div')
      cell.className = 've-calendar-day'
      cell.textContent = String(d)

      const cellDate = new Date(currentYear, currentMonth, d)
      if (
        selectedDate &&
        selectedDate.getFullYear() === currentYear &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getDate() === d
      ) {
        cell.classList.add('ve-selected')
      }
      if (
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === d
      ) {
        cell.classList.add('ve-today')
      }

      cell.addEventListener('click', () => {
        selectedDate = cellDate
        const formatted = formatDate(cellDate)
        input.value = formatted
        onChange(formatted)
        closeCalendar()
      })

      grid.appendChild(cell)
    }

    calendarEl.appendChild(grid)
    pickerWrapper.appendChild(calendarEl)
  }

  function toggleCalendar() {
    if (calendarEl) {
      closeCalendar()
    } else {
      openCalendar()
    }
  }

  input.addEventListener('click', toggleCalendar)
  pickerWrapper.addEventListener('click', (e) => {
    if (e.target === pickerWrapper) toggleCalendar()
  })

  wrapper.appendChild(pickerWrapper)
  container.appendChild(wrapper)

  return {
    update(newValue) {
      input.value = newValue ?? ''
      selectedDate = parseDate(newValue)
    },
  }
}

export const DatePicker = defineField({
  defaultOptions: { default: '', label: '' },
  mount,
})
