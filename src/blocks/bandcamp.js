import { Select } from '../fields/Select.js'
import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function bandcamp() {
  return {
    category: t('categoryMusic'),
    title: t('bandcampTitle'),
    fields: [
      Text('id', {
        label: t('bandcampId'),
        multiline: false,
        help: t('bandcampHelp'),
        default: '845600395',
      }),
      Select('type', {
        label: t('bandcampType'),
        default: 'track',
        options: [
          { value: 'track', label: t('bandcampTypeTrack') },
          { value: 'album', label: t('bandcampTypeAlbum') },
        ],
      }),
      Select('size', {
        label: t('playerSize'),
        default: 'small',
        options: [
          { value: 'small', label: t('playerSizeSmall') },
          { value: 'large_large-artwork', label: t('playerSizeLargeBig') },
          { value: 'large_small-artwork', label: t('playerSizeLargeSmall') },
        ],
      }),
      Select('theme', {
        label: t('playerTheme'),
        default: '333333',
        options: [
          { value: '333333', label: t('playerThemeDark') },
          { value: 'ffffff', label: t('playerThemeLight') },
        ],
      }),
    ],
  }
}
