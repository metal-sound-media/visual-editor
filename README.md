# Visual Editor

A framework-agnostic visual page editor built as a Web Component — **no React or other framework required**. Written in vanilla JavaScript.

---

## Getting started

### Installation

```bash
npm install @metalsoundmedia/visual-editor
```

The CSS is bundled directly into the JavaScript — no separate stylesheet to import.

### Using without a build step

All source files use standard ES module syntax with explicit `.js` extensions and no TypeScript — they run directly in any modern browser or asset pipeline without compilation.

**Option 1 — Compiled standalone file** (simplest, single file):

Copy `dist/VisualEditor.standalone.js` to your public assets folder and import it:

```html
<script type="module">
  import { VisualEditor, registerBlocks } from '/assets/VisualEditor.standalone.js'

  const editor = new VisualEditor()
  registerBlocks(editor)
  editor.defineElement()
</script>
```

**Option 2 — Source files directly** (Symfony asset-mapper, or any pipeline that serves `src/` as-is):

Copy the entire `src/` folder to your assets directory, then import `VisualEditor.js` as the entry point:

```js
import { VisualEditor, registerBlocks, FR } from '/assets/visual-editor/VisualEditor.js'

const editor = new VisualEditor({ lang: FR })
registerBlocks(editor)
editor.defineElement()
```

With Symfony asset-mapper, add the `src/` folder to your mapped paths and import from it directly — no `importmap` entry needed for each file since the modules resolve each other via relative paths automatically.

---

### Registering your page components

Start by instantiating the editor and registering your blocks.

```js
import { VisualEditor, Text, HTMLText, Repeater, Row, Select } from '@metalsoundmedia/visual-editor'

const editor = new VisualEditor()

editor.registerComponent('hero', {
  title: 'Hero',
  category: 'Banner',
  fields: [
    Text('title', { label: 'Title', multiline: false }),
    HTMLText('content', { label: 'Content', multiline: true }),
    Repeater('buttons', {
      label: 'Buttons',
      addLabel: 'Add a button',
      fields: [
        Row([
          Text('label', { label: 'Label', default: 'Call to action' }),
          Text('url', { label: 'Link' }),
          Select('type', {
            default: 'primary',
            label: 'Type',
            options: [
              { label: 'Primary', value: 'primary' },
              { label: 'Secondary', value: 'secondary' },
            ],
          }),
        ]),
      ],
    }),
  ],
})

editor.defineElement()
```

### Add the editor to your page

```html
<visual-editor
  hidden
  name="content"
  preview="http://localhost:3000/preview"
  iconsUrl="/assets/editor/[name].svg"
  value="[]"
  insertPosition="start"
></visual-editor>
```

**Attributes:**

| Attribute           | Description                                                     |
|---------------------|-----------------------------------------------------------------|
| `hidden`            | Toggle to show or hide the editor                               |
| `name`              | Name for the hidden textarea (used for form submission)         |
| `preview`           | Endpoint called via POST to render the preview iframe           |
| `iconsUrl`          | Path for component icons (`[name]` is replaced by the block ID) |
| `value`             | Initial value as a JSON array (optional)                        |
| `insertPosition`    | Where new blocks are inserted: `start` or `end` (optional)      |
| `hidden-categories` | Semicolon-separated list of categories to hide (optional)       |

The custom element contains a hidden `<textarea>` with the serialised data — no JavaScript needed on submit.

---

## Available fields

| Field        | Import                        | Description                                               |
|--------------|-------------------------------|-----------------------------------------------------------|
| `Text`       | `Text('name', options)`       | Single-line or multiline text                             |
| `Number`     | `Number('name', options)`     | Numeric input                                             |
| `Select`     | `Select('name', options)`     | Dropdown select                                           |
| `Checkbox`   | `Checkbox('name', options)`   | Boolean toggle                                            |
| `Range`      | `Range('name', options)`      | Slider                                                    |
| `Color`      | `Color('name', options)`      | Color picker from a palette                               |
| `TextAlign`  | `TextAlign('name', options)`  | Horizontal alignment buttons                              |
| `Alignment`  | `Alignment('name', options)`  | Alignment buttons (vertical or horizontal)                |
| `HTMLText`   | `HTMLText('name', options)`   | Rich text editor (contenteditable)                        |
| `ImageUrl`   | `ImageUrl('name', options)`   | Image URL input with optional browse callback (see below) |
| `DatePicker` | `DatePicker('name', options)` | Date picker with calendar                                 |
| `Row`        | `Row(fields, options)`        | Group fields side-by-side in a CSS grid                   |
| `Tabs`       | `Tabs(...tabDefs)`            | Tabbed group of fields                                    |
| `Repeater`   | `Repeater('name', options)`   | Repeatable list of sub-fields                             |

### ImageUrl — browse callback

Pass an `onBrowse` callback to `ImageUrl` to add a button that opens a custom media picker. The callback receives the current URL and must return the selected URL (or `null` to cancel):

```js
ImageUrl('image', {
  label: 'Image',
  onBrowse: async (currentUrl) => {
    // Open your media library, file picker, etc.
    const url = await openMediaPicker(currentUrl)
    return url // return null to cancel
  },
})
```

Pass `onBrowse` directly to the built-in image blocks:

```js
editor.registerComponent('simple-image', simpleImage({
  onBrowse: async (currentUrl) => openMediaPicker(currentUrl),
}))

editor.registerComponent('gallery-images', galleryImages({
  onBrowse: async (currentUrl) => openMediaPicker(currentUrl),
}))
```

Both blocks remain fully usable without the option — omitting it produces the same behaviour as before (text input only, no browse button).

Alternatively, register a single callback at the editor level — it applies to all `ImageUrl` fields that don't have their own `onBrowse` option:

```js
editor.setBrowse(async (currentUrl) => {
  const url = await openMediaPicker(currentUrl)
  return url // return null to cancel
})
```

### Conditional fields

Use `.when(fieldName, value)` to conditionally show a field:

```js
Checkbox('showSubtitle', { label: 'Show subtitle' }),
Text('subtitle', { label: 'Subtitle' }).when('showSubtitle', true),
// Also accepts a function:
Text('extra', { label: 'Extra' }).when('count', (v) => v > 2),
```

---

## Built-in blocks

The package ships with ready-to-use block definitions. Register them all at once or pick individual ones:

```js
import {
  VisualEditor,
  registerBlocks,
  // or individual blocks:
  simpleText, button,
  simpleImage, galleryImages,
  youtubeVideo, youtubePlaylist,
  dailymotion,
  spotifyPlaylist, spotifyTrack, spotifyPodcast, spotifyAlbum, spotifyArtist,
  soundcloudTrack, soundcloudPlaylist,
  bandcamp,
  tidalPlaylist, tidalTrack, tidalAlbum,
} from '@metalsoundmedia/visual-editor'

const editor = new VisualEditor()

// Register all built-in blocks at once:
registerBlocks(editor)

// Or register selectively:
editor.registerComponent('simple-text', simpleText())
editor.registerComponent('youtube', youtubeVideo())
```

| Block                | ID                    | Category | Description                    |
|----------------------|-----------------------|----------|--------------------------------|
| `simpleText`         | `simple-text`         | —        | Rich text block                |
| `button`             | `button`              | Button   | Link button with label and URL |
| `simpleImage`        | `simple-image`        | Image    | Single image with alt text     |
| `galleryImages`      | `gallery-images`      | Image    | Repeatable image gallery       |
| `youtubeVideo`       | `youtube`             | Video    | YouTube video by URL           |
| `youtubePlaylist`    | `youtube-playlist`    | Video    | YouTube playlist by URL        |
| `dailymotion`        | `dailymotion`         | Video    | Dailymotion video by URL       |
| `spotifyPlaylist`    | `spotify-playlist`    | Music    | Spotify playlist embed         |
| `spotifyTrack`       | `spotify-track`       | Music    | Spotify track embed            |
| `spotifyPodcast`     | `spotify-podcast`     | Music    | Spotify podcast embed          |
| `spotifyAlbum`       | `spotify-album`       | Music    | Spotify album embed            |
| `spotifyArtist`      | `spotify-artist`      | Music    | Spotify artist embed           |
| `soundcloudTrack`    | `soundcloud-track`    | Music    | SoundCloud track embed         |
| `soundcloudPlaylist` | `soundcloud-playlist` | Music    | SoundCloud playlist embed      |
| `bandcamp`           | `bandcamp-track`      | Music    | Bandcamp track or album embed  |
| `tidalPlaylist`      | `tidal-playlist`      | Music    | Tidal playlist embed           |
| `tidalTrack`         | `tidal-track`         | Music    | Tidal track embed              |
| `tidalAlbum`         | `tidal-album`         | Music    | Tidal album embed              |

---

## JavaScript API

### `VisualEditor` options

```js
const editor = new VisualEditor({
  lang: FR,                 // Translation object (default: EN)
  postMessagePreview: false, // Use postMessage instead of POST for preview
  devices: [                // Device presets for the responsive header
    { name: 'Mobile', width: 390, height: 820, icon: 'mobile' },
    { name: 'Desktop', width: '100%', height: '100%', icon: 'desktop' },
  ],
})
```

### Methods

```js
editor.registerComponent(name, definition)  // Register a block type
editor.registerTemplate(template)           // Register a template
editor.registerButton(action)               // Add a custom action button
editor.setBrowse(fn)                        // Register a global image browse callback for all ImageUrl fields
editor.defineElement(elementName?)          // Register the custom element (default: 'visual-editor')
```

### Custom element properties

```js
const el = document.querySelector('visual-editor')

el.value           // Get current data as a JSON string
el.valueAsArray    // Get current data as an array
el.value = '[]'    // Set data from a JSON string, array, or updater function
```

### Custom events

| Event        | Description                                                    |
|--------------|----------------------------------------------------------------|
| `change`     | Fired when data changes (carries the new value)                |
| `close`      | Fired when the user clicks the close button                    |
| `removeitem` | Fired before a block is removed (cancellable)                  |
| `components` | Fired when the "Add component" button is clicked (cancellable) |
| `templates`  | Fired when the "Use template" button is clicked (cancellable)  |

```js
el.addEventListener('change', (e) => {
  console.log(e.target.valueAsArray)
})

el.addEventListener('removeitem', (e) => {
  if (!confirm('Delete this block?')) e.preventDefault()
})
```

---

## Translations

```js
import { VisualEditor, EN, FR } from '@metalsoundmedia/visual-editor'

const editor = new VisualEditor({ lang: FR }) // or EN (default)
```

---

## Custom field types

Use `defineField` and `defineFieldGroup` to create reusable custom field types:

```js
import { defineField, defineFieldGroup } from '@metalsoundmedia/visual-editor'

const MyField = defineField({
  defaultOptions: { label: '' },
  mount(container, value, onChange, options) {
    const input = document.createElement('input')
    input.value = value ?? ''
    input.addEventListener('input', () => onChange(input.value))
    container.appendChild(input)
    return { update(v) { input.value = v ?? '' } }
  },
})
```

---

## Data format

```json
[
  {
    "_name": "simple-text",
    "content": "<p>Lorem ipsum dolor sit amet.</p>"
  },
  {
    "_name": "youtube",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    "_name": "gallery-images",
    "images": [
      { "image": "https://picsum.photos/800/600", "alt": "Photo 1" },
      { "image": "https://picsum.photos/800/601", "alt": "Photo 2" }
    ]
  }
]
```

The `_name` key identifies the block type. All other keys are field values.

---

## Development

### Prerequisites

Only Docker is required — no local Node.js or PHP needed.

### Dev server (Vite + PHP)

```bash
docker-compose up editor
# → Vite dev server:   http://localhost:3000
# → PHP preview server: http://localhost:8000
```

### Build

```bash
docker-compose run --rm editor npm run build
# Outputs: dist/VisualEditor.standalone.js (~97 kB gzipped: ~21 kB)
```

### Tests

```bash
# Unit tests only (fast, no browser needed)
docker-compose run --rm editor npm run test:unit

# Full test suite (unit + E2E Cypress)
docker-compose run --rm test
```

The `test` service uses `Dockerfile.ci` which is based on `cypress/base` (Debian + Electron for headless Cypress) with PHP added.

> **Note:** The first time you run the test service, Docker will download the `cypress/base` image (~500 MB). Subsequent runs use the cache.

---

## Preview endpoint

The `preview` attribute must point to an endpoint that accepts a `POST` request with a JSON body (the array of blocks) and returns full HTML. Example with PHP:

```php
<?php
$data = json_decode(file_get_contents('php://input'), true);
// Render your page with $data...
echo $html;
```

The preview is rendered inside an iframe. Your endpoint should return a complete HTML page (with `<!DOCTYPE html>`).

---

## Custom element name

You can use a different element name if `visual-editor` conflicts with something:

```js
editor.defineElement('my-editor')
```

```html
<my-editor name="content" preview="..."></my-editor>
```
