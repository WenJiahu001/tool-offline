<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Copy, Check, FileJson, Minimize2, Maximize2, Code, ArrowRightLeft, Wrench, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Upload, Download } from 'lucide-vue-next'

// 使用重构后的逻辑
const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload } = useFileUpload()

// 当前模式
const activeMode = ref<'format' | 'compare'>('format') // format, compare

// 左侧输入
const inputJson = ref('')

// 右侧输入（用于对比）
const compareJson = ref('')

// 输出
const outputJson = ref('')

// 错误信息
const errorMessage = ref('')

// 成功信息
const successMessage = ref('')

// 复制状态
const copied = ref(false)

// 缩进空格数
const indentSize = ref(2)

// 清除消息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

// 显示成功消息
const showSuccess = (msg: string) => {
  successMessage.value = msg
  errorMessage.value = ''
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// 处理文件上传/拖拽
const handleFileSelect = async (files: FileList | File[]) => {
  const file = Array.from(files).find(f => 
    f.type === 'application/json' || 
    f.name.endsWith('.json') || 
    f.type === 'text/plain'
  )
  if (!file) {
    errorMessage.value = '请选择 JSON 或文本文件'
    return
  }

  try {
    const text = await file.text()
    inputJson.value = text
    formatJson()
  } catch (e) {
    errorMessage.value = '文件读取失败'
  }
}

// 智能 JSON 修复
const smartFix = (jsonStr: string) => {
  let fixed = jsonStr.trim()
  
  // 移除 JavaScript 风格的注释
  fixed = fixed.replace(/\/\/.*$/gm, '')
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // 修复单引号为双引号
  fixed = fixed.replace(/'/g, '"')
  
  // 修复没有引号的键名
  fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  
  // 修复尾部逗号
  fixed = fixed.replace(/,\s*([\}\]])/g, '$1')
  
  // 修复 undefined 为 null
  fixed = fixed.replace(/:\s*undefined/g, ': null')
  
  // 修复 NaN 为 null
  fixed = fixed.replace(/:\s*NaN/g, ': null')
  
  // 修复 Infinity
  fixed = fixed.replace(/:\s*Infinity/g, ': null')
  fixed = fixed.replace(/:\s*-Infinity/g, ': null')
  
  return fixed
}

// 尝试解析 JSON（带智能修复）
const tryParseJson = (jsonStr: string, autoFix = false) => {
  try {
    return { success: true, data: JSON.parse(jsonStr), fixed: false }
  } catch (e: any) {
    if (autoFix) {
      try {
        const fixed = smartFix(jsonStr)
        const data = JSON.parse(fixed)
        return { success: true, data, fixed: true, fixedStr: fixed }
      } catch (e2: any) {
        return { success: false, error: e2.message }
      }
    }
    return { success: false, error: e.message }
  }
}

// 格式化 JSON
const formatJson = () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    errorMessage.value = '请输入 JSON 内容'
    return
  }
  
  const result = tryParseJson(inputJson.value, true)
  if (result.success) {
    outputJson.value = JSON.stringify(result.data, null, indentSize.value)
    if (result.fixed) {
      showSuccess('JSON 已自动修复并格式化')
    } else {
      showSuccess('格式化成功')
    }
  } else {
    errorMessage.value = `JSON 解析错误: ${result.error}`
  }
}

// 压缩 JSON
const compressJson = () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    errorMessage.value = '请输入 JSON 内容'
    return
  }
  
  const result = tryParseJson(inputJson.value, true)
  if (result.success) {
    outputJson.value = JSON.stringify(result.data)
    showSuccess('压缩成功')
  } else {
    errorMessage.value = `JSON 解析错误: ${result.error}`
  }
}

// 转义 JSON
const escapeJson = () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    errorMessage.value = '请输入 JSON 内容'
    return
  }
  
  // 先验证是否为有效 JSON
  const result = tryParseJson(inputJson.value, true)
  if (result.success) {
    // 将 JSON 字符串转义为可嵌入字符串
    outputJson.value = JSON.stringify(JSON.stringify(result.data))
    showSuccess('转义成功')
  } else {
    // 如果不是有效 JSON，直接转义字符串
    outputJson.value = JSON.stringify(inputJson.value)
    showSuccess('已将内容转义为字符串')
  }
}

// 去除转义
const unescapeJson = () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    errorMessage.value = '请输入转义后的 JSON 字符串'
    return
  }
  
  try {
    // 尝试解析外层字符串
    let unescaped = JSON.parse(inputJson.value)
    
    // 如果结果还是字符串，尝试再解析一层
    if (typeof unescaped === 'string') {
      try {
        const inner = JSON.parse(unescaped)
        outputJson.value = JSON.stringify(inner, null, indentSize.value)
      } catch {
        outputJson.value = unescaped
      }
    } else {
      outputJson.value = JSON.stringify(unescaped, null, indentSize.value)
    }
    showSuccess('去除转义成功')
  } catch (e: any) {
    errorMessage.value = `解析错误: ${e.message}`
  }
}

// 智能纠错
const fixJson = () => {
  clearMessages()
  if (!inputJson.value.trim()) {
    errorMessage.value = '请输入需要修复的 JSON 内容'
    return
  }
  
  const result = tryParseJson(inputJson.value, true)
  if (result.success) {
    outputJson.value = JSON.stringify(result.data, null, indentSize.value)
    if (result.fixed) {
      showSuccess('JSON 已成功修复！修复内容包括：单引号→双引号、未引用的键名、尾部逗号、注释等')
    } else {
      showSuccess('JSON 格式正确，无需修复')
    }
  } else {
    errorMessage.value = `无法修复的错误: ${result.error}`
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
  } catch (e) {
    errorMessage.value = '复制失败'
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
  compareJson.value = ''
  outputJson.value = ''
  clearMessages()
}

// JSON 差异对比
const diffResult = ref<any[] | null>(null)

const compareJsons = () => {
  clearMessages()
  
  if (!inputJson.value.trim() || !compareJson.value.trim()) {
    errorMessage.value = '请在两侧都输入 JSON 内容'
    return
  }
  
  const left = tryParseJson(inputJson.value, true)
  const right = tryParseJson(compareJson.value, true)
  
  if (!left.success) {
    errorMessage.value = `左侧 JSON 错误: ${left.error}`
    return
  }
  
  if (!right.success) {
    errorMessage.value = `右侧 JSON 错误: ${right.error}`
    return
  }
  
  // 递归对比
  const diff = compareObjects(left.data, right.data, '')
  diffResult.value = diff
  
  if (diff.length === 0) {
    showSuccess('两个 JSON 完全相同')
  } else {
    showSuccess(`发现 ${diff.length} 处差异`)
  }
}

// 递归对比对象
const compareObjects = (obj1: any, obj2: any, path: string) => {
  const diffs: any[] = []
  
  const type1 = getType(obj1)
  const type2 = getType(obj2)
  
  if (type1 !== type2) {
    diffs.push({
      path: path || '(root)',
      type: 'type_change',
      left: { type: type1, value: obj1 },
      right: { type: type2, value: obj2 }
    })
    return diffs
  }
  
  if (type1 === 'object') {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key
      if (!(key in obj1)) {
        diffs.push({ path: newPath, type: 'added', right: obj2[key] })
      } else if (!(key in obj2)) {
        diffs.push({ path: newPath, type: 'removed', left: obj1[key] })
      } else {
        diffs.push(...compareObjects(obj1[key], obj2[key], newPath))
      }
    }
  } else if (type1 === 'array') {
    const maxLen = Math.max(obj1.length, obj2.length)
    for (let i = 0; i < maxLen; i++) {
      const newPath = `${path}[${i}]`
      if (i >= obj1.length) {
        diffs.push({ path: newPath, type: 'added', right: obj2[i] })
      } else if (i >= obj2.length) {
        diffs.push({ path: newPath, type: 'removed', left: obj1[i] })
      } else {
        diffs.push(...compareObjects(obj1[i], obj2[i], newPath))
      }
    }
  } else if (obj1 !== obj2) {
    diffs.push({
      path: path || '(root)',
      type: 'value_change',
      left: obj1,
      right: obj2
    })
  }
  
  return diffs
}

const getType = (val: any) => {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  return typeof val
}

// 格式化显示值
const formatValue = (val: any) => {
  if (typeof val === 'object') {
    return JSON.stringify(val)
  }
  return String(val)
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
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
      <CheckCircle class="w-4 h-4 shrink-0" />
      {{ successMessage }}
    </div>
    
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
                @change="(e: any) => handleFileSelect(e.target.files)"
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
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span class="text-sm font-medium text-gray-700">对比 JSON</span>
          </div>
          <textarea
            v-model="compareJson"
            placeholder="输入第二个 JSON..."
            class="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
      
      <!-- 差异结果 -->
      <div v-if="diffResult" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span class="text-sm font-medium text-gray-700">差异结果 ({{ diffResult.length }} 处)</span>
        </div>
        <div class="max-h-96 overflow-auto">
          <div v-if="diffResult.length === 0" class="p-8 text-center text-gray-500">
            <CheckCircle class="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p class="font-medium">两个 JSON 完全相同</p>
          </div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-4 py-2 text-left text-gray-600 font-medium">路径</th>
                <th class="px-4 py-2 text-left text-gray-600 font-medium">类型</th>
                <th class="px-4 py-2 text-left text-gray-600 font-medium">原始值</th>
                <th class="px-4 py-2 text-left text-gray-600 font-medium">对比值</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(diff, index) in diffResult" :key="index" class="hover:bg-gray-50">
                <td class="px-4 py-2 font-mono text-xs text-gray-900">{{ diff.path }}</td>
                <td class="px-4 py-2">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-medium',
                      diff.type === 'added' ? 'bg-green-100 text-green-700' :
                      diff.type === 'removed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    ]"
                  >
                    {{ diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改' }}
                  </span>
                </td>
                <td class="px-4 py-2 font-mono text-xs max-w-[200px] truncate" :class="diff.type === 'removed' ? 'text-red-600 bg-red-50' : 'text-gray-600'">
                  {{ diff.type === 'added' ? '-' : formatValue(diff.left?.value ?? diff.left) }}
                </td>
                <td class="px-4 py-2 font-mono text-xs max-w-[200px] truncate" :class="diff.type === 'added' ? 'text-green-600 bg-green-50' : 'text-gray-600'">
                  {{ diff.type === 'removed' ? '-' : formatValue(diff.right?.value ?? diff.right) }}
                </td>
              </tr>
            </tbody>
          </table>
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
