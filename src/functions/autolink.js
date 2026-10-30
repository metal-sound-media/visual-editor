// URL-looking chunk, not glued to a word, an email (`mail@www.x`) or another URL
const URL_CANDIDATE =
  /(?<![\p{L}\p{N}_@.\/:-])(?:https?:\/\/|www\.)[^\s<>"]+/giu
// What remains after trimming must still have a host
const VALID_URL =
  /^(?:https?:\/\/[\p{L}\p{N}]|www\.[\p{L}\p{N}-]+\.[\p{L}\p{N}])/iu
// Characters ending a sentence rather than the URL
const TRAILING_PUNCTUATION = /[.,;:!?'*_~»…]/
const BRACKETS = { ')': '(', ']': '[', '}': '{' }
const UNSAFE_SCHEME = /^\s*(?:javascript|data|vbscript):/i
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i
const LOOKS_LIKE_DOMAIN =
  /^[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(?:[\/?#:]|$)/u

function count(str, char) {
  return str.split(char).length - 1
}

/**
 * Strip trailing punctuation, keeping closing brackets that have an opening
 * counterpart in the URL (https://en.wikipedia.org/wiki/Metal_(music))
 */
function trimUrl(url) {
  while (url) {
    const last = url.at(-1)
    const opening = BRACKETS[last]
    if (
      TRAILING_PUNCTUATION.test(last) ||
      (opening && count(url, opening) < count(url, last))
    ) {
      url = url.slice(0, -1)
    } else {
      break
    }
  }
  return url
}

/**
 * Find the URLs in a plain text
 *
 * @return {{index: number, url: string}[]}
 */
export function findUrls(text) {
  const urls = []
  for (const match of text.matchAll(URL_CANDIDATE)) {
    const url = trimUrl(match[0])
    if (VALID_URL.test(url)) {
      urls.push({ index: match.index, url })
    }
  }
  return urls
}

/**
 * Find the URL that ends the text (only followed by punctuation or spaces),
 * used to autolink a URL once the user types a space or Enter after it
 */
export function findUrlAtEnd(text) {
  const last = findUrls(text).at(-1)
  if (!last) return null
  const rest = text.slice(last.index + last.url.length)
  return /^[^\s\p{L}\p{N}]*\s*$/u.test(rest) ? last : null
}

/**
 * The text is exactly one URL (surrounding spaces and final punctuation ignored)
 */
export function findSingleUrl(text) {
  const trimmed = text.trim()
  if (/\s/.test(trimmed)) return null
  const urls = findUrls(trimmed)
  return urls.length === 1 && urls[0].index === 0 ? urls[0].url : null
}

/**
 * href for a detected URL (www.x.com → https://www.x.com)
 */
export function urlToHref(url) {
  return /^www\./i.test(url) ? `https://${url}` : url
}

/**
 * Clean an URL typed by the user in the link modal,
 * return an empty string for URLs that must not be used
 */
export function normalizeHref(input) {
  const url = input.trim()
  if (!url || UNSAFE_SCHEME.test(url)) return ''
  if (HAS_SCHEME.test(url) && !LOOKS_LIKE_DOMAIN.test(url)) return url
  if (/^[\/?#]/.test(url)) return url
  if (/^www\./i.test(url) || LOOKS_LIKE_DOMAIN.test(url))
    return `https://${url}`
  return url
}

export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function linkHtml(url) {
  return `<a href="${escapeHtml(urlToHref(url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`
}

/**
 * Convert a plain text into HTML, turning the URLs into links
 */
export function linkifyText(text) {
  let html = ''
  let offset = 0
  for (const { index, url } of findUrls(text)) {
    html += escapeHtml(text.slice(offset, index)) + linkHtml(url)
    offset = index + url.length
  }
  return html + escapeHtml(text.slice(offset))
}
