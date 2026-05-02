import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function button() {
  return {
    category: t('categoryButton'),
    title: t('buttonTitle'),
    fields: [
      Text('url', {
        label: t('buttonUrl'),
        multiline: false,
        default: 'https://example.com',
      }),
      Text('label', {
        label: t('buttonLabel'),
        multiline: false,
        collapsed: 'label',
        default: 'Button',
      }),
    ],
  }
}
