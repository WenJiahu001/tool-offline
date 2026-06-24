<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Upload, 
  Download, 
  Database, 
  Code, 
  Play, 
  Sparkles,
  Minimize2
} from 'lucide-vue-next'
import { format } from 'sql-formatter'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// SEO Meta
useSeoMeta({
  title: 'SQL 格式化与美化 - LocalTools',
  description: '本地安全的 SQL 格式化与美化工具，支持 MySQL、PostgreSQL 等多种数据库方言，一键格式化与压缩。',
  keywords: 'SQL格式化, SQL美化, SQL压缩, 本地工具, MySQL, PostgreSQL, SQLite'
})

const {
  errorMessage,
  successMessage,
  clearMessages,
  showError,
  showSuccess,
} = useToolFeedback()

const { 
  isDragging, 
  fileInput, 
  handleDragOver, 
  handleDragLeave, 
  handleDrop, 
  triggerUpload, 
  handleInputChange 
} = useFileUpload({
  accept: ['.sql', '.txt', 'text/plain'],
  multiple: false,
  onError: showError,
})

// 状态定义
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)
const isMinified = ref(false)

// 选项
const selectedLanguage = ref('mysql')
const keywordCase = ref<'upper' | 'lower' | 'preserve'>('upper')
const indentStyle = ref<'2' | '4' | 'tab'>('4')

// 可选方言列表
const dialects = [
  { label: 'MySQL / MariaDB', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'Transact-SQL (SQL Server)', value: 'transactsql' },
  { label: 'PL/SQL (Oracle)', value: 'plsql' },
  { label: 'Standard SQL', value: 'sql' },
]

// 关键字大小写列表
const cases = [
  { label: '大写 (UPPER)', value: 'upper' },
  { label: '小写 (lower)', value: 'lower' },
  { label: '保留原样', value: 'preserve' },
]

// 缩进列表
const indents = [
  { label: '2 空格', value: '2' },
  { label: '4 空格', value: '4' },
  { label: 'Tab 缩进', value: 'tab' },
]

// 载入演示 SQL
const loadDemo = () => {
  clearMessages()
  inputText.value = `SELECT a.id, a.username, b.amount, b.created_at, (SELECT count(1) FROM comments WHERE post_id = b.id) AS comment_count FROM users a INNER JOIN posts b ON a.id = b.author_id WHERE a.status = 'active' AND b.status = 'published' AND b.created_at >= '2023-01-01' ORDER BY b.created_at DESC LIMIT 20;`
  isMinified.value = false
  formatSql()
}

// 清空全部
const clearAll = () => {
  clearMessages()
  inputText.value = ''
  outputText.value = ''
  isMinified.value = false
}

// 格式化 SQL
const formatSql = () => {
  clearMessages()
  if (!inputText.value.trim()) {
    showError('请输入需要格式化的 SQL 语句')
    return
  }

  try {
    const options: any = {
      language: selectedLanguage.value,
      keywordCase: keywordCase.value,
    }

    if (indentStyle.value === 'tab') {
      options.useTabs = true
    } else {
      options.tabWidth = parseInt(indentStyle.value, 10)
    }

    outputText.value = format(inputText.value, options)
    isMinified.value = false
    showSuccess('格式化成功')
  } catch (error) {
    showError(`格式化失败: ${(error as Error).message}`)
    // 如果格式化出错，将原始输入作为输出，方便用户修改
    outputText.value = inputText.value
  }
}

// 压缩 SQL
const minifySql = () => {
  clearMessages()
  if (!inputText.value.trim()) {
    showError('请输入需要压缩的 SQL 语句')
    return
  }

  try {
    let sql = inputText.value
    
    // 1. 移除多行注释 /* ... */
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, ' ')
    
    // 2. 移除单行注释 -- ... 或 # ...
    sql = sql.replace(/(?:--|#)[^\r\n]*/g, ' ')
    
    // 3. 将换行和连续空白字符替换为单个空格
    sql = sql.replace(/\s+/g, ' ')
    
    // 4. 去除首尾空格
    outputText.value = sql.trim()
    isMinified.value = true
    showSuccess('压缩成功')
  } catch (error) {
    showError(`压缩失败: ${(error as Error).message}`)
  }
}

// 处理拖拽或上传文件
const handleFileSelect = async (files: File[]) => {
  const file = files[0]
  if (!file) return

  try {
    const text = await file.text()
    inputText.value = text
    formatSql()
  } catch (error) {
    showError(`文件读取失败: ${(error as Error).message}`)
  }
}

// 复制输出结果
const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
    showSuccess('复制成功')
  } catch {
    showError('复制失败，请手动选择复制')
  }
}

// 下载 SQL 文件
const downloadOutput = () => {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  downloadFile(blob, 'formatted_sql.sql')
}

// 使用 highlight.js 渲染语法高亮
const highlightedSql = computed(() => {
  if (!outputText.value) return ''
  try {
    return hljs.highlight(outputText.value, { language: 'sql' }).value
  } catch {
    // 降级为直接显示
    return outputText.value
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- 头部标题 -->
    <ToolPageHeader
      title="SQL 格式化与美化"
      description="本地安全的 SQL 格式化与美化工具，支持 MySQL、PostgreSQL 等多种数据库方言，一键格式化与压缩。"
      icon="database"
      icon-bg="bg-blue-50"
      icon-color="text-blue-600"
    />

    <!-- 消息反馈组件 -->
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />

    <!-- 控制面板 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- 数据库方言 -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-gray-500 font-medium whitespace-nowrap">方言:</span>
          <select
            v-model="selectedLanguage"
            @change="formatSql"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="d in dialects" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>

        <!-- 关键字大小写 -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-gray-500 font-medium whitespace-nowrap">关键字:</span>
          <select
            v-model="keywordCase"
            @change="formatSql"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="c in cases" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <!-- 缩进样式 -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-gray-500 font-medium whitespace-nowrap">缩进:</span>
          <select
            v-model="indentStyle"
            @change="formatSql"
            class="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="i in indents" :key="i.value" :value="i.value">{{ i.label }}</option>
          </select>
        </div>

        <div class="flex-1"></div>

        <!-- 快捷操作 -->
        <div class="flex items-center gap-2">
          <button
            @click="loadDemo"
            class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <Sparkles class="w-4 h-4" />
            载入示例
          </button>
          <button
            @click="clearAll"
            class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <RotateCcw class="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 主编辑工作区 -->
    <div 
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      :class="{ 'ring-2 ring-blue-500 rounded-xl': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="(e) => handleDrop(e, handleFileSelect)"
    >
      <!-- 左侧：输入框 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[520px]">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-700">原始 SQL 输入</span>
            <button 
              @click="triggerUpload"
              class="p-1.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
              title="导入 SQL 文件"
            >
              <Upload class="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept=".sql,.txt"
              @change="(e) => handleInputChange(e, handleFileSelect)"
            />
          </div>
          <span class="text-xs text-gray-400 font-mono">{{ inputText.length }} 字符</span>
        </div>
        
        <textarea
          v-model="inputText"
          placeholder="在此粘贴您的 SQL 语句，或将 .sql / .txt 文件拖拽至此..."
          class="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none"
          spellcheck="false"
          @input="clearMessages"
        ></textarea>

        <!-- 转换执行栏 -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            @click="formatSql"
            class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Code class="w-4 h-4" />
            格式化美化
          </button>
          <button
            @click="minifySql"
            class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="将 SQL 压缩到一行"
          >
            <Minimize2 class="w-4 h-4" />
            压缩
          </button>
        </div>
      </div>

      <!-- 右侧：输出高亮区 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[520px]">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">美化输出结果</span>
          <span class="text-xs text-gray-400 font-mono">{{ outputText.length }} 字符</span>
        </div>

        <div class="flex-1 p-4 overflow-auto font-mono text-sm bg-gray-50/50">
          <pre v-if="outputText" class="w-full h-full"><code v-html="highlightedSql" class="hljs sql"></code></pre>
          <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Database class="w-12 h-12 stroke-[1.2]" />
            <p class="text-sm">等待格式化输出...</p>
          </div>
        </div>

        <!-- 输出导出栏 -->
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            @click="copyOutput"
            :disabled="!outputText"
            class="flex-1 px-4 py-2.5 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
            :class="[
              outputText 
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            ]"
          >
            <component :is="copied ? Check : Copy" class="w-4 h-4" />
            {{ copied ? '复制成功' : '复制结果' }}
          </button>
          <button
            @click="downloadOutput"
            :disabled="!outputText"
            class="px-4 py-2.5 font-medium rounded-lg transition-all flex items-center justify-center gap-1.5"
            :class="[
              outputText 
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            ]"
            title="下载 .sql 文件"
          >
            <Download class="w-4 h-4" />
            下载 SQL
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义高亮滚动条等微调样式 */
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
