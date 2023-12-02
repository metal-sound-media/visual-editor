# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run via Docker:

```bash
docker-compose up editor                              # Dev server (Vite localhost:3000 + PHP localhost:8000)
docker-compose run --rm editor npm run build          # vite build && copy package.json to dist/
docker-compose run --rm editor npm run format         # Prettier on src/**/*.{js,ts}
docker-compose run --rm editor npm run test           # Unit + E2E (full suite)
docker-compose run --rm editor npm run test:unit      # Vitest only (fast)
docker-compose run --rm editor npm run test:e2e       # Cypress headless
docker-compose run --rm editor npm run test:e2e:watch # Cypress interactive UI
```

## Architecture

This is a **zero-dependency visual page editor** shipped as a Web Component (`<visual-editor>`). No React, Vue, or framework — pure vanilla JS with ES modules.

### Data flow

```
JSON array (external) → store.setData() → store (single source of truth) → Sidebar (form) + Preview (iframe)
                                                                                 ↓
                                                                          store.dispatchEvent('change') → JSON out
```

Each block instance is an object `{ _name, _id, ...fieldValues }`. `_id` is internal and stripped from serialized output.

### Key files

- **`src/VisualEditor.js`** — Defines the custom element, exposes the public API (`registerComponent`, `registerTemplate`, `registerButton`), injects CSS, bridges attribute changes to store.
- **`src/store.js`** — Pub/Sub state manager. Call `store.on('data', fn)` for subscriptions, `store.set({})` / `store.updateData(value, path)` for mutations.
- **`src/fields/index.js`** — `defineField()` creates a field factory; `mountFields()` mounts/unmounts field DOM with conditional rendering support (`.when()`).
- **`src/functions/object.js`** — `deepSet` / `deepGet` for immutable nested updates; `indexify` adds `_id` keys recursively; `stringify` serializes data (strips `_id`).
- **`src/components/Sidebar.js`** — Renders block list + active block's form; uses SortableJS for drag-and-drop reordering.

### Defining a block

Blocks are factory functions returning a definition:
```js
export function myBlock() {
  return {
    title: 'My Block',
    category: 'Content',
    fields: [
      Text('heading', { label: 'Heading' }),
      Select('align', { label: 'Alignment', options: ['left', 'center', 'right'] }),
    ],
  }
}
```
Register via `editor.registerComponent('my-block', myBlock())`.

### Defining a field

Fields use `defineField()`, which wraps a `mount()` lifecycle:
```js
export const MyField = defineField({
  defaultOptions: { default: '' },
  mount(container, value, onChange, options) {
    const el = document.createElement('input')
    el.value = value ?? options.default
    el.addEventListener('input', e => onChange(e.target.value))
    container.appendChild(el)
    return { update(v) { el.value = v ?? '' } }
  },
})
```
`mount()` must return `{ update(newValue) }` — called whenever store data changes.

### Conditional fields (`.when()`)

```js
Checkbox('showCaption', { label: 'Show caption' }),
Text('caption', { label: 'Caption' }).when('showCaption', true),
// Or with a predicate:
Text('extra').when('count', v => v > 2),
```

`mountFields()` calls `field.shouldRender(data)` on each store update to mount/unmount field DOM.

### i18n

`src/langs/en.js` and `fr.js` export translation maps. Set language on the class before mounting:
```js
VisualEditor.setLang('fr')
```
