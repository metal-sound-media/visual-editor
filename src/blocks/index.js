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

export function registerBlocks(editor) {
  editor.registerComponent('simple-text', simpleText())
  editor.registerComponent('button', button())
  editor.registerComponent('simple-image', simpleImage())
  editor.registerComponent('gallery-images', galleryImages())
  editor.registerComponent('youtube', youtubeVideo())
  editor.registerComponent('youtube-playlist', youtubePlaylist())
  editor.registerComponent('dailymotion', dailymotion())
  editor.registerComponent('spotify-playlist', spotifyPlaylist())
  editor.registerComponent('spotify-track', spotifyTrack())
  editor.registerComponent('spotify-podcast', spotifyPodcast())
  editor.registerComponent('spotify-album', spotifyAlbum())
  editor.registerComponent('spotify-artist', spotifyArtist())
  editor.registerComponent('soundcloud-track', soundcloudTrack())
  editor.registerComponent('soundcloud-playlist', soundcloudPlaylist())
  editor.registerComponent('bandcamp-track', bandcamp())
  editor.registerComponent('tidal-playlist', tidalPlaylist())
  editor.registerComponent('tidal-track', tidalTrack())
  editor.registerComponent('tidal-album', tidalAlbum())
}
