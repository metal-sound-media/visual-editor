import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function youtubeVideo() {
  return {
    category: t('categoryVideo'),
    title: t('youtubeVideoTitle'),
    fields: [
      Text('url', {
        label: t('videoUrl'),
        multiline: false,
        default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
    ],
  }
}

export function youtubePlaylist() {
  return {
    category: t('categoryVideo'),
    title: t('youtubePlaylistTitle'),
    fields: [
      Text('url', {
        label: t('videoUrl'),
        multiline: false,
        default: 'https://www.youtube.com/playlist?list=PLPYc31xNjTtkqoeTmsDXc5BP4d_LH9cKv',
      }),
    ],
  }
}
