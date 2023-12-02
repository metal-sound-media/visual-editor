import { cast } from '../functions/object.js'

export function defaultFieldProperties() {
  return {
    conditions: [],
    shouldRender(data) {
      return this.conditions.every((cond) => cond(data))
    },
    when(fieldName, expectedValue = true) {
      return {
        ...this,
        conditions: [
          ...this.conditions,
          (data) => {
            if (typeof expectedValue === 'function') {
              return expectedValue(data[fieldName])
            }
            return cast(data[fieldName], expectedValue) === expectedValue
          },
        ],
      }
    },
  }
}

export function defineField({ defaultOptions = {}, mount }) {
  return (name, options = {}) => ({
    name,
    group: false,
    options: { ...defaultOptions, ...options },
    mount,
    ...defaultFieldProperties(),
  })
}

export function defineFieldGroup({ defaultOptions = {}, mountGroup }) {
  return (fields, options = {}) => ({
    group: true,
    fields,
    options: { ...defaultOptions, ...options },
    mountGroup,
    ...defaultFieldProperties(),
  })
}

/**
 * Render fields into a container.
 * Fields with failing .when() conditions are NOT inserted into the DOM
 * so Cypress `should('not.exist')` assertions work correctly.
 */
export function mountFields(container, fields, data, onUpdate) {
  // Each slot tracks one field's lifecycle in the DOM
  const slots = fields.map((field) => {
    const anchor = document.createComment(
      field.name ? `field:${field.name}` : 'field-group'
    )
    container.appendChild(anchor)
    return { field, anchor, wrapper: null, instance: null }
  })

  function mountSlot(slot, currentData) {
    if (slot.wrapper) return
    slot.wrapper = document.createElement('div')
    slot.wrapper.className = 've-field-wrapper'
    slot.anchor.after(slot.wrapper)

    const { field } = slot
    if (field.group) {
      slot.instance = field.mountGroup(
        slot.wrapper,
        currentData,
        onUpdate,
        field.options
      )
    } else {
      const value = field.name != null ? currentData[field.name] : undefined
      const extraProps = field.extraProps ? field.extraProps(currentData) : {}
      slot.instance = field.mount(
        slot.wrapper,
        value,
        (newValue) => onUpdate(newValue, field.name),
        field.options,
        extraProps
      )
    }
  }

  function unmountSlot(slot) {
    if (!slot.wrapper) return
    slot.wrapper.remove()
    slot.wrapper = null
    slot.instance = null
  }

  // Initial render
  for (const slot of slots) {
    if (slot.field.shouldRender(data)) {
      mountSlot(slot, data)
    }
  }

  return {
    update(newData) {
      for (const slot of slots) {
        const shouldShow = slot.field.shouldRender(newData)
        if (shouldShow && !slot.wrapper) {
          mountSlot(slot, newData)
        } else if (!shouldShow && slot.wrapper) {
          unmountSlot(slot)
        } else if (shouldShow && slot.wrapper && slot.instance?.update) {
          if (slot.field.group) {
            // Group fields (Row, Tabs, Repeater) receive the full block data
            slot.instance.update(newData)
          } else {
            const value =
              slot.field.name != null ? newData[slot.field.name] : undefined
            const extraProps = slot.field.extraProps
              ? slot.field.extraProps(newData)
              : {}
            slot.instance.update(value, extraProps)
          }
        }
      }
    },
  }
}
