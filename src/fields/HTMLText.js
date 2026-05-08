import { defaultFieldProperties } from './index.js'
import { colorToProperty } from '../functions/css.js'
import {
  ICON_BOLD,
  ICON_ITALIC,
  ICON_UNDERLINE,
  ICON_LINK,
  ICON_UNLINK,
  ICON_ALIGN_LEFT,
  ICON_ALIGN_CENTER,
  ICON_ALIGN_RIGHT,
  ICON_LIST,
  ICON_LIST_ORDERED,
  ICON_QUOTE,
  ICON_ERASER,
  ICON_CHEVRON_DOWN,
} from '../icons.js'

const BLOCK_START = /^<(p|h[2-6]|ul|ol|blockquote)/i

const TOOLBAR_BUTTONS_INLINE = [
  { cmd: 'bold', title: 'Bold', icon: ICON_BOLD, toggle: true },
  { cmd: 'italic', title: 'Italic', icon: ICON_ITALIC, toggle: true },
  { cmd: 'underline', title: 'Underline', icon: ICON_UNDERLINE, toggle: true },
  { type: 'link' },
  { cmd: 'removeFormat', title: 'Remove format', icon: ICON_ERASER },
]

const TOOLBAR_BUTTONS_MULTI = [
  { type: 'heading' },
  { type: 'sep' },
  { cmd: 'bold', title: 'Bold', icon: ICON_BOLD, toggle: true },
  { cmd: 'italic', title: 'Italic', icon: ICON_ITALIC, toggle: true },
  { cmd: 'underline', title: 'Underline', icon: ICON_UNDERLINE, toggle: true },
  { type: 'sep' },
  { cmd: 'insertUnorderedList', title: 'Bullet list', icon: ICON_LIST },
  { cmd: 'insertOrderedList', title: 'Ordered list', icon: ICON_LIST_ORDERED },
  { type: 'blockquote' },
  { type: 'sep' },
  { cmd: 'justifyLeft', title: 'Align left', icon: ICON_ALIGN_LEFT },
  { cmd: 'justifyCenter', title: 'Align center', icon: ICON_ALIGN_CENTER },
  { cmd: 'justifyRight', title: 'Align right', icon: ICON_ALIGN_RIGHT },
  { type: 'sep' },
  { type: 'link' },
  { cmd: 'removeFormat', title: 'Remove format', icon: ICON_ERASER },
]

const HEADING_OPTIONS = [
  { tag: 'p', label: 'Paragraph' },
  { tag: 'h2', label: 'Heading 2' },
  { tag: 'h3', label: 'Heading 3' },
  { tag: 'h4', label: 'Heading 4' },
  { tag: 'h5', label: 'Heading 5' },
  { tag: 'h6', label: 'Heading 6' },
]

// Fix 5: short labels in toolbar button
const HEADING_LABELS = { p: 'P', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6' }


function normalizeHtml(html, multiline) {
  html = html
    .replace(/<b>/g, '<strong>')
    .replace(/<\/b>/g, '</strong>')
    .replace(/<b /g, '<strong ')
    .replace(/<i>/g, '<em>')
    .replace(/<\/i>/g, '</em>')
    .replace(/<i /g, '<em ')

  if (!multiline) {
    html = html.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1')
    html = html.replace(/<br\s*\/?>/g, '')
    return html.trim()
  }

  if (!html.trim()) return ''

  if (!BLOCK_START.test(html.trim())) {
    html = `<p>${html}</p>`
  }

  html = html.replace(/<p(?![^>]*text-align)([^>]*)>/g, (_, rest) => {
    if (rest.includes('style=')) {
      return `<p${rest.replace(/style="([^"]*)"/, 'style="text-align: left; $1')}>`
    }
    return `<p style="text-align: left;"${rest}>`
  })

  return html.trim()
}

function makeToolbarBtn(title, iconHtml) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 've-htmltext-toolbar-btn'
  el.title = title
  el.innerHTML = iconHtml
  return el
}

function dispatchInput(editorEl) {
  editorEl.dispatchEvent(new Event('input', { bubbles: true }))
}

// Fix 3: walk up to the direct child of blockquote before removing
function exitBlockquote(directChild, blockquote, sel, editorEl) {
  blockquote.removeChild(directChild)

  const newP = document.createElement('p')
  newP.innerHTML = '<br>'
  if (blockquote.nextSibling) {
    blockquote.parentNode.insertBefore(newP, blockquote.nextSibling)
  } else {
    blockquote.parentNode.appendChild(newP)
  }

  if (!blockquote.textContent.trim()) {
    blockquote.parentNode.removeChild(blockquote)
  }

  const range = document.createRange()
  range.setStart(newP, 0)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)

  dispatchInput(editorEl)
}

// Fix 2: portal approach — dropdown appended to document.body to escape overflow:hidden
function buildHeadingDropdown(toolbar, editorEl) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-htmltext-heading-wrapper'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 've-htmltext-heading-btn'

  const labelEl = document.createElement('span')
  labelEl.className = 've-htmltext-heading-label'
  labelEl.textContent = 'P' // Fix 5: short initial label
  btn.appendChild(labelEl)

  const chevron = document.createElement('span')
  chevron.innerHTML = ICON_CHEVRON_DOWN
  btn.appendChild(chevron)

  const dropdown = document.createElement('div')
  dropdown.className = 've-htmltext-heading-dropdown'
  dropdown.hidden = true
  // Appended lazily to .ve-root on first click so CSS variables are available

  for (const { tag, label } of HEADING_OPTIONS) {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 've-htmltext-heading-option'
    item.dataset.tag = tag
    item.textContent = label
    item.addEventListener('mousedown', (e) => e.preventDefault())
    item.addEventListener('click', () => {
      document.execCommand('formatBlock', false, tag)
      dispatchInput(editorEl)
      dropdown.hidden = true
    })
    dropdown.appendChild(item)
  }

  btn.addEventListener('mousedown', (e) => e.preventDefault())
  btn.addEventListener('click', () => {
    if (!dropdown.parentElement) {
      const root = wrapper.closest('.ve-root') || document.body
      root.appendChild(dropdown)
    }
    if (dropdown.hidden) {
      const rect = btn.getBoundingClientRect()
      dropdown.style.top = `${rect.bottom + 2}px`
      dropdown.style.left = `${rect.left}px`
    }
    dropdown.hidden = !dropdown.hidden
  })

  document.addEventListener(
    'click',
    (e) => {
      if (!wrapper.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.hidden = true
      }
    },
    { capture: true }
  )

  wrapper.appendChild(btn)
  toolbar.appendChild(wrapper)

  return labelEl
}

// Fix 3: link button opens a modal dialog instead of an inline URL bar
function buildLinkUI(toolbar, editorEl) {
  const linkBtn = makeToolbarBtn('Link', ICON_LINK)
  let savedRange = null

  const overlay = document.createElement('div')
  overlay.className = 've-link-modal-overlay'
  overlay.hidden = true

  const modal = document.createElement('div')
  modal.className = 've-link-modal'

  const modalLabel = document.createElement('label')
  modalLabel.textContent = 'URL'

  const modalInput = document.createElement('input')
  modalInput.type = 'url'
  modalInput.className = 've-link-modal-input'
  modalInput.placeholder = 'https://'

  const actions = document.createElement('div')
  actions.className = 've-link-modal-actions'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.className = 've-link-modal-cancel'
  cancelBtn.textContent = 'Annuler'

  const confirmBtn = document.createElement('button')
  confirmBtn.type = 'button'
  confirmBtn.className = 've-link-modal-confirm'
  confirmBtn.textContent = 'Confirmer'

  actions.appendChild(cancelBtn)
  actions.appendChild(confirmBtn)
  modal.appendChild(modalLabel)
  modal.appendChild(modalInput)
  modal.appendChild(actions)
  overlay.appendChild(modal)
  // Appended lazily to .ve-root on first use so CSS variables are available

  const closeModal = () => {
    overlay.hidden = true
    savedRange = null
  }

  const applyLink = () => {
    const url = modalInput.value.trim()
    if (!url) { closeModal(); return }
    editorEl.focus()
    if (savedRange) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }
    document.execCommand('createLink', false, url)
    editorEl.querySelectorAll('a:not([target])').forEach((a) => { a.target = '_blank' })
    dispatchInput(editorEl)
    closeModal()
  }

  confirmBtn.addEventListener('click', applyLink)
  cancelBtn.addEventListener('click', closeModal)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal() })
  modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink() }
    if (e.key === 'Escape') closeModal()
  })

  linkBtn.addEventListener('mousedown', (e) => e.preventDefault())
  linkBtn.addEventListener('click', () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode
      const anchor = node?.nodeType === 3 ? node.parentElement : node
      if (anchor?.closest('a')) {
        document.execCommand('unlink', false, null)
        dispatchInput(editorEl)
        return
      }
      // Require text selection to create a link
      if (sel.isCollapsed) return
      savedRange = sel.getRangeAt(0).cloneRange()
    }
    if (!overlay.parentElement) {
      const root = editorEl.closest('.ve-root') || document.body
      root.appendChild(overlay)
    }
    overlay.hidden = false
    modalInput.value = ''
    modalInput.focus()
  })

  toolbar.appendChild(linkBtn)
  return { linkBtn }
}

function updateToolbarState(stateButtons, headingLabelEl, linkBtn) {
  const currentTag = document.queryCommandValue('formatBlock').toLowerCase()
  const sel = window.getSelection()
  const selNode = sel?.anchorNode
  const selEl = selNode?.nodeType === 3 ? selNode.parentElement : selNode

  for (const { el, cmd } of stateButtons) {
    let isActive = document.queryCommandState(cmd)

    // Fix 1: headings are inherently bold — suppress false-active
    if (cmd === 'bold' && /^h[1-6]$/.test(currentTag)) isActive = false

    // Fix 2: links are inherently underlined — suppress false-active
    if (cmd === 'underline' && selEl?.closest('a')) isActive = false

    el.classList.toggle('ve-active', isActive)
  }

  if (headingLabelEl) {
    headingLabelEl.textContent = HEADING_LABELS[currentTag] ?? 'P'
  }

  if (linkBtn) {
    const sel = window.getSelection()
    const node = sel?.anchorNode
    const anchor = node?.nodeType === 3 ? node.parentElement : node
    const inLink = !!anchor?.closest('a')
    linkBtn.innerHTML = inLink ? ICON_UNLINK : ICON_LINK
    linkBtn.title = inLink ? 'Remove link' : 'Link'
  }
}

function buildToolbar(toolbar, editorEl, options) {
  const stateButtons = []
  let headingLabelEl = null
  let linkBtn = null

  const buttons = options.multiline ? TOOLBAR_BUTTONS_MULTI : TOOLBAR_BUTTONS_INLINE

  for (const btn of buttons) {
    if (btn.type === 'sep') {
      const sep = document.createElement('div')
      sep.className = 've-htmltext-toolbar-separator'
      toolbar.appendChild(sep)
      continue
    }

    if (btn.type === 'heading') {
      if (options.allowHeadings) {
        headingLabelEl = buildHeadingDropdown(toolbar, editorEl)
      }
      continue
    }

    if (btn.type === 'blockquote') {
      const el = makeToolbarBtn('Blockquote', ICON_QUOTE)
      el.addEventListener('mousedown', (e) => e.preventDefault())
      el.addEventListener('click', () => {
        // Fix 1: check DOM ancestry instead of queryCommandValue for blockquote detection
        const sel = window.getSelection()
        const node = sel?.anchorNode
        const blockEl = node?.nodeType === 3 ? node.parentElement : node
        if (blockEl?.closest('blockquote')) {
          document.execCommand('outdent', false, null)
        } else {
          document.execCommand('formatBlock', false, 'blockquote')
        }
        dispatchInput(editorEl)
      })
      toolbar.appendChild(el)
      continue
    }

    if (btn.type === 'link') {
      const result = buildLinkUI(toolbar, editorEl)
      linkBtn = result.linkBtn
      continue
    }

    const el = makeToolbarBtn(btn.title, btn.icon)
    el.addEventListener('mousedown', (e) => e.preventDefault())
    el.addEventListener('click', () => {
      document.execCommand(btn.cmd, false, null)
      dispatchInput(editorEl)
    })
    toolbar.appendChild(el)

    if (btn.toggle) stateButtons.push({ el, cmd: btn.cmd })
  }

  return { stateButtons, headingLabelEl, linkBtn }
}


function mount(container, value, onChange, options) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const editorWrapper = document.createElement('div')
  editorWrapper.className = 've-htmltext'

  const toolbar = document.createElement('div')
  toolbar.className = 've-htmltext-toolbar'

  const editorEl = document.createElement('div')
  editorEl.className = 've-htmltext-editor'
  editorEl.contentEditable = 'true'

  const { stateButtons, headingLabelEl, linkBtn } = buildToolbar(toolbar, editorEl, options)

  const initialValue = value ?? options.default ?? ''
  if (initialValue) {
    if (options.multiline && !BLOCK_START.test(initialValue.trim())) {
      editorEl.innerHTML = `<p>${initialValue}</p>`
    } else {
      editorEl.innerHTML = initialValue
    }
  } else if (options.multiline) {
    editorEl.innerHTML = '<p><br></p>'
  }

  if (options.multiline) {
    editorEl.style.minHeight = '6em'
  }

  // Fix 4: set defaultParagraphSeparator on focus so it applies when the editor is active
  if (options.multiline) {
    editorEl.addEventListener('focus', () => {
      document.execCommand('defaultParagraphSeparator', false, 'p')
    })
  }

  editorEl.addEventListener('input', () => {
    const html = normalizeHtml(editorEl.innerHTML, options.multiline)
    onChange(html)
  })

  if (!options.multiline) {
    editorEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault()
    })
  } else {
    editorEl.addEventListener('keydown', (e) => {
      // Fix 3: exit blockquote on double-Enter (Enter on empty line inside blockquote)
      if (e.key === 'Enter' && !e.shiftKey) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount) {
          const node = sel.anchorNode
          let el = node?.nodeType === 3 ? node.parentElement : node
          const blockquote = el?.closest('blockquote')
          if (blockquote && el !== blockquote) {
            // Walk up to the direct child of blockquote
            while (el && el.parentElement !== blockquote) {
              el = el.parentElement
            }
            if (el && el.textContent.trim() === '') {
              e.preventDefault()
              exitBlockquote(el, blockquote, sel, editorEl)
              return
            }
          }
        }
      }
    })
  }

  document.addEventListener('selectionchange', () => {
    if (editorEl.contains(window.getSelection()?.anchorNode)) {
      updateToolbarState(stateButtons, headingLabelEl, linkBtn)
    }
  })

  editorWrapper.addEventListener('mousedown', (e) => {
    if (e.target === editorWrapper) {
      e.preventDefault()
      editorEl.focus()
    }
  })

  editorWrapper.appendChild(toolbar)
  editorWrapper.appendChild(editorEl)
  wrapper.appendChild(editorWrapper)
  container.appendChild(wrapper)

  return {
    update(newValue) {
      if (document.activeElement !== editorEl) {
        const v = newValue ?? options.default ?? ''
        if (options.multiline && v && !BLOCK_START.test(v.trim())) {
          editorEl.innerHTML = `<p>${v}</p>`
        } else {
          editorEl.innerHTML = v || (options.multiline ? '<p><br></p>' : '')
        }
      }
    },
  }
}

export function HTMLText(name, options = {}) {
  return {
    name,
    group: false,
    options: {
      multiline: true,
      allowHeadings: true,
      default: '',
      ...options,
    },
    extraProps(data) {
      return {
        backgroundColor: colorToProperty(
          options.backgroundColor && data[options.backgroundColor]
        ),
        textColor: colorToProperty(options.textColor && data[options.textColor]),
        defaultAlign: options.defaultAlign ? data[options.defaultAlign] : undefined,
      }
    },
    mount,
    ...defaultFieldProperties(),
  }
}
