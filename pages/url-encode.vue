<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check, ArrowRightLeft, RotateCcw, Link, Unlink, AlertCircle, CheckCircle, X, Upload, Download } from 'lucide-vue-next'

const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload } = useFileUpload()

// 当前模式
const activeMode = ref<'encode' | 'decode' | 'parse'>('encode')

// 输入输出
const inputText = ref('')
const outputText = ref('')

// 编码选项
const encodeComponent = ref(false) // true = encodeURIComponent, false = encodeURI

// 消息
const errorMessage = ref('')
const successMessage = ref('')

// 复制状态
const copied = ref(false)

// URL 解析结果
const parseResult = ref<any>(null)

// 清除消息
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const showSuccess = (msg: string) => {
  successMessage.value = msg
  errorMessage.value = ''
}

// URL 编码
const encodeUrl = () => {
  clearMessages()
  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要编码的内容'
    return
  }
  try {
    outputText.value = encodeComponent.value
      ? encodeURIComponent(inputText.value)
      : encodeURI(inputText.value)
    showSuccess('编码成功')
  } catch (e: any) {
    errorMessage.value = `编码失败: ${e.message}`
  }
}

// URL 解码
const decodeUrl = () => {
  clearMessages()
  if (!inputText.value.trim()) {
    errorMessage.value = '请输入需要解码的内容'
    return
  }
  try {
    outputText.value = decodeURIComponent(inputText.value)
    showSuccess('解码成功')
  } catch (e: any) {
    errorMessage.value = `解码失败: 输入内容不是有效的编码格式`
  }
}

// 自动检测并编解码（实时）
const handleInput = () => {
  if (activeMode.value === 'parse') {
    parseUrl()
  }
}

// 解析 URL
const parseUrl = () => {
  clearMessages()
  if (!inputText.value.trim()) {
    parseResult.value = null
    return
  }

  try {
    let urlStr = inputText.value.trim()
    // 如果没有协议头，尝试添加
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'https://' + urlStr
    }
    const url = new URL(urlStr)

    parseResult.value = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || '默认',
      pathname: url.pathname,
      hash: url.hash || '无',
      origin: url.origin,
      search: url.search || '无',
      params: [] as { key: string; value: string; encoded: string }[]
    }

    // 解析查询参数
    url.searchParams.forEach((value, key) => {
      parseResult.value.params.push({
        key,
        value,
        encoded: encodeURIComponent(key) + '=' + encodeURIComponent(value)
      })
    })

    showSuccess('URL 解析成功')
  } catch (e: any) {
    errorMessage.value = 'URL 格式不合法，请检查输入'
    parseResult.value = null
  }
}

// 切换编解码方向
const swapDirection = () => {
  if (outputText.value) {
    const temp = inputText.value
    inputText.value = outputText.value
    outputText.value = temp
    clearMessages()
  }
}

// 复制输出
const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    errorMessage.value = '复制失败'
  }
}

// 应用输出到输入
const applyOutput = () => {
  if (outputText.value) {
    inputText.value = outputText.value
    outputText.value = ''
    showSuccess('已应用到输入框')
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  downloadFile(blob, 'url_result.txt')
}

// 文件上传处理
const handleFileSelect = async (files: FileList | File[]) => {
  const file = Array.from(files).find(f =>
    f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.url')
  )
  if (!file) {
    errorMessage.value = '请选择文本文件'
    return
  }
  try {
    const text = await file.text()
    inputText.value = text
    clearMessages()
  } catch (e) {
    errorMessage.value = '文件读取失败'
  }
}

// 清空
const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  parseResult.value = null
  clearMessages()
}

// 切换模式时重置
const switchMode = (mode: 'encode' | 'decode' | 'parse') => {
  activeMode.value = mode
  outputText.value = ''
  parseResult.value = null
  clearMessages()
}

useSeoMeta({
  title: 'URL 编解码工具 - 编码/解码/解析 - LocalTools',
  description: '在线 URL 编码解码工具，支持 URL 编码、解码、查询参数解析。纯本地处理，数据安全。',
  keywords: 'URL编码, URL解码, urlencode, urldecode, URI编码, 查询参数解析, 在线工具'
})
</script>

<template>
  <div class="px-6 py-8 max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">URL 编解码工具</h1>
      <p class="text-gray-500">URL 编码、解码、查询参数解析</p>
    </div>

    <!-- 模式切换 -->
    <div class="flex gap-2 mb-6">
      <button
        @click="switchMode('encode')"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeMode === 'encode'
            ? 'bg-teal-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <Link class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
        编码
      </button>
      <button
        @click="switchMode('decode')"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeMode === 'decode'
            ? 'bg-teal-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <Unlink class="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
        解码
      </button>
      <button
        @click="switchMode('parse')"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeMode === 'parse'
            ? 'bg-teal-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        URL 解析
      </button>
    </div>

    <!-- 消息提示 -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span class="flex-1">{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="p-0.5 hover:bg-red-100 rounded transition-colors">
        <X class="w-4 h-4" />
      </button>
    </div>
    <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
      <CheckCircle class="w-4 h-4 shrink-0" />
      <span class="flex-1">{{ successMessage }}</span>
      <button @click="successMessage = ''" class="p-0.5 hover:bg-green-100 rounded transition-colors">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- 编码/解码模式 -->
    <div v-if="activeMode === 'encode' || activeMode === 'decode'" class="space-y-4">
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="activeMode === 'encode'"
            @click="encodeUrl"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Link class="w-4 h-4" />
            编码
          </button>
          <button
            v-if="activeMode === 'decode'"
            @click="decodeUrl"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Unlink class="w-4 h-4" />
            解码
          </button>
          <button
            @click="swapDirection"
            class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="交换输入与输出"
          >
            <ArrowRightLeft class="w-4 h-4" />
            交换
          </button>

          <div class="flex-1"></div>

          <!-- 编码范围选择（仅编码模式） -->
          <div v-if="activeMode === 'encode'" class="flex items-center gap-3 text-sm text-gray-600">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                :value="false"
                v-model="encodeComponent"
                class="accent-teal-600"
              />
              encodeURI
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                :value="true"
                v-model="encodeComponent"
                class="accent-teal-600"
              />
              encodeURIComponent
            </label>
          </div>

          <button
            @click="clearAll"
            class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors flex items-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      <!-- 编码范围说明 -->
      <div v-if="activeMode === 'encode'" class="bg-teal-50 rounded-lg p-3 border border-teal-100 text-xs text-teal-700">
        <strong>encodeURI</strong>：编码完整 URL，保留 <code class="bg-teal-100 px-1 rounded">:/?#[]@!$&'()*+,;=</code> 等URL分隔符；
        <strong>encodeURIComponent</strong>：编码 URL 组件（参数值等），会编码所有特殊字符。
      </div>

      <!-- 编辑区域 -->
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
        :class="{ 'ring-2 ring-teal-500 rounded-xl': isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="(e) => handleDrop(e, handleFileSelect)"
      >
        <!-- 输入 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">输入</span>
              <button
                @click="triggerUpload"
                class="p-1 hover:bg-gray-200 rounded text-gray-500"
                title="上传文本文件"
              >
                <Upload class="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref="fileInput"
                class="hidden"
                accept=".txt,.url,.text"
                @change="(e: any) => handleFileSelect(e.target.files)"
              />
            </div>
            <span class="text-xs text-gray-400">{{ inputText.length }} 字符</span>
          </div>
          <textarea
            v-model="inputText"
            :placeholder="activeMode === 'encode' ? '输入需要编码的 URL 或文本...' : '输入需要解码的编码字符串...'"
            class="w-full h-72 p-4 font-mono text-sm resize-none focus:outline-none"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- 输出 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">输出</span>
            <div class="flex items-center gap-2">
              <button
                v-if="outputText"
                @click="downloadOutput"
                class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title="下载结果"
              >
                <Download class="w-3 h-3" />
                下载
              </button>
              <button
                v-if="outputText"
                @click="applyOutput"
                class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                应用到输入
              </button>
              <button
                v-if="outputText"
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
            v-model="outputText"
            readonly
            placeholder="处理结果将显示在这里..."
            class="w-full h-72 p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50/50"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- URL 解析模式 -->
    <div v-if="activeMode === 'parse'" class="space-y-4">
      <!-- 工具栏 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex items-center gap-2">
          <button
            @click="parseUrl"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            解析 URL
          </button>
          <button
            @click="clearAll"
            class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors flex items-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      <!-- 输入区域 -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        :class="{ 'ring-2 ring-teal-500': isDragging }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="(e) => handleDrop(e, handleFileSelect)"
      >
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">输入 URL</span>
          <span class="text-xs text-gray-400">{{ inputText.length }} 字符</span>
        </div>
        <textarea
          v-model="inputText"
          placeholder="输入需要解析的 URL，例如：https://example.com/path?name=张三&age=20#section"
          class="w-full h-28 p-4 font-mono text-sm resize-none focus:outline-none"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 解析结果 -->
      <div v-if="parseResult" class="space-y-4">
        <!-- 基本信息卡片 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span class="text-sm font-medium text-gray-700">基本信息</span>
          </div>
          <div class="divide-y divide-gray-100">
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">协议</span>
              <span class="font-mono text-sm text-gray-900 bg-blue-50 px-2 py-0.5 rounded">{{ parseResult.protocol }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">主机名</span>
              <span class="font-mono text-sm text-gray-900">{{ parseResult.hostname }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">端口</span>
              <span class="font-mono text-sm text-gray-900">{{ parseResult.port }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">路径</span>
              <span class="font-mono text-sm text-gray-900 bg-purple-50 px-2 py-0.5 rounded">{{ parseResult.pathname }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">锚点</span>
              <span class="font-mono text-sm text-gray-900 bg-orange-50 px-2 py-0.5 rounded">{{ parseResult.hash }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">Origin</span>
              <span class="font-mono text-sm text-gray-900">{{ parseResult.origin }}</span>
            </div>
            <div class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50">
              <span class="text-sm text-gray-500 w-20 shrink-0">查询字符串</span>
              <span class="font-mono text-sm text-gray-900 bg-green-50 px-2 py-0.5 rounded break-all">{{ parseResult.search }}</span>
            </div>
          </div>
        </div>

        <!-- 查询参数表格 -->
        <div v-if="parseResult.params.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">查询参数 ({{ parseResult.params.length }} 个)</span>
            <button
              @click="copyOutput"
              class="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              <Check v-if="copied" class="w-3 h-3 text-green-600" />
              <Copy v-else class="w-3 h-3" />
              {{ copied ? '已复制' : '复制全部参数' }}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-gray-600 font-medium w-12">#</th>
                  <th class="px-4 py-2.5 text-left text-gray-600 font-medium">参数名</th>
                  <th class="px-4 py-2.5 text-left text-gray-600 font-medium">参数值</th>
                  <th class="px-4 py-2.5 text-left text-gray-600 font-medium">编码后</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(param, index) in parseResult.params" :key="index" class="hover:bg-gray-50">
                  <td class="px-4 py-2.5 text-gray-400 text-xs">{{ index + 1 }}</td>
                  <td class="px-4 py-2.5 font-mono text-teal-700 text-xs bg-teal-50/50">{{ param.key }}</td>
                  <td class="px-4 py-2.5 font-mono text-gray-900 text-xs break-all">{{ param.value }}</td>
                  <td class="px-4 py-2.5 font-mono text-gray-500 text-xs break-all">{{ param.encoded }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="parseResult.search === '无'" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">
          <p class="text-sm">该 URL 不包含查询参数</p>
        </div>
      </div>
    </div>

    <!-- 使用提示 -->
    <div class="mt-6 bg-teal-50 rounded-xl p-4 border border-teal-100">
      <h4 class="text-sm font-semibold text-teal-800 mb-2">💡 功能说明</h4>
      <ul class="text-xs text-teal-700 space-y-1">
        <li>• <strong>编码</strong>：将文本转为 URL 安全格式，支持 encodeURI 和 encodeURIComponent 两种模式</li>
        <li>• <strong>解码</strong>：将编码后的 URL 字符串还原为原始文本</li>
        <li>• <strong>URL 解析</strong>：解析 URL 的协议、主机、路径、查询参数等组成部分</li>
        <li>• <strong>encodeURI</strong> 适合编码完整 URL；<strong>encodeURIComponent</strong> 适合编码参数值</li>
        <li>• 所有处理均在浏览器本地完成，数据不会上传至服务器</li>
      </ul>
    </div>
  </div>
</template>
