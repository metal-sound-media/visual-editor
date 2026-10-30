import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function instagramPost() {
  return {
    category: t('categorySocial'),
    title: t('instagramTitle'),
    fields: [
      Text('url', {
        label: t('postUrl'),
        multiline: false,
        default: 'https://www.instagram.com/p/DXbgfO-DYHg/',
      }),
    ],
  }
}

export function instagramReel() {
  return {
    category: t('categorySocial'),
    title: t('instagramReelTitle'),
    fields: [
      Text('url', {
        label: t('reelUrl'),
        multiline: false,
        default: 'https://www.instagram.com/reel/DSiAuVfjKs0/',
      }),
    ],
  }
}
