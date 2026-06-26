<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="mb-3.5 flex items-baseline gap-3">
    <h1 class="text-xl font-bold text-gray-900">{{ title }}</h1>
    <p class="text-xs text-gray-400 hidden sm:inline">{{ description }}</p>
  </div>
</template>
