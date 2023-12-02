import { HTMLText } from '../fields/HTMLText.js'
import { t } from '../functions/i18n.js'

export function simpleText() {
  return {
    title: t('simpleTextTitle'),
    fields: [
      HTMLText('content', {
        label: t('simpleTextContent'),
        multiline: true,
        allowHeadings: true,
        default: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
      }),
    ],
  }
}
