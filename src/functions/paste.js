// Cleans the HTML pasted from another source (Google Docs, Word, web pages...):
// only the structure the editor can produce is kept (paragraphs, headings, lists,
// quotes, links, bold, italic, underline), every style, class or other attribute
// (fonts, colors, sizes, margins...) is dropped.

import { findUrls, urlToHref } from './autolink.js'

const DROPPED = new Set([
  'SCRIPT',
  'STYLE',
  'META',
  'LINK',
  'TITLE',
  'HEAD',
  'TEMPLATE',
  'NOSCRIPT',
  'IMG',
  'PICTURE',
  'SVG',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'CANVAS',
  'INPUT',
  'BUTTON',
  'SELECT',
  'TEXTAREA',
])

// Kept blocks, h1 becomes h2 (the editor headings start at h2)
const BLOCKS = {
  P: 'p',
  H1: 'h2',
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h5',
  H6: 'h6',
  BLOCKQUOTE: 'blockquote',
}
const LISTS = { UL: 'ul', OL: 'ol' }

// Unknown elements displayed as blocks: their content becomes paragraphs
const BLOCK_LIKE = new Set([
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'ASIDE',
  'NAV',
  'ADDRESS',
  'FIGURE',
  'FIGCAPTION',
  'PRE',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'TD',
  'TH',
  'CAPTION',
  'DL',
  'DT',
  'DD',
  'HR',
  'CENTER',
])

const FORMATS = ['strong', 'em', 'u']

function styleOf(el) {
  return el.getAttribute('style') ?? ''
}

function cssValue(style, property) {
  const match = style.match(
    new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i')
  )
  return match ? match[1].trim().toLowerCase() : null
}

// Formatting of an element, from its tag then its inline style
// (Google Docs only uses styled spans, and wraps everything in <b style="font-weight:normal">)
function formatsOf(el, inherited) {
  const style = styleOf(el)
  const formats = { ...inherited }
  const tag = el.tagName

  if (tag === 'B' || tag === 'STRONG') formats.strong = true
  if (tag === 'I' || tag === 'EM') formats.em = true
  if (tag === 'U' || tag === 'INS') formats.u = true

  const weight = cssValue(style, 'font-weight')
  if (weight) {
    formats.strong =
      weight === 'bold' || weight === 'bolder' || parseInt(weight, 10) >= 600
  }
  const fontStyle = cssValue(style, 'font-style')
  if (fontStyle) formats.em = fontStyle === 'italic' || fontStyle === 'oblique'
  const decoration =
    cssValue(style, 'text-decoration-line') ??
    cssValue(style, 'text-decoration')
  if (decoration) formats.u = decoration.includes('underline')

  return formats
}

function safeHref(href) {
  const value = href?.trim()
  if (!value) return null
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(value)) return value
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? null : value
}

function alignOf(el) {
  // Pasted text keeps the alignment the toolbar can set, left is the default one
  const align = cssValue(styleOf(el), 'text-align') ?? el.getAttribute('align')
  return align === 'center' || align === 'right' ? align : null
}

class Builder {
  constructor(doc, multiline) {
    this.doc = doc
    this.multiline = multiline
    this.root = doc.createElement('div')
    // Container receiving the blocks, and the open paragraph receiving loose inline content
    this.container = this.root
    this.paragraph = null
    // True inside a pasted paragraph / heading (false for a paragraph created for loose content)
    this.inTextBlock = false
  }

  // Inline content goes in the open paragraph (created when needed)
  inlineTarget() {
    if (!this.multiline) return this.root
    if (this.container.tagName === 'LI') return this.container
    if (!this.paragraph) {
      this.paragraph = this.doc.createElement('p')
      this.container.appendChild(this.paragraph)
    }
    return this.paragraph
  }

  closeParagraph() {
    if (!this.inTextBlock) this.paragraph = null
    if (!this.multiline) this.separate()
  }

  // Single-line: blocks are joined with a space
  separate() {
    const last = this.root.lastChild
    if (last && !/\s$/.test(last.textContent)) {
      this.separator = this.doc.createTextNode(' ')
      this.root.appendChild(this.separator)
    }
  }

  text(value, formats, href) {
    if (!value) return
    // The URLs written as text become links, like when pasting a plain text
    if (!href) {
      let start = 0
      for (const { index, url } of findUrls(value)) {
        this.text(value.slice(start, index), formats, null)
        this.text(url, formats, urlToHref(url))
        start = index + url.length
      }
      if (start > 0) {
        this.text(value.slice(start), formats, null)
        return
      }
    }
    // Whitespace of the HTML source, between blocks or at the start of a line
    if (!value.trim()) {
      const last = (
        this.multiline ? (this.paragraph ?? this.container) : this.root
      ).lastChild
      if (!last || last.nodeName === 'BR' || /\s$/.test(last.textContent))
        return
    }
    let node = this.doc.createTextNode(value)
    for (const tag of [...FORMATS].reverse()) {
      // Links are already underlined
      if (formats[tag] && !(tag === 'u' && href)) {
        const wrapper = this.doc.createElement(tag)
        wrapper.appendChild(node)
        node = wrapper
      }
    }
    if (href) {
      const a = this.doc.createElement('a')
      a.setAttribute('href', href)
      if (/^https?:/i.test(href)) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      a.appendChild(node)
      node = a
    }
    this.inlineTarget().appendChild(node)
  }

  lineBreak() {
    if (this.multiline)
      this.inlineTarget().appendChild(this.doc.createElement('br'))
    else this.separate()
  }

  // Runs fn with a new block as container
  block(tag, align, fn) {
    if (!this.multiline) {
      this.closeParagraph()
      fn()
      this.closeParagraph()
      return
    }
    const el = this.doc.createElement(tag)
    if (align) el.style.textAlign = align
    this.container.appendChild(el)
    const previous = {
      container: this.container,
      inTextBlock: this.inTextBlock,
    }
    this.paragraph = null
    this.inTextBlock = false
    if (tag === 'blockquote' || tag === 'ul' || tag === 'ol' || tag === 'li') {
      this.container = el
    } else {
      this.paragraph = el
      this.inTextBlock = true
    }
    fn()
    this.container = previous.container
    this.inTextBlock = previous.inTextBlock
    this.paragraph = null
  }

  // Content of the current line, to know whether a line break is needed before a new one
  hasLine() {
    const target =
      this.paragraph ??
      (this.container.tagName === 'LI' ? this.container : null)
    return !!target?.textContent.trim()
  }

  walk(node, formats = {}, href = null) {
    if (node.nodeType === Node.TEXT_NODE) {
      this.text(node.data.replace(/[\r\n\t]+/g, ' '), formats, href)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE || DROPPED.has(node.tagName)) return

    const tag = node.tagName
    const children = () => {
      const childFormats = formatsOf(node, formats)
      const childHref =
        tag === 'A' ? (safeHref(node.getAttribute('href')) ?? href) : href
      for (const child of node.childNodes)
        this.walk(child, childFormats, childHref)
    }

    if (tag === 'BR') return this.lineBreak()

    if (LISTS[tag]) {
      return this.block(LISTS[tag], null, () => {
        for (const child of node.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'LI') {
            this.block('li', null, () =>
              this.walkListItem(child, formats, href)
            )
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            // Nested list without <li> (Word, some editors)
            this.walk(child, formats, href)
          }
        }
      })
    }

    if (tag === 'LI') {
      // Item outside a list
      return this.block('p', alignOf(node), () =>
        this.walkListItem(node, formats, href)
      )
    }

    if (BLOCKS[tag]) {
      // A block inside a list item or a paragraph keeps its content inline
      if (
        this.multiline &&
        (this.container.tagName === 'LI' ||
          (this.inTextBlock && tag !== 'BLOCKQUOTE'))
      ) {
        if (this.hasLine()) this.lineBreak()
        return children()
      }
      return this.block(BLOCKS[tag], alignOf(node), children)
    }

    if (BLOCK_LIKE.has(tag)) {
      if (
        this.multiline &&
        (this.container.tagName === 'LI' || this.inTextBlock)
      ) {
        if (this.hasLine()) this.lineBreak()
        return children()
      }
      this.closeParagraph()
      children()
      this.closeParagraph()
      return
    }

    // Inline element (span, font, a, b...): only its formatting is kept
    children()
  }

  walkListItem(li, formats, href) {
    const itemFormats = formatsOf(li, formats)
    for (const child of li.childNodes) this.walk(child, itemFormats, href)
  }

  html() {
    // Single-line: no space after the last block
    if (this.separator && this.separator === this.root.lastChild) {
      this.separator.remove()
    }
    cleanUp(this.root, this.multiline)
    // A single paragraph is inserted as inline content, in the paragraph of the caret
    // (Firefox would insert a new paragraph)
    const only = this.root.firstChild
    if (
      only?.nodeName === 'P' &&
      only === this.root.lastChild &&
      !only.hasAttribute('style')
    ) {
      only.replaceWith(...only.childNodes)
    }
    protectEdgeSpaces(this.root)
    return this.root.innerHTML
  }
}

function isEmpty(el) {
  return !el.textContent.replace(/[\s ​]/g, '')
}

// Merges the adjacent identical formatting tags and drops the empty blocks
function cleanUp(root, multiline) {
  for (const el of [...root.querySelectorAll('*')].reverse()) {
    const prev = el.previousSibling
    if (
      prev?.nodeType === Node.ELEMENT_NODE &&
      prev.tagName === el.tagName &&
      ['STRONG', 'EM', 'U', 'A'].includes(el.tagName) &&
      (el.tagName !== 'A' ||
        prev.getAttribute('href') === el.getAttribute('href'))
    ) {
      prev.append(...el.childNodes)
      el.remove()
      // The merged content may now hold adjacent identical tags
      cleanUp(prev, multiline)
    }
  }

  if (!multiline) {
    root.normalize()
    return
  }

  // Headings are already bold
  for (const strong of root.querySelectorAll(
    'h2 strong, h3 strong, h4 strong, h5 strong, h6 strong'
  )) {
    strong.replaceWith(...strong.childNodes)
  }

  for (const el of [
    ...root.querySelectorAll('p, h2, h3, h4, h5, h6, li, blockquote, ul, ol'),
  ].reverse()) {
    // Leading / trailing line breaks of a block
    while (el.lastChild?.nodeName === 'BR') el.lastChild.remove()
    while (el.firstChild?.nodeName === 'BR') el.firstChild.remove()
    if (isEmpty(el)) el.remove()
  }
  root.normalize()
}

function textNodes(root) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  return nodes
}

// The browser drops the spaces at the edges of the inserted HTML ("Hello |world"
// would become "Hello Pastedworld"): they are kept as non-breaking spaces
function protectEdgeSpaces(root) {
  const nodes = textNodes(root)
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (first) first.data = first.data.replace(/^ /, '\u00a0')
  if (last) last.data = last.data.replace(/ $/, '\u00a0')
}

export function cleanPastedHtml(html, multiline = true) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const builder = new Builder(doc, multiline)
  for (const child of doc.body.childNodes) builder.walk(child)
  return builder.html()
}

// Styles added by the browser itself when inserting HTML (Chrome wraps the content
// inserted in a paragraph in <span style="font-size: ...">): only the elements created
// by the paste are cleaned, the content already in the editor is left untouched
export function cleanInsertedElements(editorEl, existing) {
  const caret = saveCaret(editorEl)
  for (const el of [...editorEl.querySelectorAll('*')].reverse()) {
    if (existing.has(el)) continue
    const align = el.matches('p, h2, h3, h4, h5, h6') ? alignOf(el) : null
    el.removeAttribute('style')
    if (align) el.style.textAlign = align
    if (el.tagName === 'SPAN' || el.tagName === 'FONT') {
      el.replaceWith(...el.childNodes)
    }
  }
  // Line break left by Firefox next to the inserted blocks
  for (const br of editorEl.querySelectorAll(':scope > br')) {
    if (br.previousElementSibling || br.nextElementSibling) br.remove()
  }
  editorEl.normalize()
  restoreCaret(editorEl, caret)
}

// Caret saved as a number of characters from the start of the editor: unwrapping
// the elements changes the nodes but not the text
function saveCaret(editorEl) {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !editorEl.contains(sel.anchorNode)) return null
  const range = document.createRange()
  range.selectNodeContents(editorEl)
  const caret = sel.getRangeAt(0)
  range.setEnd(caret.endContainer, caret.endOffset)
  return range.toString().length
}

function restoreCaret(editorEl, offset) {
  if (offset === null) return
  const nodes = textNodes(editorEl)
  let remaining = offset
  let target = null
  for (const [i, node] of nodes.entries()) {
    if (remaining < node.length) {
      target = { node, offset: remaining }
      break
    }
    target = { node, offset: node.length }
    remaining -= node.length
    // At the end of a node, the caret goes at the start of the next one in the same
    // block (after a pasted bold text, the next typed text must not be bold)
    const next = nodes[i + 1]
    if (remaining === 0) {
      if (next && sameBlock(node, next, editorEl))
        target = { node: next, offset: 0 }
      break
    }
  }
  if (!target) return
  const range = document.createRange()
  range.setStart(target.node, target.offset)
  range.collapse(true)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

function sameBlock(a, b, editorEl) {
  const block = (node) =>
    node.parentElement.closest('p, h2, h3, h4, h5, h6, li, blockquote') ??
    editorEl
  return block(a) === block(b)
}
