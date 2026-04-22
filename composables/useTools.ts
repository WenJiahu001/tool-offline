export interface Tool {
  name: string
  description: string
  route: string
  category: string
  gradient: string
  iconBg: string
  iconColor: string
  hoverColor: string
  icon: string
}

export interface ToolCategory {
  name: string
  icon: string
  tools: Tool[]
}

export const tools: Tool[] = [
  {
    name: '图片压缩',
    description: '高效压缩 PNG/JPG 图片，智能平衡画质与体积，支持批量处理。',
    route: '/image-compress',
    category: '图片工具',
    gradient: 'from-blue-500 to-indigo-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverColor: 'group-hover:text-blue-600',
    icon: 'image',
  },
  {
    name: '图片裁剪',
    description: '支持常用证件照尺寸裁剪、自定义像素裁剪，操作简单。',
    route: '/image-crop',
    category: '图片工具',
    gradient: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    hoverColor: 'group-hover:text-orange-600',
    icon: 'crop',
  },
  {
    name: '图片隐私清除',
    description: '查看并清除图片中的隐私信息，如 GPS 位置、设备型号、拍摄时间等。',
    route: '/image-privacy',
    category: '图片工具',
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    hoverColor: 'group-hover:text-rose-600',
    icon: 'shield',
  },
  {
    name: '图片格式转换',
    description: 'PNG、JPG、WebP 格式互转，支持批量处理与质量调节。',
    route: '/image-convert',
    category: '图片工具',
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    hoverColor: 'group-hover:text-violet-600',
    icon: 'refresh',
  },
  {
    name: '图片合并 PDF',
    description: '将批量图片拼接并转换为高质量 PDF 文档，即用即走。',
    route: '/image-to-pdf',
    category: 'PDF 工具',
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    hoverColor: 'group-hover:text-emerald-600',
    icon: 'image-to-pdf',
  },
  {
    name: 'PDF 合并',
    description: '将多个 PDF 文档合并为一个文件，自由调整页面顺序。',
    route: '/pdf-tools',
    category: 'PDF 工具',
    gradient: 'from-purple-500 to-pink-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverColor: 'group-hover:text-purple-600',
    icon: 'pdf',
  },
  {
    name: 'JSON 工具',
    description: '格式化、压缩、转义、智能纠错、差异对比，一站式处理 JSON。',
    route: '/json-tools',
    category: '开发工具',
    gradient: 'from-amber-500 to-yellow-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    hoverColor: 'group-hover:text-amber-600',
    icon: 'code',
  },
  {
    name: 'URL 编解码',
    description: 'URL 编码与解码，支持查询参数解析，快速处理特殊字符。',
    route: '/url-encode',
    category: '开发工具',
    gradient: 'from-teal-500 to-emerald-500',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    hoverColor: 'group-hover:text-teal-600',
    icon: 'link',
  },
  {
    name: 'Markdown 编辑器',
    description: '实时预览、代码高亮，支持导入导出 .md 和 .html 文件。',
    route: '/markdown-editor',
    category: '开发工具',
    gradient: 'from-slate-600 to-gray-700',
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    hoverColor: 'group-hover:text-slate-600',
    icon: 'markdown',
  },
  {
    name: '二维码生成器',
    description: '输入文字或链接，快速生成二维码图片，支持自定义样式。',
    route: '/qrcode-generator',
    category: '实用工具',
    gradient: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    hoverColor: 'group-hover:text-cyan-600',
    icon: 'qrcode',
  },
]

const categoryOrder = ['图片工具', 'PDF 工具', '开发工具', '实用工具']

const categoryMeta: Record<string, { icon: string; description: string }> = {
  '图片工具': { icon: 'image', description: '压缩、裁剪、格式转换、隐私清除' },
  'PDF 工具': { icon: 'pdf', description: '合并、转换 PDF 文档' },
  '开发工具': { icon: 'code', description: 'JSON、URL、Markdown 处理' },
  '实用工具': { icon: 'utility', description: '二维码生成等日常工具' },
}

export function useTools() {
  const searchQuery = ref('')

  const filteredTools = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return tools
    return tools.filter(
      t =>
        t.name.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.category.toLowerCase().includes(q),
    )
  })

  const categorizedTools = computed<ToolCategory[]>(() => {
    const filtered = filteredTools.value
    return categoryOrder
      .map((cat) => {
        const catTools = filtered.filter(t => t.category === cat)
        return catTools.length > 0
          ? { name: cat, icon: categoryMeta[cat].icon, description: categoryMeta[cat].description, tools: catTools }
          : null
      })
      .filter(Boolean) as ToolCategory[]
  })

  return {
    tools,
    searchQuery,
    filteredTools,
    categorizedTools,
    categoryMeta,
  }
}
