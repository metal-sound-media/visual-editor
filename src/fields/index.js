import { cast } from '../functions/object.js'

/**
 * Base mixin mixed into every field definition.
 * `conditions` is an array of predicate functions evaluated against the
 * current block data. `.when()` returns a *new object* (spread + extra
 * condition) so it is safe to chain and never mutates the original definition.
 */
export function defaultFieldProperties() {
  return {
    conditions: [],
    shouldRender(data) {
      return this.conditions.every((cond) => cond(data))
    },
    /**
     * Add a visibility condition.
     * `expectedValue` can be a literal (compared after type-casting) or a
     * predicate function `(fieldValue) => boolean` for dynamic checks.
     */
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

// Factory for simple (non-group) fields such as Text, Select, Checkbox.
// Returns a function `(name, options) => fieldDefinition`.
export function defineField({ defaultOptions = {}, mount }) {
  return (name, options = {}) => ({
    name,
    group: false,
    options: { ...defaultOptions, ...options },
    mount,
    ...defaultFieldProperties(),
  })
}

// Factory for group fields (Row, Tabs, Repeater) that contain child fields.
// Group fields receive the full block data object instead of a single value.
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
 * Mount a list of field definitions into `container` and return an
 * `{ update(newData) }` handle.
 *
 * Each field gets a DOM comment anchor inserted first, then a wrapper div
 * is inserted after that anchor when the field is visible. The anchor acts
 * as a stable position marker so the wrapper can be removed and re-added
 * without losing its place in the DOM.
 *
 * Fields with failing .when() conditions are NOT inserted into the DOM
 * so Cypress `should('not.exist')` assertions work correctly.
 */
export function mountFields(container, fields, data, onUpdate) {
  // Each slot tracks one field's lifecycle: anchor (permanent), wrapper
  // (present only while visible), and instance (returned by mount/mountGroup).
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
      // Group fields (Row, Tabs, Repeater) need the full block data to resolve
      // conditions on their child fields and to read sibling field values.
      slot.instance = field.mountGroup(
        slot.wrapper,
        currentData,
        onUpdate,
        field.options
      )
    } else {
      // Scalar fields only receive their own value plus optional extra props
      // (e.g. HTMLText reads backgroundColor/textColor from the block data).
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

  // Initial render: only mount fields whose conditions pass with the current data.
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
          // Condition just became true — mount the field for the first time.
          mountSlot(slot, newData)
        } else if (!shouldShow && slot.wrapper) {
          // Condition just became false — remove the field from the DOM.
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
