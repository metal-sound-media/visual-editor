import {
  findUrls,
  findUrlAtEnd,
  findSingleUrl,
  urlToHref,
  normalizeHref,
  linkifyText,
} from 'src/functions/autolink'
import { it, expect, describe } from 'vitest'

const urls = (text: string) => findUrls(text).map((u) => u.url)

describe('findUrls', () => {
  it('finds http, https and www URLs', () => {
    expect(
      urls('a http://a.com b https://b.com/path?q=1#x c www.c.fr d')
    ).toEqual(['http://a.com', 'https://b.com/path?q=1#x', 'www.c.fr'])
  })

  it('returns the position of each URL', () => {
    expect(findUrls('see https://a.com')).toEqual([
      { index: 4, url: 'https://a.com' },
    ])
  })

  it('strips the trailing punctuation', () => {
    for (const end of ['.', ',', ';', ':', '!', '?', '...', '!?', '»', "'"]) {
      expect(urls(`go to https://a.com/x${end}`)).toEqual(['https://a.com/x'])
    }
  })

  it('keeps the punctuation inside the URL', () => {
    expect(urls('https://a.com/a.b,c;d?e=f.')).toEqual([
      'https://a.com/a.b,c;d?e=f',
    ])
  })

  it('strips an unbalanced closing bracket', () => {
    expect(urls('(see https://a.com/x)')).toEqual(['https://a.com/x'])
    expect(urls('[https://a.com]')).toEqual(['https://a.com'])
  })

  it('keeps balanced brackets', () => {
    expect(urls('https://en.wikipedia.org/wiki/Metal_(music).')).toEqual([
      'https://en.wikipedia.org/wiki/Metal_(music)',
    ])
    expect(urls('(https://en.wikipedia.org/wiki/Metal_(music))')).toEqual([
      'https://en.wikipedia.org/wiki/Metal_(music)',
    ])
  })

  it('stops at quotes and tags', () => {
    expect(urls('"https://a.com"')).toEqual(['https://a.com'])
    expect(urls('<https://a.com>')).toEqual(['https://a.com'])
  })

  it('ignores www. inside a word or an email', () => {
    expect(urls('awww.chouette.fr')).toEqual([])
    expect(urls('mail@www.groupe.fr')).toEqual([])
    expect(urls('foohttps://a.com')).toEqual([])
  })

  it('ignores URLs without host', () => {
    expect(urls('http:// https://. www. www.fr www.chouette')).toEqual([])
  })

  it('is case insensitive', () => {
    expect(urls('HTTPS://A.COM WWW.B.COM')).toEqual([
      'HTTPS://A.COM',
      'WWW.B.COM',
    ])
  })

  it('accepts unicode domains', () => {
    expect(urls('https://café.fr')).toEqual(['https://café.fr'])
  })
})

describe('findUrlAtEnd', () => {
  it('finds the URL followed by the typed space', () => {
    expect(findUrlAtEnd('go to https://a.com ')).toEqual({
      index: 6,
      url: 'https://a.com',
    })
  })

  it('finds the URL at the very end (Enter)', () => {
    expect(findUrlAtEnd('www.a.com')?.url).toBe('www.a.com')
  })

  it('ignores the final punctuation', () => {
    expect(findUrlAtEnd('go to https://a.com. ')?.url).toBe('https://a.com')
    expect(findUrlAtEnd('(https://a.com) ')?.url).toBe('https://a.com')
  })

  it('ignores a URL that is followed by other words', () => {
    expect(findUrlAtEnd('https://a.com is cool ')).toBeNull()
    expect(findUrlAtEnd('"https://a.com"abc ')).toBeNull()
  })

  it('returns null without URL', () => {
    expect(findUrlAtEnd('hello world ')).toBeNull()
  })
})

describe('findSingleUrl', () => {
  it('detects a text that is only a URL', () => {
    expect(findSingleUrl('  https://a.com/x  ')).toBe('https://a.com/x')
  })

  it('removes the final punctuation', () => {
    expect(findSingleUrl('https://a.com.')).toBe('https://a.com')
  })

  it('rejects texts containing more than a URL', () => {
    expect(findSingleUrl('see https://a.com')).toBeNull()
    expect(findSingleUrl('https://a.com https://b.com')).toBeNull()
    expect(findSingleUrl('hello')).toBeNull()
  })
})

describe('urlToHref', () => {
  it('adds https:// to www URLs', () => {
    expect(urlToHref('www.a.com')).toBe('https://www.a.com')
    expect(urlToHref('WWW.a.com')).toBe('https://WWW.a.com')
  })

  it('keeps URLs with a protocol', () => {
    expect(urlToHref('http://a.com')).toBe('http://a.com')
  })
})

describe('normalizeHref', () => {
  it('keeps complete URLs', () => {
    expect(normalizeHref(' https://a.com/x ')).toBe('https://a.com/x')
    expect(normalizeHref('mailto:a@b.fr')).toBe('mailto:a@b.fr')
    expect(normalizeHref('tel:+33600000000')).toBe('tel:+33600000000')
  })

  it('keeps relative URLs and anchors', () => {
    expect(normalizeHref('/contact')).toBe('/contact')
    expect(normalizeHref('#top')).toBe('#top')
    expect(normalizeHref('?page=2')).toBe('?page=2')
  })

  it('adds https:// to domains', () => {
    expect(normalizeHref('www.a.com')).toBe('https://www.a.com')
    expect(normalizeHref('a.com/x')).toBe('https://a.com/x')
    expect(normalizeHref('sub.a.co.uk')).toBe('https://sub.a.co.uk')
    expect(normalizeHref('a.com:8080/x')).toBe('https://a.com:8080/x')
  })

  it('rejects dangerous schemes', () => {
    expect(normalizeHref('javascript:alert(1)')).toBe('')
    expect(normalizeHref(' JavaScript:alert(1)')).toBe('')
    expect(normalizeHref('data:text/html,<script>')).toBe('')
    expect(normalizeHref('vbscript:x')).toBe('')
  })

  it('returns an empty string for an empty input', () => {
    expect(normalizeHref('   ')).toBe('')
  })
})

describe('linkifyText', () => {
  it('turns the URLs into links', () => {
    expect(linkifyText('see www.a.com.')).toBe(
      'see <a href="https://www.a.com" target="_blank" rel="noopener noreferrer">www.a.com</a>.'
    )
  })

  it('handles several URLs', () => {
    const html = linkifyText('https://a.com and https://b.com')
    expect(html.match(/<a /g)).toHaveLength(2)
    expect(html).toContain('</a> and <a')
  })

  it('escapes the text and the URL', () => {
    expect(linkifyText('<b>x</b> & https://a.com/?a=1&b=2')).toBe(
      '&lt;b&gt;x&lt;/b&gt; &amp; <a href="https://a.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">https://a.com/?a=1&amp;b=2</a>'
    )
  })

  it('returns the escaped text without URL', () => {
    expect(linkifyText('a < b')).toBe('a &lt; b')
  })
})
