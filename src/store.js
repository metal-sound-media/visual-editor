import { deepSet, indexify, stringifyFields } from './functions/object.js'
import { insertItem, moveItem } from './functions/array.js'
import { uniqId } from './functions/string.js'
import { fillDefaults } from './functions/fields.js'
import { t } from './functions/i18n.js'

export const InsertPosition = { Start: 'start', End: 'end' }

export const Events = {
  Templates: 'templates',
  Components: 'components',
  Change: 'change',
  RemoveItem: 'removeitem',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

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
    device: devices[devices.length - 1] ?? null,
    previousData: data,
    rollbackMessage: null,
    addBlockIndex: null,
    focusIndex: null,
    sidebarMode: 'blocs',
    sidebarCollapsed: false,
    sidebarWidth: clamp(
      savedWidth ? parseInt(savedWidth, 10) : 33,
      0,
      typeof window !== 'undefined' ? window.innerWidth - 375 : 600
    ),
  }

  const listeners = {}

  function on(key, fn) {
    if (!listeners[key]) listeners[key] = []
    listeners[key].push(fn)
    return () => {
      listeners[key] = listeners[key].filter((f) => f !== fn)
    }
  }

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

    setSidebarWidth(width) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('veSidebarWidth', width.toString())
      }
      set({ sidebarWidth: width })
    },

    updateData(newData, path) {
      set((s) => ({ data: deepSet(s.data, path, newData) }))
      dispatchEvent(Events.Change)
    },

    moveBloc(id, direction) {
      set(({ data }) => {
        const currentIndex = data.findIndex((d) => d._id === id)
        return { data: moveItem(data, currentIndex, currentIndex + direction) }
      })
    },

    removeBloc(id) {
      const confirm = () => {
        set(({ data }) => ({
          previousData: data,
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

    rollback() {
      set(({ previousData }) => ({
        previousData: [],
        rollbackMessage: null,
        data: previousData,
      }))
      dispatchEvent(Events.Change)
    },

    voidRollback() {
      set({ rollbackMessage: null, previousData: [] })
    },

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
        focusIndex: newData._id,
      }))
      dispatchEvent(Events.Change)
      return newData
    },

    setData(newData) {
      set({
        data: indexify(newData),
        focusIndex: null,
      })
      dispatchEvent(Events.Change)
    },

    setDataFromOutside(newData) {
      set({ data: indexify(newData) })
    },

    setFocusIndex(id) {
      set({ focusIndex: id })
    },

    setAddBlockIndex(index) {
      if (index === undefined) {
        const s = state
        const resolvedIndex =
          s.insertPosition === InsertPosition.Start ? 0 : s.data.length
        store.setAddBlockIndex(resolvedIndex)
        return
      }
      if (typeof index === 'string') {
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

    toggleSidebarMode() {
      set(({ sidebarMode }) => ({
        sidebarMode: sidebarMode === 'blocs' ? 'templates' : 'blocs',
      }))
    },

    getValue() {
      return stringifyFields(state.data)
    },

    dispatchEvent,
  }

  return store
}
