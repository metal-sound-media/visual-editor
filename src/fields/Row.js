import { defaultFieldProperties } from './index.js'
import { mountFields } from './index.js'

export function Row(fields, options = {}) {
  return {
    group: true,
    fields,
    options: {
      columns: `repeat(${fields.length}, 1fr)`,
      ...options,
    },
    mountGroup(container, data, onUpdate, opts) {
      const row = document.createElement('div')
      row.className = 've-row'
      row.style.gridTemplateColumns = opts.columns ?? `repeat(${fields.length}, 1fr)`

      const instance = mountFields(row, fields, data, onUpdate)
      container.appendChild(row)

      return {
        update(newData) {
          instance.update(newData)
        },
      }
    },
    ...defaultFieldProperties(),
  }
}
