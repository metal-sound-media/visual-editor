import { mountFields } from '../fields/index.js'
import { strToDom } from '../functions/dom.js'
import { t } from '../functions/i18n.js'
import { stringifyFields } from '../functions/object.js'
import { Events } from '../store.js'

const ICON_CLOSE = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
const ICON_PLUS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`
const ICON_SAVE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
const ICON_COPY = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`
const ICON_COPY_SUCCESS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`

function flashCopyBtn(btn) {
  const original = btn.innerHTML
  btn.innerHTML = ICON_COPY_SUCCESS
  btn.disabled = true
  setTimeout(() => {
    btn.innerHTML = original
    btn.disabled = false
  }, 3000)
}
const ICON_TRASH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`
const ICON_DOWN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
const ICON_UP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>`
const ICON_DRAG = `<svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor"><circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>`
const ICON_PAGE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
const ICON_BLOCS = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`

export function createSidebar(store, { onClose }) {
  const el = document.createElement('div')
  el.className = 've-sidebar'

  // --- Header ---
  const header = document.createElement('div')
  header.className = 've-sidebar-header'
  el.appendChild(header)

  const headerLeft = document.createElement('div')
  headerLeft.className = 've-sidebar-header-left'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 've-btn-icon'
  closeBtn.title = t('close')
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.innerHTML = ICON_CLOSE
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (window.confirm(t('closeConfirm'))) onClose()
  })
  headerLeft.appendChild(closeBtn)
  header.appendChild(headerLeft)

  const headerRight = document.createElement('div')
  headerRight.className = 've-sidebar-header-right'

  // Template toggle button (shown when templates exist)
  const templateToggleBtn = document.createElement('button')
  templateToggleBtn.type = 'button'
  templateToggleBtn.className = 've-btn-icon'
  templateToggleBtn.style.display = 'none'
  headerRight.appendChild(templateToggleBtn)

  // Copy page
  const copyBtn = document.createElement('button')
  copyBtn.type = 'button'
  copyBtn.className = 've-btn-icon'
  copyBtn.title = t('copyPage')
  copyBtn.innerHTML = ICON_COPY
  copyBtn.addEventListener('click', () => {
    const { data } = store.get()
    navigator.clipboard?.writeText(JSON.stringify(data)).catch(() => {})
    flashCopyBtn(copyBtn)
  })
  headerRight.appendChild(copyBtn)

  const addBtn = document.createElement('button')
  addBtn.type = 'button'
  addBtn.className = 've-btn'
  addBtn.innerHTML = `${ICON_PLUS} ${t('addComponent')}`
  addBtn.addEventListener('click', (e) => {
    e.preventDefault()
    store.setAddBlockIndex()
  })
  headerRight.appendChild(addBtn)
  header.appendChild(headerRight)

  // --- Content area ---
  const contentEl = document.createElement('div')
  contentEl.style.flex = '1'
  contentEl.style.overflow = 'hidden'
  contentEl.style.display = 'flex'
  contentEl.style.flexDirection = 'column'
  el.appendChild(contentEl)

  // --- Footer ---
  const footerEl = document.createElement('div')
  footerEl.className = 've-sidebar-footer'

  const { actions } = store.get()
  for (const action of actions.filter((a) => a.position === 'footer')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 've-btn-icon'
    btn.title = action.title
    btn.innerHTML = action.icon || ''
    btn.addEventListener('click', action.action)
    footerEl.appendChild(btn)
  }

  const saveBtn = document.createElement('button')
  saveBtn.type = 'submit'
  saveBtn.className = 've-btn'
  saveBtn.innerHTML = `${ICON_SAVE} ${t('save')}`
  footerEl.appendChild(saveBtn)
  el.appendChild(footerEl)

  // --- Mode management ---
  let mode = 'blocs'

  function setMode(newMode) {
    mode = newMode
    renderContent()
    const { templates } = store.get()
    templateToggleBtn.innerHTML =
      mode === 'templates' ? ICON_BLOCS : ICON_PAGE
    templateToggleBtn.title = t(
      mode === 'templates' ? 'addComponent' : 'useTemplate'
    )
    templateToggleBtn.style.display = templates.length > 0 ? '' : 'none'
  }

  templateToggleBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (mode === 'blocs') {
      const event = store.dispatchEvent(Events.Templates, { cancelable: true })
      if (event.defaultPrevented) return
    }
    setMode(mode === 'blocs' ? 'templates' : 'blocs')
  })

  function renderContent() {
    contentEl.innerHTML = ''
    const { data, templates } = store.get()

    if (mode === 'templates') {
      contentEl.appendChild(createTemplatesView(store, () => setMode('blocs')))
      return
    }

    if (data.length === 0 && templates.length > 0) {
      contentEl.appendChild(createEmptyView(() => setMode('templates')))
      return
    }

    contentEl.appendChild(createBlocsView(store))
  }

  renderContent()

  // Only switch view when empty↔blocs state changes or templates change
  let prevDataLength = store.get().data.length
  store.on('data', (newData) => {
    const { templates } = store.get()
    const nowEmpty = newData.length === 0 && templates.length > 0
    const wasEmpty = prevDataLength === 0 && templates.length > 0
    if (nowEmpty !== wasEmpty) renderContent()
    prevDataLength = newData.length
  })
  store.on('templates', (templates) => {
    templateToggleBtn.style.display = templates.length > 0 ? '' : 'none'
    renderContent()
  })

  // Paste handler: CTRL+V pastes a copied block (JSON) when not focused in a field
  const onPaste = (e) => {
    const active = document.activeElement
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable) return
    const text = e.clipboardData?.getData('text/plain')
    if (!text) return
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed._name) {
        e.preventDefault()
        const { _id, _name, ...fields } = parsed
        store.insertData(_name, store.get().data.length, fields)
        return
      }
      if (Array.isArray(parsed) && parsed.length && parsed[0]?._name) {
        e.preventDefault()
        parsed.forEach((block) => {
          const { _id, _name, ...fields } = block
          store.insertData(_name, store.get().data.length, fields)
        })
      }
    } catch (err) {
      console.error('[VisualEditor] Failed to paste block:', err)
      alert('Unable to paste: clipboard content is not a valid block. See console for details.')
    }
  }
  document.addEventListener('paste', onPaste)

  return el
}

// ---- Blocs view ----

function createBlocsView(store) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-sidebar-blocs'

  let sortable = null
  let blocInstances = []

  function render() {
    const { data, definitions, focusIndex } = store.get()

    // Destroy existing blocs
    for (const { destroy } of blocInstances) destroy?.()
    blocInstances = []
    wrapper.innerHTML = ''

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const def = definitions[item._name]
      const blocEl = createBlocEl(store, item, def, String(i), focusIndex)
      wrapper.appendChild(blocEl.el)
      blocInstances.push(blocEl)
    }

    initSortable()
  }

  function initSortable() {
    if (sortable) {
      sortable.destroy()
      sortable = null
    }
    import('sortablejs').then(({ default: Sortable }) => {
      sortable = Sortable.create(wrapper, {
        animation: 150,
        handle: '.ve-bloc-drag-handle',
        draggable: '.ve-bloc',
        onEnd(evt) {
          if (evt.oldIndex !== evt.newIndex) {
            const { data } = store.get()
            const arr = [...data]
            const [item] = arr.splice(evt.oldIndex, 1)
            arr.splice(evt.newIndex, 0, item)
            store.updateData(arr)
          }
        },
      })
    })
  }

  render()

  // Only re-render blocs list when blocks are added/removed/reordered (not on field edits)
  let prevIds = store.get().data.map((d) => d._id).join(',')
  store.on('data', (newData) => {
    const newIds = newData.map((d) => d._id).join(',')
    if (newIds !== prevIds) {
      prevIds = newIds
      render()
    }
  })

  store.on('focusIndex', (focusIndex) => {
    const { data } = store.get()
    for (const { el, id, setFocused } of blocInstances) {
      setFocused?.(id === focusIndex)
    }
  })

  return wrapper
}

// ---- Single bloc element ----

function createBlocEl(store, data, definition, path, initialFocusIndex) {
  const el = document.createElement('div')
  el.className = 've-bloc'

  if (!definition) {
    el.className = 've-bloc-missing'
    el.textContent = `${t('unknownComponent')}: ${data._name}`
    return { el, id: data._id }
  }

  // Heading
  const heading = document.createElement('div')
  heading.className = 've-bloc-heading'

  const headingLeft = document.createElement('div')
  headingLeft.className = 've-bloc-heading-left'

  const dragHandle = document.createElement('span')
  dragHandle.className = 've-drag-handle ve-bloc-drag-handle'
  dragHandle.innerHTML = ICON_DRAG
  headingLeft.appendChild(dragHandle)

  const titleWrap = document.createElement('div')

  const titleEl = document.createElement('div')
  titleEl.className = 've-bloc-title'
  titleEl.textContent = definition.title
  titleWrap.appendChild(titleEl)

  const descEl = document.createElement('div')
  descEl.className = 've-bloc-description'
  titleWrap.appendChild(descEl)
  headingLeft.appendChild(titleWrap)
  heading.appendChild(headingLeft)

  // Hover actions
  const hoverActions = document.createElement('div')
  hoverActions.className = 've-bloc-hover-actions'

  const copyBlocBtn = document.createElement('button')
  copyBlocBtn.type = 'button'
  copyBlocBtn.className = 've-btn-icon'
  copyBlocBtn.title = t('copyComponent')
  copyBlocBtn.innerHTML = ICON_COPY
  copyBlocBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(JSON.stringify(data)).catch(() => {})
    flashCopyBtn(copyBlocBtn)
  })
  hoverActions.appendChild(copyBlocBtn)

  const removeBtn = document.createElement('button')
  removeBtn.type = 'button'
  removeBtn.className = 've-btn-icon ve-danger'
  removeBtn.title = t('deleteComponent')
  removeBtn.innerHTML = ICON_TRASH
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    store.removeBloc(data._id)
  })
  hoverActions.appendChild(removeBtn)

  const headingRight = document.createElement('div')
  headingRight.className = 've-bloc-heading-right'
  headingRight.appendChild(hoverActions)

  const collapseBtn = document.createElement('button')
  collapseBtn.type = 'button'
  collapseBtn.className = 've-btn-icon'
  collapseBtn.innerHTML = ICON_DOWN
  collapseBtn.style.transition = 'transform 0.2s'
  headingRight.appendChild(collapseBtn)

  heading.appendChild(headingRight)
  el.appendChild(heading)

  // Fields area
  const fieldsEl = document.createElement('div')
  fieldsEl.className = 've-bloc-fields'
  fieldsEl.style.display = 'none'
  el.appendChild(fieldsEl)

  let isCollapsed = true
  let fieldsMounted = false
  let fieldInstance = null

  function updateLabel() {
    const labelKey = definition.label
    const labelValue = labelKey && data[labelKey] ? data[labelKey] : null
    if (labelValue && isCollapsed) {
      const safe = labelValue.includes('<') ? strToDom(labelValue).innerText : labelValue
      descEl.textContent = safe
      descEl.style.display = ''
    } else {
      descEl.style.display = 'none'
    }
  }

  function setCollapsed(val) {
    isCollapsed = val
    fieldsEl.style.display = val ? 'none' : ''
    collapseBtn.style.transform = val ? '' : 'rotate(180deg)'
    updateLabel()

    if (!val && !fieldsMounted) {
      fieldsMounted = true
      fieldInstance = mountFields(
        fieldsEl,
        definition.fields ?? [],
        data,
        (value, fieldPath) => {
          store.updateData(value, `${path}.${fieldPath}`)
        }
      )
    }
  }

  function setFocused(focused) {
    if (focused && isCollapsed) {
      setCollapsed(false)
      setTimeout(
        () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        100
      )
    } else if (!focused && !isCollapsed) {
      setCollapsed(true)
    }
  }

  heading.addEventListener('click', (e) => {
    if (e.target.closest('button') && e.target.closest('button') !== collapseBtn) return
    e.preventDefault()
    const wasCollapsed = isCollapsed
    setCollapsed(!isCollapsed)
    if (!wasCollapsed) {
      // Was open, now collapsed: remove focus
    } else {
      // Was collapsed, now open: set focus
      store.setFocusIndex(path)
    }
  })

  collapseBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCollapsed(!isCollapsed)
  })

  updateLabel()

  // Apply initial focus
  if (data._id === initialFocusIndex) {
    setFocused(true)
  }

  // Subscribe to data updates for this block
  const unsubData = store.on('data', (newData) => {
    const updated = newData.find((d) => d._id === data._id)
    if (updated) {
      data = updated
      updateLabel()
      if (fieldInstance && !isCollapsed) {
        fieldInstance.update(updated)
      }
    }
  })

  return {
    el,
    id: data._id,
    setFocused,
    destroy() {
      unsubData()
    },
  }
}

// ---- Templates view ----

function createTemplatesView(store, onDone) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-templates'

  const { templates } = store.get()

  if (templates.length === 0) {
    const empty = document.createElement('p')
    empty.textContent = t('noContent')
    wrapper.appendChild(empty)
    return wrapper
  }

  for (const tpl of templates) {
    const card = document.createElement('div')
    card.className = 've-template-card'
    card.addEventListener('click', async () => {
      const data = typeof tpl.data === 'function' ? await tpl.data() : tpl.data
      store.setData(data)
      onDone()
    })

    if (tpl.image) {
      const img = document.createElement('img')
      img.className = 've-template-img'
      img.src = tpl.image
      img.alt = tpl.name
      card.appendChild(img)
    }

    const body = document.createElement('div')
    body.className = 've-template-body'

    const name = document.createElement('div')
    name.className = 've-template-name'
    name.textContent = tpl.name
    body.appendChild(name)

    if (tpl.description) {
      const desc = document.createElement('div')
      desc.className = 've-template-desc'
      desc.textContent = tpl.description
      body.appendChild(desc)
    }

    card.appendChild(body)
    wrapper.appendChild(card)
  }

  return wrapper
}

// ---- Empty view ----

function createEmptyView(onShowTemplates) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-empty'

  const text = document.createElement('p')
  text.textContent = t('noContent')
  wrapper.appendChild(text)

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 've-btn ve-btn-secondary'
  btn.textContent = t('useTemplate')
  btn.addEventListener('click', onShowTemplates)
  wrapper.appendChild(btn)

  return wrapper
}
