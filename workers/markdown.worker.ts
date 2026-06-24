import { marked } from 'marked'
import hljs from 'highlight.js'
import { sanitizeHtml } from '../utils/markdown'

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true
})

// 自定义 renderer 实现代码高亮
const renderer = new marked.Renderer()
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre class="hljs-pre"><code class="hljs language-${language}">${highlighted}</code></pre>`
}
marked.use({ renderer })

self.onmessage = async (e: MessageEvent) => {
  const { id, content } = e.data
  try {
    const rawHtml = await marked(content)
    const safeHtml = sanitizeHtml(rawHtml as string)
    self.postMessage({ id, success: true, html: safeHtml })
  } catch (error: any) {
    self.postMessage({ id, success: false, error: error.message || 'Markdown 渲染错误' })
  }
}
