<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Copy, Check, RotateCcw, FileText, Upload, Download, RefreshCw, Keyboard } from 'lucide-vue-next'
import { stringToBase64, base64ToString, fileToBase64 } from '../utils/base64-tools'

const {
  errorMessage,
  successMessage,
  clearMessages,
  showError,
  showSuccess,
} = useToolFeedback()

const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload, handleInputChange } = useFileUpload({
  accept: ['*/*'],
  multiple: false,
  onError: showError,
})

// 当前模式: 'text' = 文本互转, 'file-to-b64' = 文件转 Base64, 'b64-to-file' = Base64还原文件
const activeMode = ref<'text' | 'file-to-b64' | 'b64-to-file'>('text')

// 1. 文本模式状态
const textPlain = ref('')
const textBase64 = ref('')
const plainCopied = ref(false)
const base64Copied = ref(false)

const handlePlainInput = () => {
  clearMessages()
  if (!textPlain.value) {
    textBase64.value = ''
    return
  }
  try {
    textBase64.value = stringToBase64(textPlain.value)
  } catch (error) {
    showError(`编码失败: ${(error as Error).message}`)
  }
}

const handleBase64Input = () => {
  clearMessages()
  if (!textBase64.value) {
    textPlain.value = ''
    return
  }
  try {
    textPlain.value = base64ToString(textBase64.value)
  } catch {
    showError('解码失败: 输入内容不是有效的 Base64 编码')
    textPlain.value = ''
  }
}

const copyText = async (content: string, type: 'plain' | 'base64') => {
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    if (type === 'plain') {
      plainCopied.value = true
      setTimeout(() => { plainCopied.value = false }, 2000)
    } else {
      base64Copied.value = true
      setTimeout(() => { base64Copied.value = false }, 2000)
    }
    showSuccess('复制成功')
  } catch {
    showError('复制失败')
  }
}

// 2. 文件转 Base64 状态
interface UploadedFileMeta {
  name: string
  size: number
  type: string
  dataUrl: string
  rawBase64: string
}
const uploadedFile = ref<UploadedFileMeta | null>(null)
const dataUrlCopied = ref(false)
const rawBase64Copied = ref(false)

// 限制界面显示字符长度 (防 DOM 卡死)
const DISPLAY_LIMIT = 5000

const previewDataUrl = computed(() => {
  if (!uploadedFile.value) return ''
  const url = uploadedFile.value.dataUrl
  if (url.length > DISPLAY_LIMIT) {
    return url.slice(0, DISPLAY_LIMIT) + `\n\n... [数据过大，已省略剩余 ${url.length - DISPLAY_LIMIT} 字符] ...`
  }
  return url
})

const previewRawBase64 = computed(() => {
  if (!uploadedFile.value) return ''
  const b64 = uploadedFile.value.rawBase64
  if (b64.length > DISPLAY_LIMIT) {
    return b64.slice(0, DISPLAY_LIMIT) + `\n\n... [数据过大，已省略剩余 ${b64.length - DISPLAY_LIMIT} 字符] ...`
  }
  return b64
})

const handleFileSelect = async (files: FileList | File[]) => {
  clearMessages()
  const file = Array.from(files)[0]
  if (!file) return

  try {
    const dataUrl = await fileToBase64(file)
    // 提取纯 Base64 (去除 data:xxx;base64, 前缀)
    const commaIndex = dataUrl.indexOf(',')
    const rawBase64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl

    uploadedFile.value = {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      dataUrl,
      rawBase64,
    }
    showSuccess('文件读取成功')
  } catch {
    showError('文件读取失败')
  }
}

const downloadBase64Txt = (content: string, prefix: string) => {
  if (!content) return
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const filename = `${uploadedFile.value?.name || 'file'}_${prefix}.txt`
  downloadFile(blob, filename)
}

const copyLargeText = async (content: string, target: 'dataUrl' | 'raw') => {
  try {
    await navigator.clipboard.writeText(content)
    if (target === 'dataUrl') {
      dataUrlCopied.value = true
      setTimeout(() => { dataUrlCopied.value = false }, 2000)
    } else {
      rawBase64Copied.value = true
      setTimeout(() => { rawBase64Copied.value = false }, 2000)
    }
    showSuccess('已复制完整 Base64 编码')
  } catch {
    showError('复制失败')
  }
}

// 3. Base64 还原文件状态
const inputBase64ForFile = ref('')
const outputFileName = ref('decoded_file')

const handleRestoreFile = () => {
  clearMessages()
  const content = inputBase64ForFile.value.trim()
  if (!content) {
    showError('请先输入 Base64 编码')
    return
  }

  try {
    let mimeString = 'application/octet-stream'
    let base64Content = content

    // 匹配 Data URL 格式
    const matches = base64Content.match(/^data:([^;]+);base64,(.+)$/s)
    if (matches) {
      mimeString = matches[1]
      base64Content = matches[2]
    }

    const byteCharacters = atob(base64Content.replace(/\s/g, ''))
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeString })

    let ext = 'bin'
    if (mimeString.includes('/')) {
      const part = mimeString.split('/')[1]
      ext = part.split('+')[0] // 规避 image/svg+xml 这样的后缀
    }

    const filename = outputFileName.value.includes('.') 
      ? outputFileName.value 
      : `${outputFileName.value}.${ext}`

    downloadFile(blob, filename)
    showSuccess('文件还原成功，已开始下载')
  } catch {
    showError('还原失败: 输入的数据不是合法的 Base64 编码格式')
  }
}

// 全局清空
const clearAll = () => {
  textPlain.value = ''
  textBase64.value = ''
  uploadedFile.value = null
  inputBase64ForFile.value = ''
  outputFileName.value = 'decoded_file'
  clearMessages()
}

const switchMode = (mode: 'text' | 'file-to-b64' | 'b64-to-file') => {
  activeMode.value = mode
  clearAll()
}

useSeoMeta({
  title: 'Base64 编解码工具 - 文本/文件互转 - LocalTools',
  description: '纯本地 Base64 编解码转换工具。支持中文字符无乱码的文本互转，支持将任意文件转换为 Base64 代码，并可将 Base64 代码还原为源文件下载。',
  keywords: 'Base64, Base64编码, Base64解码, 图片转Base64, Base64还原文件, 在线工具'
})

// 快捷键和自动聚焦支持
const mainInput = ref<HTMLTextAreaElement | null>(null)
useAutoFocus(mainInput)

const router = useRouter()
const triggerAction = () => {
  if (activeMode.value === 'b64-to-file') {
    handleRestoreFile()
  }
}

const copyOutput = async () => {
  if (activeMode.value === 'text') {
    if (textBase64.value) {
      await copyText(textBase64.value, 'base64')
    }
  } else if (activeMode.value === 'file-to-b64') {
    if (uploadedFile.value) {
      await copyLargeText(uploadedFile.value.rawBase64, 'raw')
    }
  }
}

const { isMac, shortcuts, showShortcutHelp } = useShortcuts([
  {
    key: 'ctrl+enter',
    description: '还原并下载文件 (还原模式)',
    action: triggerAction
  },
  {
    key: 'ctrl+d',
    description: '清空内容',
    action: clearAll
  },
  {
    key: 'alt+c',
    description: '清空内容',
    action: clearAll
  },
  {
    key: 'ctrl+shift+c',
    description: '复制输出结果',
    action: copyOutput
  }
])
</script>

<template>
  <div class="px-3 py-4 max-w-[98%] xl:max-w-[95%] mx-auto">
    <ToolPageHeader
      title="Base64 编解码工具"
      description="支持文本和文件与 Base64 格式的互相转换，纯本地运行，保障您的文件隐私"
    />

    <!-- 模式切换 -->
    <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
      <button
        @click="switchMode('text')"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
          activeMode === 'text'
            ? 'bg-sky-600 text-white shadow-sm'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <FileText class="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
        文本 Base64 互转
      </button>
      <button
        @click="switchMode('file-to-b64')"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
          activeMode === 'file-to-b64'
            ? 'bg-sky-600 text-white shadow-sm'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <Upload class="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
        文件转 Base64
      </button>
      <button
        @click="switchMode('b64-to-file')"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
          activeMode === 'b64-to-file'
            ? 'bg-sky-600 text-white shadow-sm'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <Download class="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
        Base64 还原文件
      </button>
    </div>

    <!-- 消息提示 -->
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />

    <!-- 1. 文本 Base64 互转 -->
    <div v-if="activeMode === 'text'" class="space-y-3">
      <div class="flex justify-end mb-1.5 gap-2">
        <button
          @click="clearAll"
          class="px-2.5 py-1 text-gray-500 hover:text-gray-700 text-xs transition-colors flex items-center gap-1 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>重置</span>
          <kbd class="hidden md:inline-flex items-center px-1 bg-gray-100 text-gray-400 border border-gray-200 rounded text-[9px] font-mono leading-none select-none">
            {{ isMac ? '⌘D' : 'Ctrl+D' }}
          </kbd>
        </button>
        <button 
          @click="showShortcutHelp = true"
          class="px-2.5 py-1 text-gray-500 hover:text-gray-700 border border-gray-200 text-xs font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Keyboard class="w-3.5 h-3.5" />
          <span>快捷键</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 文本明文 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">明文 (UTF-8)</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 mr-2">{{ textPlain.length }} 字符</span>
              <button
                v-if="textPlain"
                @click="copyText(textPlain, 'plain')"
                class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                <Check v-if="plainCopied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                复制
              </button>
            </div>
          </div>
          <textarea
            ref="mainInput"
            v-model="textPlain"
            @input="handlePlainInput"
            placeholder="在此输入明文文本，会自动实时转换为右侧 Base64 编码..."
            class="w-full h-[calc(100vh-240px)] min-h-[550px] p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Base64 密文 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">Base64 编码</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 mr-2">{{ textBase64.length }} 字符</span>
              <button
                v-if="textBase64"
                @click="copyText(textBase64, 'base64')"
                class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                <Check v-if="base64Copied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                复制
              </button>
            </div>
          </div>
          <textarea
            v-model="textBase64"
            @input="handleBase64Input"
            placeholder="在此输入 Base64 编码内容，会自动实时转换为左侧明文文本..."
            class="w-full h-[calc(100vh-240px)] min-h-[550px] p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50/20"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 2. 文件转 Base64 -->
    <div v-else-if="activeMode === 'file-to-b64'" class="space-y-3">
      <div
        :class="[
          'transition-all duration-200 rounded-xl',
          isDragging ? 'ring-2 ring-sky-500' : ''
        ]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="(e) => handleDrop(e, handleFileSelect)"
      >
        <ToolUploadZone
          :dragging="isDragging"
          :icon="Upload"
          title="将文件拖到这里，或点击上传"
          description="支持任意类型的文件转 Base64 编码，纯本地解析"
          @click="triggerUpload"
        />
        <input
          type="file"
          ref="fileInput"
          class="hidden"
          @change="(e) => handleInputChange(e, handleFileSelect)"
        />
      </div>

      <!-- 上传成功后的信息面板 -->
      <div v-if="uploadedFile" class="bg-white border border-gray-200 rounded-xl p-3 px-4 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <h3 class="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileText class="w-4 h-4 text-sky-600" />
              {{ uploadedFile.name }}
            </h3>
            <p class="text-[11px] text-gray-500 mt-0.5">
              大小：{{ formatFileSize(uploadedFile.size) }} | 类型：{{ uploadedFile.type }}
            </p>
          </div>
          <button
            @click="clearAll"
            class="text-[11px] text-gray-400 hover:text-red-500 transition-colors border border-gray-100 px-2.5 py-1 rounded-lg hover:bg-red-50"
          >
            移除文件
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 完整 Data URL -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-700">Data URL (带 MIME 前缀)</span>
              <div class="flex items-center gap-1.5">
                <button
                  @click="downloadBase64Txt(uploadedFile.dataUrl, 'dataurl')"
                  class="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 px-1.5 py-0.5 rounded"
                >
                  <Download class="w-3 h-3" />
                  下载 TXT
                </button>
                <button
                  @click="copyLargeText(uploadedFile.dataUrl, 'dataUrl')"
                  class="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold transition-colors border border-sky-100 bg-sky-50 px-2 py-0.5 rounded"
                >
                  <Check v-if="dataUrlCopied" class="w-3 h-3" />
                  <Copy v-else class="w-3 h-3" />
                  复制完整代码
                </button>
              </div>
            </div>
            <textarea
              readonly
              :value="previewDataUrl"
              class="w-full h-[calc(100vh-320px)] min-h-[400px] p-3 bg-gray-50/50 border border-gray-200 rounded-lg font-mono text-xs focus:outline-none resize-none"
            ></textarea>
          </div>

          <!-- 纯 Base64 编码 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-700">纯 Base64 编码</span>
              <div class="flex items-center gap-1.5">
                <button
                  @click="downloadBase64Txt(uploadedFile.rawBase64, 'raw')"
                  class="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 px-1.5 py-0.5 rounded"
                >
                  <Download class="w-3 h-3" />
                  下载 TXT
                </button>
                <button
                  @click="copyLargeText(uploadedFile.rawBase64, 'raw')"
                  class="flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold transition-colors border border-sky-100 bg-sky-50 px-2 py-0.5 rounded"
                >
                  <Check v-if="rawBase64Copied" class="w-3 h-3" />
                  <Copy v-else class="w-3 h-3" />
                  复制完整代码
                </button>
              </div>
            </div>
            <textarea
              readonly
              :value="previewRawBase64"
              class="w-full h-[calc(100vh-320px)] min-h-[400px] p-3 bg-gray-50/50 border border-gray-200 rounded-lg font-mono text-xs focus:outline-none resize-none"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Base64 还原文件 -->
    <div v-else-if="activeMode === 'b64-to-file'" class="space-y-3">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-3 px-4 space-y-3">
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div class="flex-1">
            <label class="block text-xs font-semibold text-gray-700 mb-1">期望的保存文件名</label>
            <input
              v-model="outputFileName"
              type="text"
              placeholder="请输入文件名（后缀会自动根据 MIME 匹配）..."
              class="w-full max-w-md px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="clearAll"
              class="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 bg-white"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>清空</span>
              <kbd class="hidden md:inline-flex items-center px-1 bg-gray-100 text-gray-400 border border-gray-200 rounded text-[9px] font-mono leading-none select-none">
                {{ isMac ? '⌘D' : 'Ctrl+D' }}
              </kbd>
            </button>
            <button
              @click="handleRestoreFile"
              class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw class="w-3.5 h-3.5" />
              <span>还原并下载</span>
              <kbd class="hidden md:inline-flex items-center px-1 bg-white/20 text-white rounded text-[9px] font-mono leading-none select-none">
                {{ isMac ? '⌘↵' : 'Ctrl+Enter' }}
              </kbd>
            </button>
            <button 
              @click="showShortcutHelp = true"
              class="px-2.5 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 text-xs font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Keyboard class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">
            输入 Base64 编码 (支持 `data:...;base64,` 格式或纯 Base64)
          </label>
          <textarea
            ref="mainInput"
            v-model="inputBase64ForFile"
            placeholder="请在此粘贴 Base64 代码，我们会自动还原为二进制文件并触发浏览器下载..."
            class="w-full h-[calc(100vh-240px)] min-h-[550px] p-4 font-mono text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 💡 功能说明 -->
    <div class="mt-4 bg-sky-50 rounded-xl p-3 border border-sky-100">
      <h4 class="text-xs font-bold text-sky-800 mb-1">💡 功能说明</h4>
      <ul class="text-[11px] text-sky-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 leading-relaxed">
        <li>• <strong>文本互转</strong>：提供中文字符安全的文本编解码，防止传统 `btoa` 编解码汉字时产生乱码。</li>
        <li>• <strong>文件转 Base64</strong>：读取任意格式的本地文件并输出其 Base64 文本编码。支持一键完整复制或下载。</li>
        <li>• <strong>还原文件</strong>：自动从头部 Data URI 解析出文件 MIME 类型并还原出原始文件供您下载。</li>
        <li>• <strong>安全保障</strong>：所有编解码均在您的浏览器本地执行，文件和敏感数据绝对不会被上传至云端。</li>
      </ul>
    </div>

    <!-- 快捷键说明模态框 -->
    <ToolShortcutHelp 
      :show="showShortcutHelp" 
      :shortcuts="shortcuts" 
      @close="showShortcutHelp = false" 
    />
  </div>
</template>
