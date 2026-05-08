import { normalizeHtml } from 'src/fields/HTMLText'
import { it, expect, describe } from 'vitest'

describe('normalizeHtml — inline (single-line mode)', () => {
  it('strips paragraph wrappers', () => {
    expect(normalizeHtml('<p>hello</p>', false)).toBe('hello')
  })

  it('strips br tags', () => {
    expect(normalizeHtml('hello<br>world', false)).toBe('helloworld')
  })

  it('normalises <b> to <strong>', () => {
    expect(normalizeHtml('<b>text</b>', false)).toBe('<strong>text</strong>')
  })

  it('normalises <i> to <em>', () => {
    expect(normalizeHtml('<i>text</i>', false)).toBe('<em>text</em>')
  })

  it('preserves <strong> and <em>', () => {
    expect(normalizeHtml('<strong>a</strong><em>b</em>', false)).toBe('<strong>a</strong><em>b</em>')
  })

  it('preserves <a href>', () => {
    expect(normalizeHtml('<a href="https://x.com">link</a>', false)).toBe('<a href="https://x.com">link</a>')
  })
})

describe('normalizeHtml — multiline', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeHtml('', true)).toBe('')
  })

  it('wraps bare text in <p>', () => {
    expect(normalizeHtml('hello', true)).toContain('<p')
  })

  it('preserves existing <p> tags', () => {
    const result = normalizeHtml('<p>hello</p>', true)
    expect(result).toContain('<p')
    expect(result).toContain('hello')
  })

  it('preserves <h2> through <h6> without wrapping', () => {
    for (const tag of ['h2', 'h3', 'h4', 'h5', 'h6']) {
      const html = `<${tag}>Titre</${tag}>`
      const result = normalizeHtml(html, true)
      expect(result).toContain(`<${tag}>`)
      expect(result).not.toContain('<p>')
    }
  })

  it('preserves <blockquote>', () => {
    const result = normalizeHtml('<blockquote>citation</blockquote>', true)
    expect(result).toContain('<blockquote>')
    expect(result).not.toContain('<p>')
  })

  it('preserves <ul> and <ol>', () => {
    expect(normalizeHtml('<ul><li>a</li></ul>', true)).toContain('<ul>')
    expect(normalizeHtml('<ol><li>a</li></ol>', true)).toContain('<ol>')
  })

  it('preserves <a href> links', () => {
    const result = normalizeHtml('<p><a href="https://x.com">link</a></p>', true)
    expect(result).toContain('<a href="https://x.com">')
  })

  it('normalises <b> to <strong>', () => {
    const result = normalizeHtml('<p><b>bold</b></p>', true)
    expect(result).toContain('<strong>')
    expect(result).not.toContain('<b>')
  })

  it('normalises <i> to <em>', () => {
    const result = normalizeHtml('<p><i>italic</i></p>', true)
    expect(result).toContain('<em>')
    expect(result).not.toContain('<i>')
  })

  it('adds text-align:left to <p> without it', () => {
    const result = normalizeHtml('<p>hello</p>', true)
    expect(result).toContain('text-align: left')
  })

  it('does not add text-align to <h2>', () => {
    const result = normalizeHtml('<h2>Titre</h2>', true)
    expect(result).not.toContain('text-align')
  })

  it('does not add text-align to <blockquote>', () => {
    const result = normalizeHtml('<blockquote>citation</blockquote>', true)
    expect(result).not.toContain('text-align')
  })
})
