export { simpleText } from './texts.js'
export { button } from './button.js'
export { simpleImage, galleryImages } from './images.js'
export { youtubeVideo, youtubePlaylist } from './youtube.js'
export { dailymotion } from './dailymotion.js'
export { spotifyPlaylist, spotifyTrack, spotifyPodcast, spotifyAlbum, spotifyArtist } from './spotify.js'
export { soundcloudTrack, soundcloudPlaylist } from './soundcloud.js'
export { bandcamp } from './bandcamp.js'
export { tidalPlaylist, tidalTrack, tidalAlbum } from './tidal.js'

import { simpleText } from './texts.js'
import { button } from './button.js'
import { simpleImage, galleryImages } from './images.js'
import { youtubeVideo, youtubePlaylist } from './youtube.js'
import { dailymotion } from './dailymotion.js'
import { spotifyPlaylist, spotifyTrack, spotifyPodcast, spotifyAlbum, spotifyArtist } from './spotify.js'
import { soundcloudTrack, soundcloudPlaylist } from './soundcloud.js'
import { bandcamp } from './bandcamp.js'
import { tidalPlaylist, tidalTrack, tidalAlbum } from './tidal.js'
import { BLOCK_ICONS } from '../icons/blocks.js'

export function registerBlocks(editor) {
  const reg = (name, def) =>
    editor.registerComponent(name, BLOCK_ICONS[name] ? { ...def, icon: BLOCK_ICONS[name] } : def)

  reg('simple-text', simpleText())
  reg('button', button())
  reg('simple-image', simpleImage())
  reg('gallery-images', galleryImages())
  reg('youtube', youtubeVideo())
  reg('youtube-playlist', youtubePlaylist())
  reg('dailymotion', dailymotion())
  reg('spotify-playlist', spotifyPlaylist())
  reg('spotify-track', spotifyTrack())
  reg('spotify-podcast', spotifyPodcast())
  reg('spotify-album', spotifyAlbum())
  reg('spotify-artist', spotifyArtist())
  reg('soundcloud-track', soundcloudTrack())
  reg('soundcloud-playlist', soundcloudPlaylist())
  reg('bandcamp-track', bandcamp())
  reg('tidal-playlist', tidalPlaylist())
  reg('tidal-track', tidalTrack())
  reg('tidal-album', tidalAlbum())
}
