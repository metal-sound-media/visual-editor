import { Select } from '../fields/Select.js'
import { Text } from '../fields/Text.js'
import { t } from '../functions/i18n.js'

function sizeSelect() {
  return Select('size', {
    label: t('playerSize'),
    default: 352,
    options: [
      { value: 352, label: t('playerSizeNormal') },
      { value: 152, label: t('playerSizeCompact') },
    ],
  })
}

function themeSelect() {
  return Select('theme', {
    label: t('playerTheme'),
    default: 0,
    options: [
      { value: 0, label: t('playerThemeDark') },
      { value: 1, label: t('playerThemeColored') },
    ],
  })
}

export function spotifyPlaylist() {
  return {
    category: t('categoryMusic'),
    title: t('spotifyPlaylistTitle'),
    fields: [
      Text('url', {
        label: t('playlistUrl'),
        multiline: false,
        default: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO0UHpXG',
      }),
      sizeSelect(),
      themeSelect(),
    ],
  }
}

export function spotifyTrack() {
  return {
    category: t('categoryMusic'),
    title: t('spotifyTrackTitle'),
    fields: [
      Text('url', {
        label: t('trackUrl'),
        multiline: false,
        default: 'https://open.spotify.com/track/6EPRKhUOdiFSQwGBRBbvsZ',
      }),
      sizeSelect(),
      themeSelect(),
    ],
  }
}

export function spotifyPodcast() {
  return {
    category: t('categoryMusic'),
    title: t('spotifyPodcastTitle'),
    fields: [
      Text('url', {
        label: t('podcastUrl'),
        multiline: false,
        default: 'https://open.spotify.com/episode/52xoPbp5Iz8V5uUfsFyQhK',
      }),
      sizeSelect(),
      themeSelect(),
    ],
  }
}

export function spotifyAlbum() {
  return {
    category: t('categoryMusic'),
    title: t('spotifyAlbumTitle'),
    fields: [
      Text('url', {
        label: t('albumUrl'),
        multiline: false,
        default: 'https://open.spotify.com/album/3rxF05Aux0QTrN533Kjc91',
      }),
      sizeSelect(),
      themeSelect(),
    ],
  }
}

export function spotifyArtist() {
  return {
    category: t('categoryMusic'),
    title: t('spotifyArtistTitle'),
    fields: [
      Text('url', {
        label: t('artistUrl'),
        multiline: false,
        default: 'https://open.spotify.com/artist/1DFr97A9HnbV3SKTJFu62M',
      }),
      sizeSelect(),
      themeSelect(),
    ],
  }
}
