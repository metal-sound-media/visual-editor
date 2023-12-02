import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

export function tidalPlaylist() {
  return {
    category: t('categoryMusic'),
    title: t('tidalPlaylistTitle'),
    fields: [
      Text('url', {
        label: t('playlistUrl'),
        multiline: false,
        default: 'https://tidal.com/playlist/ae263f1b-d55f-4b22-8945-d836db267b1b',
      }),
    ],
  }
}

export function tidalTrack() {
  return {
    category: t('categoryMusic'),
    title: t('tidalTrackTitle'),
    fields: [
      Text('url', {
        label: t('trackUrl'),
        multiline: false,
        default: 'https://tidal.com/track/63888239/u',
      }),
    ],
  }
}

export function tidalAlbum() {
  return {
    category: t('categoryMusic'),
    title: t('tidalAlbumTitle'),
    fields: [
      Text('url', {
        label: t('albumUrl'),
        multiline: false,
        default: 'https://tidal.com/album/63761722/u',
      }),
    ],
  }
}
