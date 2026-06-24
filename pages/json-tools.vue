<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check, FileJson, Minimize2, Maximize2, Code, ArrowRightLeft, Wrench, Upload, Download, CheckCircle, Loader2 } from 'lucide-vue-next'
import { formatJsonValue } from '~/utils/json-tools'
import { useStorage, useVirtualList } from '@vueuse/core'

const {
  errorMessage,
  successMessage,
  clearMessages,
  showError,
  showSuccess,
} = useToolFeedback()

const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload, handleInputChange } = useFileUpload({
  accept: ['application/json', 'text/plain', '.json', '.txt'],
  multiple: false,
  onError: showError,
})

// Worker
const { parseJson, compareJson: compareJsonWorker } = useJsonWorker()

// 当前模式
const activeMode = ref<'format' | 'compare'>('format') // format, compare

// 左侧输入
const inputJson = ref('')

// 右侧输入（用于对比）
const compareJsonInput = ref('')

// 输出
const outputJson = ref('')

// 复制状态
const copied = ref(false)

// 处理状态
const isProcessing = ref(false)

// 缩进空格数
const indentSize = useStorage('json-indent-size', 2)

// 处理文件上传/拖拽
const handleFileSelect = async (files: FileList | File[]) => {
  const file = Array.from(files).find(f => 
    f.type === 'application/json' || 
    f.name.endsWith('.json') || 
    f.type === 'text/plain'
  )
  if (!file) {
    showError('请选择 JSON 或文本文件')
    return
  }

  try {
    const text = await file.text()
    inputJson.value = text
    await formatJson()
  } catch {
    showError('文件读取失败')
  }
}

// 格式化 JSON
const formatJson = async () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    showError('请输入 JSON 内容')
    return
  }
  
  isProcessing.value = true
  try {
    const result = await parseJson(inputJson.value, true)
    if (result.success) {
      outputJson.value = JSON.stringify(result.data, null, indentSize.value)
      if (result.fixed) {
        showSuccess('JSON 已自动修复并格式化')
      } else {
        showSuccess('格式化成功')
      }
    } else {
      showError(`JSON 解析错误: ${result.error}`)
    }
  } catch (err: any) {
    showError(err.message)
  } finally {
    isProcessing.value = false
  }
}

// 压缩 JSON
const compressJson = async () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    showError('请输入 JSON 内容')
    return
  }
  
  isProcessing.value = true
  try {
    const result = await parseJson(inputJson.value, true)
    if (result.success) {
      outputJson.value = JSON.stringify(result.data)
      showSuccess('压缩成功')
    } else {
      showError(`JSON 解析错误: ${result.error}`)
    }
  } catch (err: any) {
    showError(err.message)
  } finally {
    isProcessing.value = false
  }
}

// 转义 JSON
const escapeJson = async () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    showError('请输入 JSON 内容')
    return
  }
  
  isProcessing.value = true
  try {
    const result = await parseJson(inputJson.value, true)
    if (result.success) {
      outputJson.value = JSON.stringify(JSON.stringify(result.data))
      showSuccess('转义成功')
    } else {
      outputJson.value = JSON.stringify(inputJson.value)
      showSuccess('已将内容转义为字符串')
    }
  } catch (err: any) {
    showError(err.message)
  } finally {
    isProcessing.value = false
  }
}

// 去除转义
const unescapeJson = async () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    showError('请输入转义后的 JSON 字符串')
    return
  }
  
  isProcessing.value = true
  try {
    // tryParseJson 不会自动去转义字符串内的内容，所以此处我们可以先 parse 一次外层
    const result = await parseJson(inputJson.value, false)
    if (result.success) {
      let unescaped = result.data
      if (typeof unescaped === 'string') {
        const innerResult = await parseJson(unescaped, false)
        if (innerResult.success) {
          outputJson.value = JSON.stringify(innerResult.data, null, indentSize.value)
        } else {
          outputJson.value = unescaped
        }
      } else {
        outputJson.value = JSON.stringify(unescaped, null, indentSize.value)
      }
      showSuccess('去除转义成功')
    } else {
      showError(`解析错误: ${result.error}`)
    }
  } catch (error: any) {
    showError(`解析错误: ${error.message}`)
  } finally {
    isProcessing.value = false
  }
}

// 智能纠错
const fixJson = async () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    showError('请输入需要修复的 JSON 内容')
    return
  }
  
  isProcessing.value = true
  try {
    const result = await parseJson(inputJson.value, true)
    if (result.success) {
      outputJson.value = JSON.stringify(result.data, null, indentSize.value)
      if (result.fixed) {
        showSuccess('JSON 已成功修复！修复内容包括：单引号→双引号、未引用的键名、尾部逗号、注释等')
      } else {
        showSuccess('JSON 格式正确，无需修复')
      }
    } else {
      showError(`无法修复的错误: ${result.error}`)
    }
  } catch (err: any) {
    showError(err.message)
  } finally {
    isProcessing.value = false
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputJson.value) return
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  downloadFile(blob, 'tools_export.json')
}

// 复制输出
const copyOutput = async () => {
  if (!outputJson.value) return
  
  try {
    await navigator.clipboard.writeText(outputJson.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    showError('复制失败')
  }
}

// 应用输出到输入
const applyOutput = () => {
  if (outputJson.value) {
    inputJson.value = outputJson.value
    showSuccess('已应用到输入框')
  }
}

// 清空所有
const clearAll = () => {
  inputJson.value = ''
  compareJsonInput.value = ''
  outputJson.value = ''
  clearMessages()
}

// JSON 差异对比
const diffResult = ref<any[]>([])
const hasCompared = ref(false)

const { list: diffVirtualList, containerProps: diffContainerProps, wrapperProps: diffWrapperProps } = useVirtualList(
  diffResult,
  {
    itemHeight: 48,
  }
)

const compareJsons = async () => {
  clearMessages()
  
  if (!inputJson.value.trim() || !compareJsonInput.value.trim()) {
    showError('请在两侧都输入 JSON 内容')
    return
  }
  
  isProcessing.value = true
  hasCompared.value = false
  try {
    const diff = await compareJsonWorker(inputJson.value, compareJsonInput.value)
    diffResult.value = diff
    hasCompared.value = true
    
    if (diff.length === 0) {
      showSuccess('两个 JSON 完全相同')
    } else {
      showSuccess(`发现 ${diff.length} 处差异`)
    }
  } catch (err: any) {
    showError(err.message)
  } finally {
    isProcessing.value = false
  }
}

useSeoMeta({
  title: 'JSON 工具 - 格式化/压缩/对比/纠错 - LocalTools',
  description: '在线 JSON 工具，支持格式化、压缩、转义、去转义、智能纠错修复、差异对比等功能。纯本地处理，数据安全。',
  keywords: 'JSON格式化, JSON压缩, JSON对比, JSON纠错, 在线工具, JSON工具'
})
</script>

<template>
  <div class="px-6 py-8 max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">JSON 工具</h1>
      <p class="text-gray-500">格式化、压缩、转义、智能纠错、差异对比</p>
    </div>
    
    <!-- 模式切换 -->
    <div class="flex gap-2 mb-6">
      <button
        @click="activeMode = 'format'"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeMode === 'format'
            ? 'bg-amber-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <FileJson class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
        格式化/转义
      </button>
      <button
        @click="activeMode = 'compare'; diffResult = null"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeMode === 'compare'
            ? 'bg-amber-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <ArrowRightLeft class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
        差异对比
      </button>
    </div>
    
    <!-- 消息提示 -->
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />
    
    <!-- 格式化/转义模式 -->
    <div v-if="activeMode === 'format'" class="space-y-4">
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="formatJson"
            class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Maximize2 class="w-4 h-4" />
            格式化
          </button>
          <button
            @click="compressJson"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Minimize2 class="w-4 h-4" />
            压缩
          </button>
          <button
            @click="escapeJson"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Code class="w-4 h-4" />
            转义
          </button>
          <button
            @click="unescapeJson"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Code class="w-4 h-4" />
            去转义
          </button>
          <button
            @click="fixJson"
            class="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Wrench class="w-4 h-4" />
            智能纠错
          </button>
          
          <div class="flex-1"></div>
          
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span>缩进:</span>
            <select
              v-model="indentSize"
              class="px-2 py-1 border border-gray-200 rounded text-sm"
            >
              <option :value="2">2 空格</option>
              <option :value="4">4 空格</option>
              <option :value="1">Tab</option>
            </select>
          </div>
          
          <button
            @click="clearAll"
            class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            清空
          </button>
        </div>
      </div>
      
      <!-- 编辑区域 -->
      <div 
        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
        :class="{ 'ring-2 ring-amber-500 rounded-xl': isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="(e) => handleDrop(e, handleFileSelect)"
      >
        <!-- 输入 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">输入</span>
              <button 
                @click="triggerUpload"
                class="p-1 hover:bg-gray-200 rounded text-gray-500"
                title="上传 JSON 文件"
              >
                <Upload class="w-3.5 h-3.5" />
              </button>
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden" 
                accept=".json,.txt"
                @change="(e) => handleInputChange(e, handleFileSelect)"
              />
            </div>
            <span class="text-xs text-gray-400">{{ inputJson.length }} 字符</span>
          </div>
          <textarea
            v-model="inputJson"
            placeholder="在此输入 JSON 内容，或将文件拖拽至此..."
            class="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>
        
        <!-- 输出 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">输出</span>
            <div class="flex items-center gap-2">
              <button
                v-if="outputJson"
                @click="downloadOutput"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title="下载结果文件"
              >
                <Download class="w-3 h-3" />
                下载
              </button>
              <button
                v-if="outputJson"
                @click="applyOutput"
                class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                应用到输入
              </button>
              <button
                v-if="outputJson"
                @click="copyOutput"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Check v-if="copied" class="w-3 h-3 text-green-600" />
                <Copy v-else class="w-3 h-3" />
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
          <textarea
            v-model="outputJson"
            readonly
            placeholder="处理结果将显示在这里..."
            class="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50/50"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>
    
    <!-- 差异对比模式 -->
    <div v-if="activeMode === 'compare'" class="space-y-4">
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center gap-2">
          <button
            @click="compareJsons"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowRightLeft class="w-4 h-4" />
            开始对比
          </button>
          <button
            @click="clearAll(); diffResult = null"
            class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            清空
          </button>
        </div>
      </div>
      
      <!-- 对比编辑区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 左侧 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span class="text-sm font-medium text-gray-700">原始 JSON</span>
          </div>
          <textarea
            v-model="inputJson"
            placeholder="输入第一个 JSON..."
            class="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>
        
        <!-- 右侧 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span class="text-sm font-medium text-gray-700">对比 JSON</span>
          </div>
          <textarea
            v-model="compareJsonInput"
            placeholder="输入第二个 JSON..."
            class="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
      
      <!-- 加载提示 -->
      <div v-if="isProcessing" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center">
        <Loader2 class="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <span class="text-gray-500">正在处理...</span>
      </div>

      <!-- 差异结果 -->
      <div v-if="hasCompared && !isProcessing" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span class="text-sm font-medium text-gray-700">差异结果 ({{ diffResult.length }} 处)</span>
        </div>
        <div>
          <div v-if="diffResult.length === 0" class="p-8 text-center text-gray-500">
            <CheckCircle class="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p class="font-medium">两个 JSON 完全相同</p>
          </div>
          <div v-else class="w-full text-sm">
            <div class="bg-gray-50 sticky top-0 grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 z-10">
              <div class="text-left text-gray-600 font-medium col-span-3">路径</div>
              <div class="text-left text-gray-600 font-medium col-span-2">类型</div>
              <div class="text-left text-gray-600 font-medium col-span-3">原始值</div>
              <div class="text-left text-gray-600 font-medium col-span-4">对比值</div>
            </div>
            <div v-bind="diffContainerProps" class="max-h-96 overflow-auto">
              <div v-bind="diffWrapperProps" class="divide-y divide-gray-100">
                <div v-for="item in diffVirtualList" :key="item.index" class="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 items-center">
                  <div class="font-mono text-xs text-gray-900 col-span-3 break-all">{{ item.data.path }}</div>
                  <div class="col-span-2">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-medium',
                        item.data.type === 'added' ? 'bg-green-100 text-green-700' :
                        item.data.type === 'removed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      ]"
                    >
                      {{ item.data.type === 'added' ? '新增' : item.data.type === 'removed' ? '删除' : '修改' }}
                    </span>
                  </div>
                  <div class="font-mono text-xs max-w-full truncate col-span-3" :class="item.data.type === 'removed' ? 'text-red-600 bg-red-50 px-1 py-0.5 rounded' : 'text-gray-600'">
                    {{ item.data.type === 'added' ? '-' : formatJsonValue(item.data.left?.value ?? item.data.left) }}
                  </div>
                  <div class="font-mono text-xs max-w-full truncate col-span-4" :class="item.data.type === 'added' ? 'text-green-600 bg-green-50 px-1 py-0.5 rounded' : 'text-gray-600'">
                    {{ item.data.type === 'removed' ? '-' : formatJsonValue(item.data.right?.value ?? item.data.right) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 使用提示 -->
    <div class="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-100">
      <h4 class="text-sm font-semibold text-amber-800 mb-2">💡 功能说明</h4>
      <ul class="text-xs text-amber-700 space-y-1">
        <li>• <strong>格式化</strong>：美美化 JSON，添加缩进和换行</li>
        <li>• <strong>压缩</strong>：移除所有空白字符，生成单行 JSON</li>
        <li>• <strong>转义</strong>：将 JSON 转为可嵌入字符串的格式</li>
        <li>• <strong>去转义</strong>：还原转义后的 JSON 字符串</li>
        <li>• <strong>智能纠错</strong>：自动修复单引号、未引用键名、尾部逗号、注释等非标准格式</li>
        <li>• <strong>差异对比</strong>：逐层对比两个 JSON 的差异</li>
      </ul>
    </div>
  </div>
</template>

