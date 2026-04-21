<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { Download, Copy, FileText, Eye, Code, Columns, Maximize2 } from 'lucide-vue-next'

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

// 编辑器内容
const markdownContent = ref(`# Markdown 编辑器

欢迎使用 **Markdown 编辑器**！左侧编辑，右侧实时预览。

## 功能特性

- 实时预览渲染
- 代码语法高亮
- 支持上传 .md 文件
- 导出为 Markdown / HTML
- 编辑/预览/分栏三种视图模式

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## 表格示例

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 加粗 | Ctrl+B | **粗体文字** |
| 斜体 | Ctrl+I | *斜体文字* |
| 链接 | Ctrl+K | [链接](https://example.com) |

> 💡 所有内容纯本地处理，无需上传服务器。

---

*开始编写你的 Markdown 内容吧！*
`)

// 视图模式：edit / preview / split
const viewMode = ref<'edit' | 'preview' | 'split'>('split')

// 渲染后的 HTML
const renderedHtml = computed(() => {
  try {
    return marked(markdownContent.value) as string
  } catch {
    return '<p style="color: red;">渲染错误</p>'
  }
})

// 统计信息
const stats = computed(() => {
  const text = markdownContent.value
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.split('\n').length
  return { chars, words, lines }
})

// 复制 HTML
const copyHtml = async () => {
  try {
    await navigator.clipboard.writeText(renderedHtml.value)
    copyFeedback.value = '已复制'
    setTimeout(() => { copyFeedback.value = '' }, 2000)
  } catch {
    copyFeedback.value = '复制失败'
    setTimeout(() => { copyFeedback.value = '' }, 2000)
  }
}

const copyFeedback = ref('')

// 复制 Markdown
const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(markdownContent.value)
    mdCopyFeedback.value = '已复制'
    setTimeout(() => { mdCopyFeedback.value = '' }, 2000)
  } catch {
    mdCopyFeedback.value = '复制失败'
    setTimeout(() => { mdCopyFeedback.value = '' }, 2000)
  }
}

const mdCopyFeedback = ref('')

// 下载为 Markdown 文件
const downloadMarkdown = () => {
  const blob = new Blob([markdownContent.value], { type: 'text/markdown;charset=utf-8' })
  downloadFile(blob, 'document.md')
}

// 下载为 HTML 文件
const downloadHtml = () => {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #1a1a1a; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0.5em 1em; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 0.5em 1em; text-align: left; }
    th { background: #f5f5f5; }
    img { max-width: 100%; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
</head>
<body>
${renderedHtml.value}
</body>
</html>`
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  downloadFile(blob, 'document.html')
}

// 上传 .md 文件
const mdFileInput = ref<HTMLInputElement | null>(null)
const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    if (text) {
      markdownContent.value = text
    }
  }
  reader.readAsText(file)
  target.value = ''
}

// 同步滚动
const editorRef = ref<HTMLTextAreaElement | null>(null)
const previewRef = ref<HTMLDivElement | null>(null)

const handleEditorScroll = () => {
  if (viewMode.value !== 'split' || !editorRef.value || !previewRef.value) return
  const editor = editorRef.value
  const preview = previewRef.value
  const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1)
  preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
}

// Tab 键支持
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    markdownContent.value = markdownContent.value.substring(0, start) + '  ' + markdownContent.value.substring(end)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    }, 0)
  }
}

useSeoMeta({
  title: 'Markdown 编辑器 - 实时预览 - LocalTools',
  description: '在线 Markdown 编辑器，支持实时预览、代码高亮、文件导入导出。纯本地运行，数据安全无忧。',
  keywords: 'Markdown编辑器, Markdown预览, 在线编辑器, 代码高亮, 本地工具'
})
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Markdown 编辑器</h1>
      <p class="text-gray-500">编辑 Markdown 内容，实时预览渲染效果，支持代码高亮。</p>
    </div>

    <!-- 工具栏 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <!-- 视图模式切换 -->
        <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            @click="viewMode = 'edit'"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="viewMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            <Code class="h-4 w-4" />
            编辑
          </button>
          <button
            @click="viewMode = 'preview'"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            <Eye class="h-4 w-4" />
            预览
          </button>
          <button
            @click="viewMode = 'split'"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="viewMode === 'split' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            <Columns class="h-4 w-4" />
            分栏
          </button>
        </div>

        <!-- 上传文件 -->
        <input
          type="file"
          ref="mdFileInput"
          class="hidden"
          accept=".md,.markdown,.txt"
          @change="handleFileUpload"
        />
        <button
          @click="mdFileInput?.click()"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileText class="h-4 w-4" />
          打开文件
        </button>
      </div>

      <div class="flex items-center gap-2">
        <!-- 复制按钮 -->
        <button
          @click="copyMarkdown"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Copy class="h-4 w-4" />
          {{ mdCopyFeedback || '复制MD' }}
        </button>
        <button
          @click="copyHtml"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Copy class="h-4 w-4" />
          {{ copyFeedback || '复制HTML' }}
        </button>

        <!-- 下载按钮 -->
        <button
          @click="downloadMarkdown"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download class="h-4 w-4" />
          导出 .md
        </button>
        <button
          @click="downloadHtml"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 hover:bg-black text-white rounded-lg transition-colors shadow-sm"
        >
          <Download class="h-4 w-4" />
          导出 .html
        </button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="flex gap-4" style="height: calc(100vh - 240px); min-height: 400px;">
      <!-- 编辑区域 -->
      <div
        v-if="viewMode === 'edit' || viewMode === 'split'"
        class="flex flex-col flex-1 min-w-0"
      >
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div class="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Markdown</span>
            <span class="text-xs text-gray-400">{{ stats.lines }} 行 · {{ stats.chars }} 字符</span>
          </div>
          <textarea
            ref="editorRef"
            v-model="markdownContent"
            @scroll="handleEditorScroll"
            @keydown="handleKeydown"
            class="flex-1 w-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white"
            placeholder="在此输入 Markdown 内容..."
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- 预览区域 -->
      <div
        v-if="viewMode === 'preview' || viewMode === 'split'"
        class="flex flex-col flex-1 min-w-0"
      >
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div class="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">预览</span>
            <span class="text-xs text-gray-400">{{ stats.words }} 词</span>
          </div>
          <div
            ref="previewRef"
            class="flex-1 overflow-y-auto p-6 markdown-body"
            v-html="renderedHtml"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Markdown 渲染样式 */
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: #1a1a1a;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body h1 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.4em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.2em; }
.markdown-body h4 { font-size: 1em; }

.markdown-body p { margin: 0.8em 0; }

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}
.markdown-body a:hover { text-decoration: underline; }

.markdown-body code {
  background: #f1f3f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.88em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.markdown-body .hljs-pre {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-body .hljs-pre code {
  background: none;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.6;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  margin: 1em 0;
  padding: 0.5em 1em;
  color: #6a737d;
  background: #f9f9f9;
  border-radius: 0 4px 4px 0;
}

.markdown-body ul,
.markdown-body ol {
  margin: 0.8em 0;
  padding-left: 2em;
}

.markdown-body li { margin: 0.3em 0; }

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid #dfe2e5;
  padding: 0.5em 1em;
  text-align: left;
}

.markdown-body th {
  background: #f6f8fa;
  font-weight: 600;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 4px;
}

.markdown-body hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 2em 0;
}

.markdown-body strong { font-weight: 600; }

.markdown-body em { font-style: italic; }

/* highlight.js 主题覆盖 */
.markdown-body .hljs {
  background: #f6f8fa;
}
</style>
