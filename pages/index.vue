<script setup lang="ts">
import { Code2, FileText, Image as ImageIcon, QrCode, ScanSearch, Shield, WandSparkles } from 'lucide-vue-next'

useSeoMeta({
  title: 'LocalTools - 免费且安全的在线图片处理与PDF工具箱',
  description: '您的随身本地工具箱，提供图片压缩、PDF合并、图片转PDF等实用功能。纯浏览器运行，数据无需上传服务器，安全、快速、免费。',
  keywords: '在线工具, 本地工具, 图片压缩, PDF合并, 图片转PDF, 免费工具, 数据安全'
})

const { searchQuery, categorizedTools } = useTools()

const categoryIcons = {
  '图片工具': ImageIcon,
  'PDF 工具': FileText,
  '开发工具': Code2,
  '实用工具': QrCode,
}

const toolIcons = {
  image: ImageIcon,
  crop: ScanSearch,
  shield: Shield,
  refresh: WandSparkles,
  'image-to-pdf': FileText,
  pdf: FileText,
  code: Code2,
  link: ScanSearch,
  markdown: Code2,
  qrcode: QrCode,
}
</script>

<template>
  <div class="p-8 sm:p-12">
    <div class="max-w-6xl mx-auto">
      <!-- 头部区域 -->
      <div class="text-center mb-12">
        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          本地工具箱
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          无需上传至服务器，直接在您的浏览器中快速处理文件。高效、安全、免费。
        </p>
      </div>

      <!-- 搜索框 -->
      <div class="max-w-lg mx-auto mb-12">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索工具..."
            class="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm transition-all duration-200"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 分类工具列表 -->
      <div v-for="category in categorizedTools" :key="category.name" class="mb-12">
        <!-- 分类标题 -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
            <component :is="categoryIcons[category.name]" class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ category.name }}</h2>
            <p class="text-xs text-gray-400">{{ category.description }}</p>
          </div>
        </div>

        <!-- 工具网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="tool in category.tools"
            :key="tool.route"
            :to="tool.route"
            class="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
          >
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r" :class="tool.gradient"></div>
            <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" :class="[tool.iconBg, tool.iconColor]">
              <component :is="toolIcons[tool.icon as keyof typeof toolIcons]" class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1.5 transition-colors" :class="tool.hoverColor">{{ tool.name }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ tool.description }}</p>
            <div class="mt-auto pt-4 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0" :class="tool.iconColor">
              立即开始 <span class="ml-1">&rarr;</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 空搜索结果 -->
      <div v-if="categorizedTools.length === 0" class="text-center py-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p class="text-gray-400 text-lg">没有找到匹配的工具</p>
        <p class="text-gray-300 text-sm mt-1">试试其他关键词</p>
      </div>

      <!-- 底部版权 -->
      <div class="text-center mt-16 text-gray-400 text-sm">
        &copy; 2026 LocalTools. All rights reserved.
      </div>
    </div>
  </div>
</template>
