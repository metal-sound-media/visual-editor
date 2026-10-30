import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function tiktokVideo() {
  return {
    category: t('categorySocial'),
    title: t('tiktokTitle'),
    fields: [
      Text('url', {
        label: t('videoUrl'),
        multiline: false,
        default: '',
      }),
    ],
  }
}
