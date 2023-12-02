import { defaultFieldProperties } from './index.js'
import { colorToProperty } from '../functions/css.js'
import { t } from '../functions/i18n.js'

const TOOLBAR_BUTTONS_INLINE = [
  { cmd: 'bold', title: 'Bold', icon: '<b>B</b>' },
  { cmd: 'italic', title: 'Italic', icon: '<i>I</i>' },
  { cmd: 'underline', title: 'Underline', icon: '<u>U</u>' },
  { cmd: 'removeFormat', title: 'Remove format', icon: '✕' },
]

const TOOLBAR_BUTTONS_MULTI = [
  { cmd: 'bold', title: 'Bold', icon: '<b>B</b>' },
  { cmd: 'italic', title: 'Italic', icon: '<i>I</i>' },
  { cmd: 'underline', title: 'Underline', icon: '<u>U</u>' },
  { cmd: 'insertUnorderedList', title: 'Bullet list', icon: '• ≡' },
  { cmd: 'insertOrderedList', title: 'Ordered list', icon: '1. ≡' },
  { type: 'sep' },
  {
    cmd: 'justifyLeft',
    title: 'Left',
    icon: '⬅',
    align: 'left',
  },
  {
    cmd: 'justifyCenter',
    title: 'Center',
    icon: '↔',
    align: 'center',
  },
  {
    cmd: 'justifyRight',
    title: 'Right',
    icon: '➡',
    align: 'right',
  },
  { type: 'sep' },
  { cmd: 'removeFormat', title: 'Remove format', icon: '✕' },
]

function normalizeHtml(html, multiline) {
  // Normalize <b> → <strong>, <i> → <em>
  html = html
    .replace(/<b>/g, '<strong>')
    .replace(/<\/b>/g, '</strong>')
    .replace(/<b /g, '<strong ')
    .replace(/<i>/g, '<em>')
    .replace(/<\/i>/g, '</em>')
    .replace(/<i /g, '<em ')

  if (!multiline) {
    // Strip paragraph wrappers for single-line mode
    html = html.replace(/<p[^>]*>(.*?)<\/p>/gs, '$1')
    html = html.replace(/<br\s*\/?>/g, '')
    return html.trim()
  }

  // For multiline, ensure paragraphs have text-align style
  if (!html.trim()) return ''

  // Split content that isn't in a paragraph
  if (!html.includes('<p')) {
    html = `<p>${html}</p>`
  }

  // Add default text-align:left to paragraphs that don't have it
  html = html.replace(/<p(?![^>]*text-align)([^>]*)>/g, (_, rest) => {
    if (rest.includes('style=')) {
      return `<p${rest.replace(/style="([^"]*)"/, 'style="text-align: left; $1')}>`
    }
    return `<p style="text-align: left;"${rest}>`
  })

  return html.trim()
}

function mount(container, value, onChange, options, extraProps) {
  const wrapper = document.createElement('div')
  wrapper.className = 've-field'

  if (options.label) {
    const label = document.createElement('label')
    label.textContent = options.label
    wrapper.appendChild(label)
  }

  const editorWrapper = document.createElement('div')
  editorWrapper.className = 've-htmltext'

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.className = 've-htmltext-toolbar'

  const buttons = options.multiline ? TOOLBAR_BUTTONS_MULTI : TOOLBAR_BUTTONS_INLINE

  let activeEditorEl = null

  for (const btn of buttons) {
    if (btn.type === 'sep') {
      const sep = document.createElement('div')
      sep.className = 've-htmltext-toolbar-separator'
      toolbar.appendChild(sep)
      continue
    }

    const el = document.createElement('button')
    el.type = 'button'
    el.className = 've-htmltext-toolbar-btn'
    el.title = btn.title
    el.innerHTML = btn.icon

    // Prevent losing selection when clicking toolbar button
    el.addEventListener('mousedown', (e) => {
      e.preventDefault()
    })

    el.addEventListener('click', () => {
      if (!activeEditorEl) return
      document.execCommand(btn.cmd, false, null)
      activeEditorEl.dispatchEvent(new Event('input', { bubbles: true }))
      activeEditorEl.focus()
    })

    toolbar.appendChild(el)
  }

  // Editable area — toolbar is inserted/removed from DOM on focus/blur
  const editorEl = document.createElement('div')
  editorEl.className = 've-htmltext-editor'
  editorEl.contentEditable = 'true'

  if (options.multiline) {
    document.execCommand('defaultParagraphSeparator', false, 'p')
  }

  // Set initial content
  const initialValue = value ?? options.default ?? ''
  if (initialValue) {
    if (options.multiline && !initialValue.includes('<p')) {
      editorEl.innerHTML = `<p>${initialValue}</p>`
    } else {
      editorEl.innerHTML = initialValue
    }
  } else if (options.multiline) {
    editorEl.innerHTML = '<p><br></p>'
  }

  activeEditorEl = editorEl

  editorEl.addEventListener('input', () => {
    const html = normalizeHtml(editorEl.innerHTML, options.multiline)
    onChange(html)
  })

  // Prevent Enter creating <div> in single-line mode
  if (!options.multiline) {
    editorEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault()
    })
  }

  if (options.multiline) {
    editorEl.style.minHeight = '6em'
  }

  // Insert toolbar into DOM on focus, remove on blur — so [title="Bold"] only exists for active editor
  editorEl.addEventListener('focus', () => {
    if (!editorWrapper.contains(toolbar)) {
      editorWrapper.insertBefore(toolbar, editorEl)
    }
    activeEditorEl = editorEl
  })
  editorEl.addEventListener('blur', (e) => {
    // Keep toolbar if focus moved to a toolbar button (mousedown:preventDefault keeps focus on editor anyway)
    if (toolbar.contains(e.relatedTarget)) return
    toolbar.remove()
  })

  // Forward clicks on wrapper padding/border area to the editor so it receives native focus
  editorWrapper.addEventListener('mousedown', (e) => {
    if (e.target === editorWrapper) {
      e.preventDefault()
      editorEl.focus()
    }
  })

  editorWrapper.appendChild(editorEl)
  wrapper.appendChild(editorWrapper)
  container.appendChild(wrapper)

  return {
    update(newValue, newExtraProps) {
      if (document.activeElement !== editorEl) {
        const v = newValue ?? options.default ?? ''
        if (options.multiline && v && !v.includes('<p')) {
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
      allowHeadings: false,
      default: '',
      ...options,
    },
    extraProps(data) {
      return {
        backgroundColor: colorToProperty(
          options.backgroundColor && data[options.backgroundColor]
        ),
        textColor: colorToProperty(
          options.textColor && data[options.textColor]
        ),
        defaultAlign: options.defaultAlign ? data[options.defaultAlign] : undefined,
      }
    },
    mount,
    ...defaultFieldProperties(),
  }
}
