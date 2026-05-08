import { defaultFieldProperties } from './index.js'
import { mountFields } from './index.js'
import { uniqId } from '../functions/string.js'
import { fillDefaults } from '../functions/fields.js'
import { deepSet } from '../functions/object.js'
import { moveItem } from '../functions/array.js'
import { textContent } from '../functions/string.js'
import { t } from '../functions/i18n.js'

function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  let items = (value ?? []).map((v) => ({ ...v, _id: v._id ?? uniqId() }))

  const repeaterEl = document.createElement('div')
  repeaterEl.className = 've-repeater'
  wrapper.appendChild(repeaterEl)

  const footer = document.createElement('div')
  footer.className = 've-repeater-footer'
  repeaterEl.appendChild(footer)

  function canAdd() {
    return !options.max || items.length < options.max
  }

  function canRemove() {
    return !options.min || items.length > options.min
  }

  function fireChange() {
    // Strip _autoOpen before sending to the store — it is a local UI hint
    // (auto-expand on add) and must never leak into the serialized output.
    onChange(items.map(({ _autoOpen, ...item }) => item))
  }

  let sortable = null
  let itemElements = []

  function renderItems() {
    // Remove old item elements
    for (const el of itemElements) el.remove()
    itemElements = []
    footer.style.display = canAdd() ? '' : 'none'

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemEl = createItemEl(item, i)
      repeaterEl.insertBefore(itemEl, footer)
      itemElements.push(itemEl)
    }

    // Re-init sortable
    if (sortable) {
      sortable.destroy()
      sortable = null
    }
    initSortable()
  }

  function createItemEl(item, index) {
    const el = document.createElement('div')
    el.className = 've-repeater-item'
    el.dataset.id = item._id

    // Heading
    const heading = document.createElement('div')
    heading.className = 've-bloc-heading'
    el.appendChild(heading)

    const headingLeft = document.createElement('div')
    headingLeft.className = 've-bloc-heading-left'

    const dragHandle = document.createElement('span')
    dragHandle.className = 've-drag-handle ve-repeater-handle'
    dragHandle.innerHTML = `<svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>`
    headingLeft.appendChild(dragHandle)

    const titleEl = document.createElement('span')
    titleEl.className = 've-bloc-title'
    const collapsed = options.collapsed
    const rawTitle = collapsed && item[collapsed] ? item[collapsed] : `#${index + 1}`
    titleEl.textContent = textContent(String(rawTitle))
    headingLeft.appendChild(titleEl)
    heading.appendChild(headingLeft)

    const headingRight = document.createElement('div')
    headingRight.className = 've-bloc-heading-right'

    const collapseBtn = document.createElement('button')
    collapseBtn.type = 'button'
    collapseBtn.className = 've-btn-icon'
    collapseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
    headingRight.appendChild(collapseBtn)

    if (canRemove()) {
      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.className = 've-btn-icon ve-danger'
      removeBtn.title = t('deleteItem')
      removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`
      removeBtn.addEventListener('click', () => {
        items = items.filter((it) => it._id !== item._id)
        fireChange()
        renderItems()
      })
      headingRight.appendChild(removeBtn)
    }

    heading.appendChild(headingRight)

    // Fields
    const fieldsEl = document.createElement('div')
    fieldsEl.className = 've-repeater-item-fields'
    fieldsEl.style.display = 'none'
    el.appendChild(fieldsEl)

    let fieldInstance = null

    function mountItemFields() {
      const currentItem = items.find((it) => it._id === item._id) ?? item
      fieldInstance = mountFields(
        fieldsEl,
        options.fields ?? [],
        currentItem,
        (newValue, path) => {
          const idx = items.findIndex((it) => it._id === item._id)
          if (idx !== -1) {
            items[idx] = deepSet(items[idx], path, newValue)
            fireChange()
          }
        }
      )
    }

    function toggleCollapse() {
      if (fieldsEl.style.display !== 'none') {
        // Closing: destroy the mounted fields entirely rather than just hiding
        // them with CSS. Hidden labels and inputs would otherwise still be
        // found by document.querySelector, which breaks Cypress assertions
        // like `should('not.exist')` and can confuse form autofill.
        fieldsEl.style.display = 'none'
        fieldsEl.innerHTML = ''
        fieldInstance = null
      } else {
        // Opening: re-mount with the latest item data from the `items` array.
        fieldsEl.style.display = ''
        mountItemFields()
      }
    }

    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault()
      toggleCollapse()
    })

    // Auto-open last added item
    if (item._autoOpen) {
      delete item._autoOpen
      toggleCollapse()
    }

    return el
  }

  function initSortable() {
    if (typeof window === 'undefined') return
    import('sortablejs').then(({ default: Sortable }) => {
      sortable = Sortable.create(repeaterEl, {
        animation: 150,
        handle: '.ve-repeater-handle',
        draggable: '.ve-repeater-item',
        onEnd(evt) {
          if (evt.oldIndex !== evt.newIndex) {
            items = moveItem(items, evt.oldIndex, evt.newIndex)
            fireChange()
          }
        },
      })
    })
  }

  const addBtn = document.createElement('button')
  addBtn.type = 'button'
  addBtn.className = 've-btn ve-btn-secondary ve-btn-small'
  addBtn.textContent = options.addLabel ?? t('addItem')
  addBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (!canAdd()) return
    const newItem = {
      ...fillDefaults({}, options.fields ?? []),
      _id: uniqId(),
      _autoOpen: true,
    }
    items = [...items, newItem]
    // Append only the new item — preserves existing items' DOM state (open/closed)
    const newItemEl = createItemEl(newItem, items.length - 1)
    repeaterEl.insertBefore(newItemEl, footer)
    itemElements.push(newItemEl)
    footer.style.display = canAdd() ? '' : 'none'
    fireChange()
  })
  footer.appendChild(addBtn)

  renderItems()
  container.appendChild(wrapper)

  return {
    update(newValue) {
      const newItems = (newValue ?? []).map((v) => ({
        ...v,
        _id: v._id ?? uniqId(),
      }))

      // Smart-diff: only rebuild the DOM when the list *structure* changes
      // (items added, removed, or reordered). If only field values changed,
      // the item count and IDs are the same, so we skip re-render and just
      // update the `items` reference. This preserves each item's open/closed
      // collapse state — a full re-render would reset everything to closed.
      const sameIds =
        newItems.length === items.length &&
        newItems.every((v, i) => v._id === items[i]?._id)

      if (sameIds) {
        items = newItems
        return
      }

      items = newItems
      renderItems()
    },
  }
}

export function Repeater(name, options = {}) {
  return {
    name,
    group: false,
    options: {
      addLabel: t('addItem'),
      fields: [],
      default: [],
      ...options,
    },
    mount,
    ...defaultFieldProperties(),
  }
}
