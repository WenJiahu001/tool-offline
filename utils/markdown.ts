const BLOCKED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form'])
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

const sanitizeAttributes = (element: Element) => {
  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase()
    const value = attribute.value.trim()

    if (name.startsWith('on')) {
      element.removeAttribute(attribute.name)
      return
    }

    if ((name === 'href' || name === 'src') && value) {
      try {
        const url = new URL(value, 'https://localtools.invalid')
        if (!SAFE_URL_PROTOCOLS.includes(url.protocol) && !value.startsWith('/') && !value.startsWith('./') && !value.startsWith('../') && !value.startsWith('#')) {
          element.removeAttribute(attribute.name)
        }
      } catch {
        element.removeAttribute(attribute.name)
      }
    }
  })
}

const sanitizeNode = (node: ParentNode) => {
  const elements = node.querySelectorAll('*')
  elements.forEach((element) => {
    const tag = element.tagName.toLowerCase()
    if (BLOCKED_TAGS.has(tag)) {
      element.remove()
      return
    }

    sanitizeAttributes(element)
  })
}

export const sanitizeHtml = (html: string) => {
  if (!html) return ''

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const document = parser.parseFromString(html, 'text/html')
    sanitizeNode(document)
    return document.body.innerHTML
  }

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '')
}

export const markdownExportStyles = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #1a1a1a; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; line-height: 1.3; }
h1 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h2 { font-size: 1.4em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
h3 { font-size: 1.2em; }
h4 { font-size: 1em; }
p { margin: 0.8em 0; }
a { color: #0366d6; text-decoration: none; }
a:hover { text-decoration: underline; }
code { background: #f1f3f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.88em; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
pre { background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 1em; overflow-x: auto; margin: 1em 0; }
pre code { background: none; padding: 0; color: inherit; }
blockquote { border-left: 4px solid #dfe2e5; margin: 1em 0; padding: 0.5em 1em; color: #6a737d; background: #f9f9f9; border-radius: 0 4px 4px 0; }
ul, ol { margin: 0.8em 0; padding-left: 2em; }
li { margin: 0.3em 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #dfe2e5; padding: 0.5em 1em; text-align: left; }
th { background: #f6f8fa; font-weight: 600; }
img { max-width: 100%; border-radius: 4px; }
hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-title, .hljs-section, .hljs-doctag, .hljs-type, .hljs-name, .hljs-strong { color: #93c5fd; }
.hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition, .hljs-template-tag, .hljs-template-variable { color: #86efac; }
.hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #94a3b8; }
.hljs-number, .hljs-regexp, .hljs-variable, .hljs-link { color: #fca5a5; }
`
