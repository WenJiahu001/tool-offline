<script setup lang="ts">
import { X, Keyboard } from 'lucide-vue-next'

interface FormattedShortcut {
  key: string
  description: string
  keys: string[]
}

defineProps<{
  show: boolean
  shortcuts: FormattedShortcut[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100">
        <!-- 头部 -->
        <div class="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2 text-gray-800">
            <Keyboard class="w-5 h-5 text-gray-500" />
            <span class="font-bold text-base">快捷键帮助</span>
          </div>
          <button 
            @click="emit('close')" 
            class="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- 内容 -->
        <div class="p-5 max-h-96 overflow-y-auto space-y-4">
          <div class="divide-y divide-gray-100">
            <div 
              v-for="shortcut in shortcuts" 
              :key="shortcut.key" 
              class="py-3 flex items-center justify-between gap-4"
            >
              <span class="text-sm text-gray-600 font-medium">{{ shortcut.description }}</span>
              <div class="flex gap-1.5 flex-wrap items-center justify-end">
                <kbd 
                  v-for="(k, idx) in shortcut.keys" 
                  :key="idx"
                  class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md shadow-sm inline-flex items-center font-mono"
                >
                  {{ k }}
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            @click="emit('close')" 
            class="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

