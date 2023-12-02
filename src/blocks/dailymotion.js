import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function dailymotion() {
  return {
    category: t('categoryVideo'),
    title: t('dailymotionTitle'),
    fields: [
      Text('url', {
        label: t('videoUrl'),
        multiline: false,
        default: 'https://www.dailymotion.com/video/x3jysmt',
      }),
    ],
  }
}
