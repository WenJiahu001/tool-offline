<script setup lang="ts">
defineProps<{
  error?: string
  success?: string
}>()

const emit = defineEmits<{
  closeError: []
  closeSuccess: []
}>()
</script>

<template>
  <div v-if="error || success" class="space-y-3">
    <div
      v-if="error"
      class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm"
    >
      <span class="flex-1">{{ error }}</span>
      <button
        class="p-0.5 hover:bg-red-100 rounded transition-colors"
        @click="emit('closeError')"
      >
        关闭
      </button>
    </div>

    <div
      v-if="success"
      class="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm"
    >
      <span class="flex-1">{{ success }}</span>
      <button
        class="p-0.5 hover:bg-green-100 rounded transition-colors"
        @click="emit('closeSuccess')"
      >
        关闭
      </button>
    </div>
  </div>
</template>
