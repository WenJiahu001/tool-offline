<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, Keyboard, Copy, Check } from 'lucide-vue-next'
import YAML from 'yaml'
import { parseProperties, stringifyProperties } from '~/utils/properties'

useSeoMeta({
  title: '数据格式转换 - LocalTools',
  description: 'JSON、YAML、Properties 格式互转，支持嵌套打平与结构还原，纯前端本地处理，保护数据隐私。',
  keywords: '格式转换,JSON转换,YAML转换,Properties转换,前端工具,本地工具'
})

const router = useRouter()
const formats = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Properties', value: 'properties' }
]

const leftFormat = ref('json')
const rightFormat = ref('yaml')
const leftText = ref('')
const rightText = ref('')
const errorMessage = ref('')
const isLeftToRight = ref(true)

const copied = ref(false)

// Helper to parse string to JS Object
const parseObject = (text: string, format: string) => {
  if (!text.trim()) return null
  if (format === 'json') {
    return JSON.parse(text)
  } else if (format === 'yaml') {
    return YAML.parse(text)
  } else if (format === 'properties') {
    return parseProperties(text)
  }
}

// Helper to stringify JS Object to specific format
const stringifyObject = (obj: any, format: string) => {
  if (obj === null || obj === undefined) return ''
  if (format === 'json') {
    return JSON.stringify(obj, null, 2)
  } else if (format === 'yaml') {
    return YAML.stringify(obj)
  } else if (format === 'properties') {
    return stringifyProperties(obj)
  }
}

const syncConversion = () => {
  errorMessage.value = ''
  try {
    if (isLeftToRight.value) {
      if (!leftText.value.trim()) {
        rightText.value = ''
        return
      }
      const obj = parseObject(leftText.value, leftFormat.value)
      rightText.value = stringifyObject(obj, rightFormat.value) || ''
    } else {
      if (!rightText.value.trim()) {
        leftText.value = ''
        return
      }
      const obj = parseObject(rightText.value, rightFormat.value)
      leftText.value = stringifyObject(obj, leftFormat.value) || ''
    }
  } catch (err: any) {
    errorMessage.value = err.message || '解析错误，请检查输入内容的格式'
  }
}

const handleLeftInput = () => {
  isLeftToRight.value = true
  syncConversion()
}

const handleRightInput = () => {
  isLeftToRight.value = false
  syncConversion()
}

watch([leftFormat, rightFormat], () => {
  syncConversion()
})

const clearAll = () => {
  leftText.value = ''
  rightText.value = ''
  errorMessage.value = ''
}

const copyOutput = async () => {
  const textToCopy = isLeftToRight.value ? rightText.value : leftText.value
  if (!textToCopy) return
  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

// 快捷键和自动聚焦支持
const mainInput = ref<HTMLTextAreaElement | null>(null)
useAutoFocus(mainInput)

const showShortcutHelp = ref(false)

const { isMac, shortcuts } = useShortcuts([
  {
    key: 'ctrl+enter',
    description: '强制重新转换',
    action: syncConversion
  },
  {
    key: 'ctrl+d',
    description: '清空所有',
    action: clearAll
  },
  {
    key: 'alt+c',
    description: '清空所有',
    action: clearAll
  },
  {
    key: 'ctrl+shift+c',
    description: '复制输出结果',
    action: copyOutput
  },
  {
    key: '?',
    description: '显示快捷键帮助',
    action: () => { showShortcutHelp.value = true }
  },
  {
    key: 'esc',
    description: '返回首页',
    action: () => router.push('/')
  }
])
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <ToolPageHeader
      title="数据格式转换"
      description="JSON、YAML、Properties 格式互转，支持嵌套打平与结构还原。"
      icon="file-json-2"
      icon-bg="bg-fuchsia-50"
      icon-color="text-fuchsia-600"
    />

    <!-- 工具栏 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Keyboard class="w-3.5 h-3.5 text-gray-400" />
        <span>支持双向实时转换。复制输出：<kbd class="font-mono bg-gray-100 border px-1 rounded text-[10px]">Ctrl+Shift+C</kbd></span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="leftText || rightText"
          @click="copyOutput"
          class="px-3 py-1.5 text-fuchsia-600 hover:bg-fuchsia-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 border border-fuchsia-100"
        >
          <component :is="copied ? Check : Copy" class="w-4 h-4" />
          <span>{{ copied ? '已复制' : '复制输出' }}</span>
          <kbd class="hidden md:inline-flex items-center px-1 bg-fuchsia-50 text-fuchsia-500 border border-fuchsia-100 rounded text-[9px] font-mono leading-none select-none">
            {{ isMac ? '⌘⇧C' : 'Ctrl+Shift+C' }}
          </kbd>
        </button>
        <button
          @click="clearAll"
          class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 border border-gray-100"
        >
          <RotateCcw class="w-4 h-4" />
          <span>重置</span>
          <kbd class="hidden md:inline-flex items-center px-1 bg-gray-100 text-gray-400 border border-gray-200 rounded text-[9px] font-mono leading-none select-none">
            {{ isMac ? '⌘D' : 'Ctrl+D' }}
          </kbd>
        </button>
        <button
          @click="showShortcutHelp = true"
          class="px-3 py-1.5 text-gray-500 hover:bg-gray-50 border border-gray-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Keyboard class="w-4 h-4" />
          <span>快捷键说明 (按 <kbd class="font-mono bg-white border border-gray-200 px-1 rounded text-[10px] shadow-sm">?</kbd>)</span>
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
      <span class="font-medium">错误：</span>
      <span class="text-sm">{{ errorMessage }}</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-3 flex flex-col h-[600px]">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">源格式/输入</label>
          <select 
            v-model="leftFormat" 
            class="text-sm border-gray-300 rounded-md shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500"
          >
            <option v-for="fmt in formats" :key="'l'+fmt.value" :value="fmt.value">{{ fmt.label }}</option>
          </select>
        </div>
        <textarea
          ref="mainInput"
          v-model="leftText"
          @input="handleLeftInput"
          class="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 font-mono text-sm resize-none"
          placeholder="在此输入内容..."
        ></textarea>
      </div>

      <div class="space-y-3 flex flex-col h-[600px]">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-gray-700">目标格式/输出</label>
          <select 
            v-model="rightFormat" 
            class="text-sm border-gray-300 rounded-md shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500"
          >
            <option v-for="fmt in formats" :key="'r'+fmt.value" :value="fmt.value">{{ fmt.label }}</option>
          </select>
        </div>
        <textarea
          v-model="rightText"
          @input="handleRightInput"
          class="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 font-mono text-sm resize-none"
          placeholder="转换结果将在此显示..."
        ></textarea>
      </div>
    </div>

    <!-- 快捷键说明模态框 -->
    <ToolShortcutHelp 
      :show="showShortcutHelp" 
      :shortcuts="shortcuts" 
      :is-mac="isMac" 
      @close="showShortcutHelp = false" 
    />
  </div>
</template>
