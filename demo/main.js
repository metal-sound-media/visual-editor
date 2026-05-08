import { registerBlocks } from '../src/blocks/index.js'
import {
  Alignment,
  Checkbox,
  Color,
  DatePicker,
  EN,
  HTMLText,
  ImageUrl,
  Number as NumberField,
  Range,
  Repeater,
  Row,
  Select,
  Tabs,
  Text,
  TextAlign,
  VisualEditor,
} from '../src/VisualEditor'

const Colors = [
  '--bs-blue', '--bs-indigo', '--bs-purple', '--bs-pink', '--bs-red',
  '--bs-orange', '--bs-yellow', '--bs-green', '--bs-teal', '--bs-cyan',
  '--bs-white', '--bs-gray', '--bs-gray-dark', '--bs-primary', '--bs-secondary',
  '--bs-success', '--bs-info', '--bs-warning', '--bs-danger', '--bs-light', '--bs-dark',
]

const ImageField = (name = 'image', label = 'Image') =>
  ImageUrl(name, { label })

const ButtonField = () =>
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
  ])

const ColorField = (name, label) => Color(name, { label, colors: Colors })

const TitleField = (name = 'title', label = 'Titre') =>
  Row(
    [
      HTMLText(name, {
        default: 'Lorem ipsum dolor sit amet',
        label,
        multiline: false,
        colors: Colors,
      }),
      TextAlign(name + 'Align', { label: 'Alignment' }),
    ],
    { columns: '1fr max-content' }
  )

const ContentField = (name = 'content', label = 'Description') =>
  HTMLText(name, {
    label,
    default: '<p>Minim veniam, quis nostrud exercitation ullamco laboris.</p>',
    multiline: true,
    colors: Colors,
  })

const ButtonsField = () =>
  Repeater('buttons', {
    label: 'Boutons',
    addLabel: 'Add a button',
    fields: [ButtonField()],
  })

const Style = () => [
  Row(
    [
      ColorField('backgroundColor', 'Bg'),
      ColorField('textColor', 'Text'),
      ImageField('background', 'Background'),
      ImageField('backgroundMobile', 'Background (mobile)'),
    ],
    { columns: '50px 50px 1fr 1fr' }
  ),
  Range('padding', { label: 'Padding vertical', default: 3 }),
]

const WithStyles = (contentFields, styleFields = []) => [
  Tabs(
    { label: 'Content', fields: contentFields },
    { label: 'Appearance', fields: [...styleFields, ...Style()] }
  ),
]

const editor = new VisualEditor({
  lang: EN,
  postMessagePreview: false,
  devices: [
    { name: 'Mobile', width: 390, height: 820, icon: 'mobile' },
    { name: 'Tablet', width: 1180, height: 820, icon: 'tablet' },
    { name: 'Desktop', width: '100%', height: '100%', icon: 'desktop' },
  ],
})

registerBlocks(editor)

editor.setBrowse((currentUrl) => {
  console.log('[VisualEditor] onBrowse called', { currentUrl })
  alert('onBrowse has been triggered — check the browser console for details.')
  return Promise.resolve(null)
})

editor.defineElement()

document.querySelector('#postmessagepreview')?.addEventListener('click', (e) => {
  VisualEditor.postMessagePreview = !VisualEditor.postMessagePreview
  e.currentTarget.querySelector('span').innerText =
    VisualEditor.postMessagePreview ? 'on' : 'off'
  document.querySelectorAll('visual-editor').forEach((el) => {
    el.setAttribute(
      'preview',
      VisualEditor.postMessagePreview
        ? 'http://localhost:3000/demo/csr-preview.html'
        : 'http://localhost:3000/preview'
    )
  })
})
