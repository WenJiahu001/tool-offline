<script setup lang="ts">
import { Code2, FileText, Image as ImageIcon, QrCode, ScanSearch, Shield, WandSparkles, Clock, Key, Binary } from 'lucide-vue-next'

useSeoMeta({
  title: 'LocalTools - 免费且安全的在线图片处理与PDF工具箱',
  description: '您的随身本地工具箱，提供图片压缩、PDF合并、图片转PDF等实用功能。纯浏览器运行，数据无需上传服务器，安全、快速、免费。',
  keywords: '在线工具, 本地工具, 图片压缩, PDF合并, 图片转PDF, 免费工具, 数据安全'
})

const { categorizedTools } = useTools()

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
  clock: Clock,
  key: Key,
  binary: Binary,
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-8">
    <div class="max-w-[90rem] mx-auto">
      <!-- 分类工具列表 -->
      <div v-for="category in categorizedTools" :key="category.name" class="mb-10">
        <!-- 分类标题 -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
            <component :is="categoryIcons[category.name]" class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ category.name }}</h2>
            <p class="text-xs text-gray-400">{{ category.description }}</p>
          </div>
        </div>

        <!-- 工具网格 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          <NuxtLink
            v-for="tool in category.tools"
            :key="tool.route"
            :to="tool.route"
            class="group relative bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
          >
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r" :class="tool.gradient"></div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300" :class="[tool.iconBg, tool.iconColor]">
              <component :is="toolIcons[tool.icon as keyof typeof toolIcons]" class="h-5 w-5" />
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1.5 transition-colors" :class="tool.hoverColor">{{ tool.name }}</h3>
            <p class="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">{{ tool.description }}</p>
            <div class="mt-auto pt-3 flex items-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0" :class="tool.iconColor">
              立即开始 <span class="ml-1">&rarr;</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="text-center mt-12 text-gray-400 text-sm">
        &copy; 2026 LocalTools. All rights reserved.
      </div>
    </div>
  </div>
</template>
