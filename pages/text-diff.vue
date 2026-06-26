<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, Keyboard } from 'lucide-vue-next'
import * as Diff from 'diff'
import { useVirtualList, useStorage } from '@vueuse/core'

useSeoMeta({
  title: '纯文本对比 - LocalTools',
  description: '对比两段代码或文本的变动差异，支持行级增删高亮，纯前端本地处理，保护数据隐私。',
  keywords: '文本对比,代码对比,diff,差异对比,前端工具,本地工具'
})

const router = useRouter()

const originalText = useStorage('text-diff-original', '')
const modifiedText = useStorage('text-diff-modified', '')

const hasDiff = computed(() => originalText.value.trim() !== '' || modifiedText.value.trim() !== '')

const diffResult = computed(() => {
  if (!hasDiff.value) return []
  return Diff.diffLines(originalText.value || '', modifiedText.value || '')
})

const diffLinesOriginal = computed(() => {
  const lines: { text: string, type: string }[] = []
  diffResult.value.forEach((part) => {
    if (!part.added) {
      const partLines = part.value.split('\n')
      if (partLines[partLines.length - 1] === '') {
        partLines.pop()
      }
      partLines.forEach((line) => {
        lines.push({ text: line, type: part.removed ? 'removed' : 'context' })
      })
    }
  })
  return lines
})

const diffLinesModified = computed(() => {
  const lines: { text: string, type: string }[] = []
  diffResult.value.forEach((part) => {
    if (!part.removed) {
      const partLines = part.value.split('\n')
      if (partLines[partLines.length - 1] === '') {
        partLines.pop()
      }
      partLines.forEach((line) => {
        lines.push({ text: line, type: part.added ? 'added' : 'context' })
      })
    }
  })
  return lines
})

const itemHeight = 24

const { 
  list: originalList, 
  containerProps: originalContainerProps, 
  wrapperProps: originalWrapperProps 
} = useVirtualList(diffLinesOriginal, {
  itemHeight
})

const { 
  list: modifiedList, 
  containerProps: modifiedContainerProps, 
  wrapperProps: modifiedWrapperProps 
} = useVirtualList(diffLinesModified, {
  itemHeight
})

// 同步滚动
const handleOriginalScroll = (e: Event) => {
  const target = e.target as HTMLElement
  originalContainerProps.onScroll() // 触发原本的 virtual list 逻辑
  
  // 同步到右侧
  const rightEl = document.getElementById('modified-container')
  if (rightEl) {
    if (rightEl.scrollTop !== target.scrollTop) rightEl.scrollTop = target.scrollTop
    if (rightEl.scrollLeft !== target.scrollLeft) rightEl.scrollLeft = target.scrollLeft
  }
}

const handleModifiedScroll = (e: Event) => {
  const target = e.target as HTMLElement
  modifiedContainerProps.onScroll() // 触发原本的 virtual list 逻辑
  
  // 同步到左侧
  const leftEl = document.getElementById('original-container')
  if (leftEl) {
    if (leftEl.scrollTop !== target.scrollTop) leftEl.scrollTop = target.scrollTop
    if (leftEl.scrollLeft !== target.scrollLeft) leftEl.scrollLeft = target.scrollLeft
  }
}

const clearAll = () => {
  originalText.value = ''
  modifiedText.value = ''
}

// 快捷键和自动聚焦支持
const mainInput = ref<HTMLTextAreaElement | null>(null)
useAutoFocus(mainInput)

const { isMac, shortcuts, showShortcutHelp } = useShortcuts([
  {
    key: 'ctrl+d',
    description: '清空文本',
    action: clearAll
  },
  {
    key: 'alt+c',
    description: '清空文本',
    action: clearAll
  }
])
</script>

<template>
  <div class="max-w-[98%] xl:max-w-[95%] mx-auto space-y-3">
    <ToolPageHeader
      title="纯文本对比"
      description="对比两段代码或文本的变动差异，支持行级增删高亮。"
      icon="file-diff"
      icon-bg="bg-orange-50"
      icon-color="text-orange-600"
    />

    <!-- 工具栏 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-2 px-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Keyboard class="w-3.5 h-3.5 text-gray-400" />
        <span>支持大文本差异行实时渲染。清空快捷键：<kbd class="font-mono bg-gray-100 border px-1 rounded text-[10px]">Ctrl+D</kbd></span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          @click="clearAll"
          class="px-2.5 py-1 text-gray-500 hover:bg-gray-50 border border-gray-100 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 bg-white"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>重置清空</span>
          <kbd class="hidden md:inline-flex items-center px-1 bg-gray-100 text-gray-400 border border-gray-200 rounded text-[9px] font-mono leading-none select-none">
            {{ isMac ? '⌘D' : 'Ctrl+D' }}
          </kbd>
        </button>
        <button
          @click="showShortcutHelp = true"
          class="px-2.5 py-1 text-gray-500 hover:bg-gray-50 border border-gray-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm bg-white"
        >
          <Keyboard class="w-3.5 h-3.5" />
          <span>快捷键</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-gray-700">原文</label>
        <textarea
          ref="mainInput"
          v-model="originalText"
          class="w-full h-[calc(35vh-80px)] min-h-[200px] p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
          placeholder="在此粘贴原文内容..."
        ></textarea>
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-medium text-gray-700">修改文</label>
        <textarea
          v-model="modifiedText"
          class="w-full h-[calc(35vh-80px)] min-h-[200px] p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
          placeholder="在此粘贴修改后的内容..."
        ></textarea>
      </div>
    </div>

    <!-- 结果展示区域 -->
    <div v-show="hasDiff" class="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-800 mb-2">对比结果</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <!-- 原文部分 -->
        <div class="flex flex-col border-r border-gray-200 bg-white">
          <div class="bg-gray-100 border-b border-gray-200 px-3 py-1.5 font-medium text-xs text-gray-600 flex items-center justify-between shrink-0">
            <span>原文</span>
            <span class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full">- 删除</span>
          </div>
          <div 
            id="original-container"
            :ref="originalContainerProps.ref"
            @scroll="handleOriginalScroll"
            class="overflow-auto h-[calc(65vh-180px)] min-h-[350px]"
          >
            <pre class="p-0 m-0 text-sm font-mono leading-6 whitespace-nowrap" v-bind="originalWrapperProps"><div
                v-for="item in originalList"
                :key="'orig' + item.index"
                class="px-4 h-6 flex items-center"
                :class="[
                  item.data.type === 'removed' ? 'bg-red-50 text-red-900' : 'text-gray-800 hover:bg-gray-50'
                ]"
              ><span v-if="item.data.type === 'removed'" class="inline-block w-4 shrink-0 user-select-none text-red-500">-</span><span v-else class="inline-block w-4 shrink-0 user-select-none text-gray-400"> </span><span :class="{ 'line-through opacity-70 text-red-600': item.data.type === 'removed' }">{{ item.data.text || ' ' }}</span></div></pre>
          </div>
        </div>

        <!-- 修改文部分 -->
        <div class="flex flex-col bg-white">
          <div class="bg-gray-100 border-b border-gray-200 px-3 py-1.5 font-medium text-xs text-gray-600 flex items-center justify-between shrink-0">
            <span>修改文</span>
            <span class="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+ 新增</span>
          </div>
          <div 
            id="modified-container"
            :ref="modifiedContainerProps.ref"
            @scroll="handleModifiedScroll"
            class="overflow-auto h-[calc(65vh-180px)] min-h-[350px]"
          >
            <pre class="p-0 m-0 text-sm font-mono leading-6 whitespace-nowrap" v-bind="modifiedWrapperProps"><div
                v-for="item in modifiedList"
                :key="'mod' + item.index"
                class="px-4 h-6 flex items-center"
                :class="[
                  item.data.type === 'added' ? 'bg-green-50 text-green-900' : 'text-gray-800 hover:bg-gray-50'
                ]"
              ><span v-if="item.data.type === 'added'" class="inline-block w-4 shrink-0 user-select-none text-green-600">+</span><span v-else class="inline-block w-4 shrink-0 user-select-none text-gray-400"> </span><span :class="{ 'text-green-700 font-medium': item.data.type === 'added' }">{{ item.data.text || ' ' }}</span></div></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷键说明模态框 -->
    <ToolShortcutHelp 
      :show="showShortcutHelp" 
      :shortcuts="shortcuts" 
      @close="showShortcutHelp = false" 
    />
  </div>
</template>

<style scoped>
.word-break-all {
  word-break: break-all;
}
.user-select-none {
  user-select: none;
}
</style>
