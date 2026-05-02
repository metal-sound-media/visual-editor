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
  ImageUrl(name, {
    label,
    onBrowse: () => Promise.resolve('https://picsum.photos/425/458'),
  })

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

editor.registerComponent('hero', {
  title: 'Hero',
  fields: WithStyles([TitleField(), ContentField(), ButtonsField()]),
})

editor.registerComponent('pricing', {
  title: 'Pricing',
  category: 'Commerce',
  fields: WithStyles([
    TitleField(),
    ContentField(),
    Repeater('prices', {
      min: 1,
      max: 5,
      collapsed: 'title',
      fields: [
        HTMLText('title', { label: 'Title', default: 'Pro', multiline: false }),
        Text('price', { label: 'Price', default: '15€' }),
        Text('features', { label: 'Features', multiline: true }),
        ButtonField(),
      ],
    }),
  ]),
})

editor.registerComponent('icons-columns', {
  title: 'Icons columns',
  fields: WithStyles([
    Repeater('icons', {
      min: 1,
      max: 5,
      collapsed: 'title',
      fields: [
        Text('title', { label: 'Title', default: 'Featured title' }),
        ContentField(),
      ],
    }),
  ]),
})

editor.registerComponent('demo', {
  title: 'All field',
  fields: [
    DatePicker('date', { label: 'Date' }),
    Text('text', { label: 'Text' }),
    HTMLText('htmltext', { label: 'HTMLText', multiline: false }),
    ContentField('htmltextarea'),
    NumberField('number', { label: 'Number' }),
    Checkbox('checkbox', { label: 'Checkbox' }),
    Checkbox('checkbox1', { label: 'Checkbox 1' }).when('checkbox', true),
    Checkbox('checkbox2', { label: 'Checkbox 2' }).when('checkbox1', (v) => v),
    ImageField(),
    ColorField('color', 'Colors'),
    Range('range', { min: 0, max: 100, label: 'Range' }),
    Select('select', {
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
      ],
      label: 'Select',
    }),
    Alignment('alignment', { vertical: true, label: 'Alignment' }),
    TextAlign('textalign', { label: 'TextAlign' }),
    Row([Text('text1'), Text('text2'), Text('text3')]),
    Tabs(
      { label: 'Content', fields: [Text('text4', { label: 'Content' })] },
      { label: 'Settings', fields: [Text('text5', { label: 'Settings' })] }
    ),
    Repeater('repeater', {
      label: 'Repeater',
      fields: [Text('text1'), Text('text2'), Text('text3')],
    }),
  ],
})

editor.registerComponent('text', {
  title: 'Formatted text',
  fields: [ContentField()],
})

editor.registerTemplate({
  name: 'Template de test',
  image:
    'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.fotolip.com%2Fwp-content%2Fuploads%2F2016%2F05%2FWebsite-Templates-8.jpg&f=1&nofb=1',
  description: 'Template multicolonne',
  data: [
    {
      title: 'Album example',
      titleAlign: 'left',
      content: '<p>Something short and leading about the collection below.</p>',
      buttons: [
        { label: 'Main call to action', url: '#', type: 'primary' },
        { label: 'Secondary action', url: '#', type: 'secondary' },
      ],
      _name: 'hero',
    },
  ],
})

registerBlocks(editor)

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
