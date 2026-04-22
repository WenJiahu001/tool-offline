<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

defineProps<{
  dragging: boolean
  disabled?: boolean
  loading?: boolean
  title: string
  description: string
  loadingTitle?: string
  loadingDescription?: string
  accent?: 'blue' | 'rose'
  icon: LucideIcon
}>()

const emit = defineEmits<{
  click: []
  dragover: [event: DragEvent]
  dragleave: []
  dragenter: []
  drop: [event: DragEvent]
}>()

const accentClassMap = {
  blue: {
    active: 'border-blue-500 bg-blue-50/50',
    idle: 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
    loading: 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60',
    icon: 'text-blue-600',
    spinner: 'border-blue-600',
  },
  rose: {
    active: 'border-rose-500 bg-rose-50/50',
    idle: 'border-gray-300 hover:border-rose-400 hover:bg-gray-50',
    loading: 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60',
    icon: 'text-rose-600',
    spinner: 'border-rose-600',
  },
} as const
</script>

<template>
  <div
    class="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group"
    :class="{
      [accentClassMap[accent ?? 'blue'].active]: dragging,
      [accentClassMap[accent ?? 'blue'].idle]: !dragging && !disabled,
      [accentClassMap[accent ?? 'blue'].loading]: !!disabled,
    }"
    @dragover="emit('dragover', $event)"
    @dragleave="emit('dragleave')"
    @dragenter="emit('dragenter')"
    @drop="emit('drop', $event)"
    @click="emit('click')"
  >
    <div v-if="loading" class="flex flex-col items-center justify-center py-4">
      <div
        class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mb-4"
        :class="accentClassMap[accent ?? 'blue'].spinner"
      />
      <p class="text-gray-900 font-medium">{{ loadingTitle || '处理中...' }}</p>
      <p v-if="loadingDescription" class="text-gray-500 text-sm mt-1">{{ loadingDescription }}</p>
    </div>

    <div v-else class="flex flex-col items-center justify-center h-full w-full py-2">
      <div class="bg-white p-4 rounded-full mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
        <component :is="icon" class="h-8 w-8" :class="accentClassMap[accent ?? 'blue'].icon" />
      </div>
      <p class="text-gray-900 text-lg font-semibold mb-1">{{ title }}</p>
      <p class="text-gray-500 text-sm">{{ description }}</p>
    </div>
  </div>
</template>
