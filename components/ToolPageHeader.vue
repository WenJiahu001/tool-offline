<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ title }}</h1>
    <p class="text-gray-500">{{ description }}</p>
  </div>
</template>
