import { Select } from '../fields/Select.js'
import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

function styleSelect() {
  return Select('style', {
    label: t('playerStyle'),
    default: 'visual',
    options: [
      { value: 'visual', label: t('playerStyleVisual') },
      { value: 'classic', label: t('playerStyleClassic') },
    ],
  })
}

export function soundcloudTrack() {
  return {
    category: t('categoryMusic'),
    title: t('soundcloudTrackTitle'),
    fields: [
      Text('id', {
        label: t('soundcloudId'),
        multiline: false,
        help: t('soundcloudHelp'),
        default: '671194544',
      }),
      styleSelect(),
    ],
  }
}

export function soundcloudPlaylist() {
  return {
    category: t('categoryMusic'),
    title: t('soundcloudPlaylistTitle'),
    fields: [
      Text('id', {
        label: t('soundcloudId'),
        multiline: false,
        help: t('soundcloudHelp'),
        default: '855262076',
      }),
      styleSelect(),
    ],
  }
}
