import { ImageUrl } from '../fields/ImageUrl.js'
import { Repeater } from '../fields/Repeater.js'
import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

function imageFields({ onBrowse } = {}) {
  return [
    ImageUrl('image', {
      label: t('imageUrl'),
      default: 'https://picsum.photos/800/600',
      onBrowse,
    }),
    Text('alt', {
      label: t('imageAlt'),
      multiline: false,
      collapsed: 'alt',
    }),
  ]
}

export function simpleImage({ onBrowse } = {}) {
  return {
    category: t('categoryImage'),
    title: t('simpleImageTitle'),
    fields: imageFields({ onBrowse }),
  }
}

export function galleryImages({ onBrowse } = {}) {
  return {
    category: t('categoryImage'),
    title: t('galleryImagesTitle'),
    fields: [
      Repeater('images', {
        label: t('imagesLabel'),
        addLabel: t('imageAddLabel'),
        collapsed: 'alt',
        min: 1,
        fields: imageFields({ onBrowse }),
      }),
    ],
  }
}
