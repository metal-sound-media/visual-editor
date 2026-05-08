import { Translations as EN } from './langs/en.js'
import { indexify, stringifyFields } from './functions/object.js'
import { fillDefaults } from './functions/fields.js'
import { createStore, InsertPosition } from './store.js'
import { createSidebar } from './components/Sidebar.js'
import { createHeader } from './components/Header.js'
import { createPreview } from './components/Preview.js'
import { createBlocSelector } from './components/BlocSelector.js'
import { createRollbackMessage } from './components/RollbackMessage.js'
import { cssText } from './styles.js'
import { setBrowseCallback } from './functions/browse.js'

// Inject CSS once into document head
let cssInjected = false
function injectCss() {
  if (cssInjected || typeof document === 'undefined') return
  cssInjected = true
  const style = document.createElement('style')
  style.id = 've-styles'
  style.textContent = cssText
  document.head.appendChild(style)
}

const defaultDevices = [
  { name: 'Mobile', width: 390, height: '100%', icon: 'mobile' },
  { name: 'Desktop', width: '100%', height: '100%', icon: 'desktop' },
]

// Module-level registries shared across ALL editor instances on the page.
// This means components/templates/buttons registered once are available to
// every <visual-editor> element, regardless of when it is mounted.
const _components = {}
const _templates = []
const _actions = []

export class VisualEditor {
  static i18n = EN
  static postMessagePreview = false
  static devices = defaultDevices

  constructor(options = {}) {
    if (options.lang) VisualEditor.i18n = options.lang
    if (options.devices) VisualEditor.devices = options.devices
    if (options.postMessagePreview !== undefined) {
      VisualEditor.postMessagePreview = options.postMessagePreview
    }
  }

  // `label` defaults to 'title' so the block heading shows definition.title
  // unless the caller explicitly maps a different field name.
  registerComponent(name, definition) {
    _components[name] = { label: 'title', ...definition }
  }

  registerTemplate(template) {
    _templates.push(template)
  }

  registerButton(action) {
    _actions.push(action)
  }

  setBrowse(fn) {
    setBrowseCallback(fn)
  }

  defineElement(elementName = 'visual-editor') {
    if (customElements.get(elementName)) return
    injectCss()

    class VisualEditorElement extends HTMLElement {
      constructor() {
        super()
        this._store = null
        this._layoutEl = null
        this._textareaEl = null
        this._cleanupFns = []
      }

      static get observedAttributes() {
        return ['hidden', 'value', 'preview']
      }

      get value() {
        if (this._store) return this._store.getValue()
        // Before mount the store doesn't exist yet; fall back to the attribute.
        return this.getAttribute('value') ?? '[]'
      }

      get valueAsArray() {
        return this._store ? this._store.get().data : []
      }

      /**
       * The setter accepts three shapes so callers can use whichever is most
       * convenient:
       *   - string  → JSON to parse (same format as the `value` attribute)
       *   - function → updater `(currentArray) => newArray`, useful for
       *               merging or patching data without reading it first
       *   - array/object → raw data that is indexified and set directly
       *
       * If called before the element is connected (no store yet), the value
       * is written to the attribute so it gets picked up at mount time.
       */
      set value(v) {
        if (!this._store) {
          if (!v) {
            this.removeAttribute('value')
          } else {
            this.setAttribute(
              'value',
              typeof v === 'string' ? v : JSON.stringify(v)
            )
          }
          return
        }
        if (typeof v === 'string') {
          this._store.setDataFromOutside(this._parseValue(v))
          return
        }
        if (typeof v === 'function') {
          this._store.setDataFromOutside(v(this._store.get().data))
          return
        }
        this._store.setDataFromOutside(indexify(Array.isArray(v) ? v : [v]))
      }

      connectedCallback() {
        this._mount()
      }

      disconnectedCallback() {
        this._destroy()
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (!this._store) return
        // Attribute changes that arrive before mount are ignored here because
        // `_mount()` reads the attributes directly when it runs.
        if (name === 'value' && newValue !== null) {
          this._store.setDataFromOutside(this._parseValue(newValue))
          return
        }
        if (name === 'hidden') {
          // `hidden` only toggles visibility; it never rebuilds the store.
          this._updateVisibility()
          return
        }
      }

      /**
       * Parse a JSON string into the internal block array.
       * `fillDefaults` is called per block so that any fields added to a
       * component definition *after* data was saved still receive their
       * default values instead of being undefined.
       */
      _parseValue(valueStr) {
        if (!valueStr) return []
        try {
          const json = JSON.parse(valueStr)
          return indexify(Array.isArray(json) ? json : [json]).map((item) => {
            return fillDefaults(item, _components[item._name]?.fields ?? [])
          })
        } catch (e) {
          console.error('Cannot parse editor value', valueStr, e)
          return []
        }
      }

      _mount() {
        const data = this._parseValue(this.getAttribute('value'))
        const hiddenCategories =
          this.getAttribute('hidden-categories')?.split(';') ?? []
        const previewUrl = this.getAttribute('preview') ?? ''
        const iconsUrl = this.getAttribute('iconsUrl') ?? '/[name].svg'
        const name = this.getAttribute('name') ?? ''
        const insertPosition =
          this.getAttribute('insertPosition') ?? InsertPosition.End

        this._store = createStore({
          data,
          definitions: _components,
          hiddenCategories,
          rootElement: this,
          templates: [..._templates],
          insertPosition,
          devices: VisualEditor.devices,
          actions: [..._actions],
        })

        // Root wrapper
        const root = document.createElement('div')
        root.className = 've-root'

        // Layout
        const layout = document.createElement('div')
        layout.className = 've-layout'
        this._layoutEl = layout

        // Header (device selector)
        const header = createHeader(this._store)
        layout.appendChild(header)

        // Sidebar
        const sidebar = createSidebar(this._store, {
          onClose: () => {
            this.dispatchEvent(new Event('close'))
          },
        })
        layout.appendChild(sidebar)

        // Preview
        if (previewUrl) {
          const preview = createPreview(this._store, { previewUrl })
          layout.appendChild(preview)
        }

        // Resize bar (appended inside sidebar)
        this._createResizeBar(sidebar)

        // Bloc selector modal
        const blocSelector = createBlocSelector(this._store, { iconsUrl })
        layout.appendChild(blocSelector)

        // Rollback message — mounted on body to avoid fixed-position containing-block issues
        const rollback = createRollbackMessage(this._store)
        root.appendChild(rollback)

        root.appendChild(layout)

        // Hidden textarea for form submission
        const textarea = document.createElement('textarea')
        textarea.hidden = true
        textarea.name = name
        textarea.value = this._store.getValue()
        this._textareaEl = textarea
        root.appendChild(textarea)

        this.appendChild(root)

        // Keep textarea in sync
        const unsub = this._store.on('data', () => {
          if (this._textareaEl) {
            this._textareaEl.value = this._store.getValue()
          }
        })
        this._cleanupFns.push(unsub)

        // Stop change/close events from bubbling past the element boundary
        const stopProp = (e) => {
          if (['change', 'close'].includes(e.type)) e.stopPropagation()
        }
        root.addEventListener('change', stopProp)
        root.addEventListener('close', stopProp)
        this._cleanupFns.push(() => {
          root.removeEventListener('change', stopProp)
          root.removeEventListener('close', stopProp)
        })

        this._updateVisibility()
      }

      _destroy() {
        for (const fn of this._cleanupFns) fn()
        this._cleanupFns = []
        this._store = null
        this._layoutEl = null
        this._textareaEl = null
        this.innerHTML = ''
      }

      _updateVisibility() {
        if (!this._layoutEl) return
        const isHidden = this.getAttribute('hidden') !== null
        this._layoutEl.style.display = isHidden ? 'none' : ''
      }

      /**
       * Attach a 6 px invisible drag handle to the right edge of the sidebar.
       * On drag, the pixel delta is converted to a viewport-width percentage
       * so the sidebar width stays proportional if the window is later resized.
       * The resulting vw value is both persisted to localStorage (via
       * setSidebarWidth) and applied immediately as the `--ve-sidebar` CSS
       * variable so the layout updates on every mouse-move frame.
       * `e.preventDefault()` on mousedown prevents text selection while dragging.
       */
      _createResizeBar(sidebarEl) {
        const bar = document.createElement('div')
        bar.className = 've-resize-bar'
        bar.style.cssText =
          'position:absolute;top:0;right:-3px;bottom:0;width:6px;cursor:col-resize;z-index:10'

        let startX = 0
        let startWidth = 0

        const onMouseMove = (e) => {
          const diff = e.clientX - startX
          const newWidth = startWidth + diff
          // Convert px to vw so the sidebar stays the same fraction of the
          // viewport when the window is resized.
          const vwWidth = (newWidth / window.innerWidth) * 100
          this._store.setSidebarWidth(vwWidth)
          this._layoutEl.style.setProperty('--ve-sidebar', `${vwWidth}vw`)
        }

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        bar.addEventListener('mousedown', (e) => {
          startX = e.clientX
          // Read the rendered pixel width at drag start as the baseline.
          startWidth = parseFloat(getComputedStyle(sidebarEl).width)
          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
          e.preventDefault()
        })

        sidebarEl.style.position = 'relative'
        sidebarEl.appendChild(bar)
      }
    }

    customElements.define(elementName, VisualEditorElement)
  }
}

// Re-export field types
export { Text } from './fields/Text.js'
export { Number } from './fields/Number.js'
export { Select } from './fields/Select.js'
export { Checkbox } from './fields/Checkbox.js'
export { Range } from './fields/Range.js'
export { TextAlign, Alignment } from './fields/TextAlign.js'
export { HTMLText } from './fields/HTMLText.js'
export { ImageUrl } from './fields/ImageUrl.js'
export { Color } from './fields/Color.js'
export { Row } from './fields/Row.js'
export { Tabs } from './fields/Tabs.js'
export { Repeater } from './fields/Repeater.js'
export { DatePicker } from './fields/DatePicker.js'

// Re-export i18n
export { Translations as EN } from './langs/en.js'
export { Translations as FR } from './langs/fr.js'

// Re-export field helpers
export { defineField, defineFieldGroup } from './fields/index.js'

// Re-export optional built-in blocks
export {
  registerBlocks,
  simpleText, button, simpleImage, galleryImages,
  youtubeVideo, youtubePlaylist, dailymotion,
  spotifyPlaylist, spotifyTrack, spotifyPodcast, spotifyAlbum, spotifyArtist,
  soundcloudTrack, soundcloudPlaylist,
  bandcamp,
  tidalPlaylist, tidalTrack, tidalAlbum,
} from './blocks/index.js'
