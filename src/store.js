import { deepSet, indexify, stringifyFields } from './functions/object.js'
import { insertItem, moveItem } from './functions/array.js'
import { uniqId } from './functions/string.js'
import { fillDefaults } from './functions/fields.js'
import { t } from './functions/i18n.js'

// Possible positions for newly inserted blocks when no explicit index is given.
export const InsertPosition = { Start: 'start', End: 'end' }

// DOM event names dispatched on the root element so host pages can listen.
export const Events = {
  Templates: 'templates',
  Components: 'components',
  Change: 'change',      // fired after any data mutation
  RemoveItem: 'removeitem',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Creates the single source-of-truth store for one editor instance.
 * Uses a simple pub-sub pattern: call `store.on(key, fn)` to subscribe,
 * `store.set({})` to mutate. Every mutation triggers listeners for each
 * changed key plus a wildcard `'*'` listener that receives the full state.
 */
export function createStore({
  data = [],
  definitions = {},
  hiddenCategories = [],
  rootElement,
  templates = [],
  insertPosition = InsertPosition.End,
  devices = [],
  actions = [],
}) {
  // Restore sidebar width from the previous session; fall back to 33 vw.
  const savedWidth =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('veSidebarWidth')
      : null

  let state = {
    data,
    definitions,
    hiddenCategories,
    rootElement,
    templates,
    insertPosition,
    actions,
    devices,
    // Default to the last device (typically Desktop) so the preview starts wide.
    device: devices[devices.length - 1] ?? null,
    // previousData holds the snapshot before the last destructive operation
    // so `rollback()` can restore it in one swap.
    previousData: data,
    rollbackMessage: null,  // non-null value triggers the rollback toast
    addBlockIndex: null,    // non-null opens the block-picker modal at that position
    focusIndex: null,       // _id of the block that should be scrolled into view
    sidebarMode: 'blocs',   // 'blocs' | 'templates'
    sidebarCollapsed: false,
    // Clamp so the sidebar cannot overlap the minimum preview area (375 px).
    sidebarWidth: clamp(
      savedWidth ? parseInt(savedWidth, 10) : 33,
      0,
      typeof window !== 'undefined' ? window.innerWidth - 375 : 600
    ),
  }

  // Map of key → array of listener functions.
  const listeners = {}

  /**
   * Subscribe to changes on a specific state key (or `'*'` for any change).
   * Returns an unsubscribe function.
   */
  function on(key, fn) {
    if (!listeners[key]) listeners[key] = []
    listeners[key].push(fn)
    return () => {
      listeners[key] = listeners[key].filter((f) => f !== fn)
    }
  }

  /**
   * Fire listeners for each changed key, then fire the wildcard `'*'` listener.
   * Per-key listeners receive (newValue, prevValue); wildcard listeners receive
   * (newState, prevState).
   */
  function notify(changedKeys, prevState) {
    for (const key of changedKeys) {
      if (listeners[key]) {
        listeners[key].forEach((fn) => fn(state[key], prevState[key]))
      }
    }
    if (listeners['*']) {
      listeners['*'].forEach((fn) => fn(state, prevState))
    }
  }

  /**
   * Apply a partial state update. Accepts either an object or a function
   * `(prevState) => partialUpdate`. Only keys whose values actually changed
   * (strict equality) trigger listeners, so unchanged keys produce no noise.
   */
  function set(updater) {
    const prev = state
    const updates = typeof updater === 'function' ? updater(prev) : updater
    state = { ...prev, ...updates }
    const changed = Object.keys(updates).filter((k) => state[k] !== prev[k])
    if (changed.length > 0) notify(changed, prev)
  }

  function get() {
    return state
  }

  function dispatchEvent(name, options = {}) {
    const event = new CustomEvent(name, options)
    state.rootElement.dispatchEvent(event)
    return event
  }

  const store = {
    get,
    set,
    on,

    setDevice(device) {
      set({ device })
    },

    // Persist sidebar width in localStorage so it survives page reloads.
    setSidebarWidth(width) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('veSidebarWidth', width.toString())
      }
      set({ sidebarWidth: width })
    },

    // Update a single field value at `path` (dot-notation) inside the data array.
    updateData(newData, path) {
      set((s) => ({ data: deepSet(s.data, path, newData) }))
      dispatchEvent(Events.Change)
    },

    // Move a block one step up (direction = -1) or down (direction = +1).
    moveBloc(id, direction) {
      set(({ data }) => {
        const currentIndex = data.findIndex((d) => d._id === id)
        return { data: moveItem(data, currentIndex, currentIndex + direction) }
      })
    },

    /**
     * Remove a block by id.
     * A cancelable `RemoveItem` DOM event is dispatched first so host pages
     * can intercept deletion (e.g. show a custom confirmation dialog) by
     * calling `event.preventDefault()`. The event's `detail.confirm()` can
     * then be called manually to proceed. If nothing prevents the event,
     * deletion happens immediately and a rollback snapshot is saved.
     */
    removeBloc(id) {
      const confirm = () => {
        set(({ data }) => ({
          previousData: data,           // snapshot for rollback
          data: data.filter((d) => d._id !== id),
          rollbackMessage: t('deleteItemConfirm'),
        }))
        dispatchEvent(Events.Change)
      }
      const event = dispatchEvent(Events.RemoveItem, {
        cancelable: true,
        detail: { confirm },
      })
      if (event.defaultPrevented) return
      confirm()
    },

    // Swap current data with the previousData snapshot saved before the last
    // destructive operation (removeBloc or setData).
    rollback() {
      set(({ previousData }) => ({
        previousData: [],
        rollbackMessage: null,
        data: previousData,
      }))
      dispatchEvent(Events.Change)
    },

    // Dismiss the rollback toast without undoing anything.
    voidRollback() {
      set({ rollbackMessage: null, previousData: [] })
    },

    /**
     * Insert a new block at `index`.
     * `extraData` can pre-populate field values; if omitted, field defaults
     * from the component definition are used. `indexify` stamps nested objects
     * with `_id` so every repeater item is uniquely addressable.
     */
    insertData(name, index, extraData) {
      if (!extraData) {
        extraData = fillDefaults({}, state.definitions[name]?.fields ?? [])
      }
      const newData = indexify({
        ...extraData,
        _name: name,
        _id: name + uniqId(),
      })
      set((s) => ({
        data: insertItem(s.data, index, newData),
        focusIndex: newData._id,  // auto-scroll to the newly added block
      }))
      dispatchEvent(Events.Change)
      return newData
    },

    // Replace all data (e.g. when applying a template). Clears focus.
    setData(newData) {
      set({
        data: indexify(newData),
        focusIndex: null,
      })
      dispatchEvent(Events.Change)
    },

    /**
     * Update data from an external source (e.g. the `value` attribute).
     * Does NOT dispatch a Change event — the caller already knows about the
     * change, and firing it would cause an infinite attribute-update loop.
     */
    setDataFromOutside(newData) {
      set({ data: indexify(newData) })
    },

    setFocusIndex(id) {
      set({ focusIndex: id })
    },

    /**
     * Open the block-picker modal at the given insertion position.
     * Accepts three shapes:
     *   - undefined  → resolve position from `insertPosition` setting (Start or End)
     *   - string     → find the block with that `_id` and insert after it
     *   - number     → use that index directly
     *
     * Before opening the modal a cancelable `Components` DOM event is fired,
     * allowing host pages to bypass the built-in picker entirely (e.g. open a
     * custom CMS panel). If the event is prevented, the modal stays closed.
     * Pass `null` to close the modal.
     */
    setAddBlockIndex(index) {
      if (index === undefined) {
        const s = state
        const resolvedIndex =
          s.insertPosition === InsertPosition.Start ? 0 : s.data.length
        store.setAddBlockIndex(resolvedIndex)
        return
      }
      if (typeof index === 'string') {
        // Resolve a block ID to its numeric position.
        const pos = state.data.findIndex((v) => v._id === index) ?? 0
        store.setAddBlockIndex(pos)
        return
      }
      if (index !== null) {
        const event = new CustomEvent(Events.Components, {
          cancelable: true,
          detail: {
            index,
            add(name, extraData) {
              store.insertData(name, index, extraData)
              store.setAddBlockIndex(null)
            },
          },
        })
        state.rootElement.dispatchEvent(event)
        if (event.defaultPrevented) return
      }
      set({ addBlockIndex: index })
    },

    // Toggle the sidebar between the block list view and the templates gallery.
    toggleSidebarMode() {
      set(({ sidebarMode }) => ({
        sidebarMode: sidebarMode === 'blocs' ? 'templates' : 'blocs',
      }))
    },

    // Return the current data as a JSON string with `_id` fields stripped.
    getValue() {
      return stringifyFields(state.data)
    },

    dispatchEvent,
  }

  return store
}
