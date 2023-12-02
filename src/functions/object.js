function keys(ks) {
  return Array.isArray(ks) ? ks : ks.split('.')
}

function deepGet(o, kp, d = null) {
  return keys(kp).reduce(
    (o, k) => (o && (Array.isArray(o) ? o[parseInt(k)] : o[k])) || d,
    o
  )
}

export function deepSet(object, keyPath, value) {
  if (!keyPath) {
    return value
  }
  return keys(keyPath).reduceRight((acc, key, i, keys) => {
    const original = deepGet(object, keys.slice(0, i))
    if (Array.isArray(original)) {
      return original.map((v, k) => {
        if (k.toString() === key) {
          return acc
        }
        return v
      })
    } else {
      return Object.assign({}, original, { [key]: acc })
    }
  }, value)
}

export function stringifyFields(source) {
  return JSON.stringify(
    source,
    (key, value) => {
      if (key === '_id') {
        return undefined
      }
      return value
    },
    2
  )
}

export function indexify(object) {
  if (Array.isArray(object)) {
    const prefix = Math.round(Date.now() / 1000)
    object.forEach((v, k) => {
      if (typeof v === 'object') {
        if (!('_id' in v)) {
          v._id = prefix + k.toString()
        }
        indexify(v)
      }
    })
  } else if (typeof object === 'object' && object !== null) {
    Object.keys(object).forEach((key) => indexify(object[key]))
  }
  return object
}

export function cast(value, expectedValue) {
  if (typeof expectedValue === 'boolean') {
    return !!value
  }
  if (typeof expectedValue === 'string') {
    if (typeof value === 'boolean') {
      return ''
    }
    return '' + (value ?? '')
  }
  throw new Error(`Cannot cast ${typeof value} into a ${typeof expectedValue}`)
}
