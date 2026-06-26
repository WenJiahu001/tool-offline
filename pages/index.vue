<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { Code2, FileText, Image as ImageIcon, QrCode, ScanSearch, Shield, WandSparkles, Clock, Key, Binary, Search, HelpCircle, Keyboard, Database } from 'lucide-vue-next'

useSeoMeta({
  title: 'LocalTools - 免费且安全的在线图片处理与PDF工具箱',
  description: '您的随身本地工具箱，提供图片压缩、PDF合并、图片转PDF等实用功能。纯浏览器运行，数据无需上传服务器，安全、快速、免费。',
  keywords: '在线工具, 本地工具, 图片压缩, PDF合并, 图片转PDF, 免费工具, 数据安全'
})

const router = useRouter()
const { categorizedTools, searchQuery, tools } = useTools()

const searchInput = ref<HTMLInputElement | null>(null)
const isMac = ref(false)

// 用于记录和聚焦最后一次使用的工具路由
const lastActiveRoute = useStorage('last-active-tool-route', '')

const saveActiveRoute = (route: string) => {
  lastActiveRoute.value = route
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    isMac.value = /Mac|iPod|iPad|iPhone/i.test(navigator.userAgent || navigator.platform || '')
  }

  nextTick(() => {
    setTimeout(() => {
      let focused = false
      if (lastActiveRoute.value) {
        const cards = Array.from(document.querySelectorAll('.tool-card')) as HTMLElement[]
        const targetCard = cards.find(card => card.getAttribute('href') === lastActiveRoute.value)
        if (targetCard) {
          targetCard.focus()
          focused = true
        }
      }
      if (!focused && searchInput.value) {
        searchInput.value.focus()
      }
    }, 100)
  })
})

// 全局 Ctrl+K 聚焦搜索框
useShortcuts([
  {
    key: 'ctrl+k',
    description: '聚焦搜索框',
    action: () => {
      if (searchInput.value) {
        searchInput.value.focus()
        searchInput.value.select()
      }
    },
    disabledInInput: false // 输入框中按 Ctrl+K 也允许聚焦
  }
], { enableEscToHome: false })

// 搜索框回车：如果过滤后有工具，跳转至第一个工具
const handleSearchEnter = () => {
  if (categorizedTools.value.length > 0 && categorizedTools.value[0].tools.length > 0) {
    const targetTool = categorizedTools.value[0].tools[0]
    saveActiveRoute(targetTool.route) // 记录进入的工具路由
    router.push(targetTool.route)
  }
}

// 几何位置导航聚焦
const moveFocus = (direction: 'up' | 'down' | 'left' | 'right') => {
  const cards = Array.from(document.querySelectorAll('.tool-card')) as HTMLElement[]
  if (cards.length === 0) return

  const activeEl = document.activeElement as HTMLElement
  const activeIndex = cards.indexOf(activeEl)

  if (activeIndex === -1) {
    // 如果焦点不在任何卡片上，且从搜索框往下按，则聚焦第一个卡片
    if (direction === 'down') {
      cards[0]?.focus()
    }
    return
  }

  // 左右方向键：线性导航（解决换行和边界逻辑）
  if (direction === 'right') {
    const nextIndex = activeIndex + 1
    if (nextIndex < cards.length) {
      cards[nextIndex].focus()
    }
    return
  }

  if (direction === 'left') {
    const prevIndex = activeIndex - 1
    if (prevIndex >= 0) {
      cards[prevIndex].focus()
    } else if (searchInput.value) {
      // 边界情况：在第一个卡片按左，聚焦搜索框
      searchInput.value.focus()
    }
    return
  }

  // 上下方向键：几何位置导航
  const activeRect = activeEl.getBoundingClientRect()
  let bestTarget: HTMLElement | null = null
  let minDistance = Infinity

  cards.forEach(card => {
    if (card === activeEl) return
    const rect = card.getBoundingClientRect()

    let isCorrectDirection = false
    let distance = 0

    const activeCenterX = activeRect.left + activeRect.width / 2
    const activeCenterY = activeRect.top + activeRect.height / 2
    const cardCenterX = rect.left + rect.width / 2
    const cardCenterY = rect.top + rect.height / 2

    const dx = cardCenterX - activeCenterX
    const dy = cardCenterY - activeCenterY

    // 几何距离计算：按移动方向偏重对应轴的距离，并对另一轴做偏移惩罚
    if (direction === 'down' && dy > 5) {
      isCorrectDirection = true
      distance = dy + Math.abs(dx) * 2
    } else if (direction === 'up' && dy < -5) {
      isCorrectDirection = true
      distance = -dy + Math.abs(dx) * 2
    }

    if (isCorrectDirection && distance < minDistance) {
      minDistance = distance
      bestTarget = card
    }
  })

  if (bestTarget) {
    ;(bestTarget as HTMLElement).focus()
  } else if (direction === 'up' && searchInput.value) {
    // 向上无卡片时聚焦搜索框
    searchInput.value.focus()
  }
}

// 处理首页网格键盘事件
const handleGridKeyDown = (e: KeyboardEvent) => {
  // 如果事件起源于搜索框（e.target），全局处理器直接忽略
  if (e.target === searchInput.value) {
    return
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    if (e.key === 'ArrowUp') moveFocus('up')
    if (e.key === 'ArrowDown') moveFocus('down')
    if (e.key === 'ArrowLeft') moveFocus('left')
    if (e.key === 'ArrowRight') moveFocus('right')
  }
}

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
  database: Database
}
</script>

<template>
  <div class="p-3 sm:p-5 md:p-6" @keydown="handleGridKeyDown">
    <div class="max-w-[90rem] mx-auto">
      <!-- 搜索和快捷键指引栏 -->
      <div class="mb-6 max-w-xl mx-auto text-center space-y-2.5">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          极速、安全、纯本地的处理工具箱
        </h1>
        <p class="text-gray-400 text-xs sm:text-sm">
          所有操作均在浏览器内本地执行，数据完全不上传服务器，保护您的隐私安全。
        </p>

        <!-- 极简流光搜索框 -->
        <div class="relative group mt-4">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
          <div class="relative bg-white rounded-lg border border-gray-200/80 shadow-sm flex items-center px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search class="w-4 h-4 text-gray-400 mr-2.5" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="搜索本地工具... (按 Enter 直接进入首个结果)"
              class="w-full text-gray-700 placeholder-gray-400 bg-transparent outline-none text-xs sm:text-sm"
              @keydown.enter="handleSearchEnter"
              @keydown.down.stop.prevent="moveFocus('down')"
            />
            <div class="flex items-center gap-1.5 ml-2 shrink-0">
              <kbd class="hidden sm:inline-flex items-center whitespace-nowrap px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 rounded font-mono shadow-sm">
                {{ isMac ? '⌘' : 'Ctrl' }} + K
              </kbd>
            </div>
          </div>
        </div>

        <!-- 快捷操作小提示 -->
        <div class="flex items-center justify-center gap-3 text-[10px] text-gray-400 mt-1.5 font-medium">
          <span class="flex items-center gap-1">
            <Keyboard class="w-3 h-3" />
            方向键 & Tab 导航卡片
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-mono">Enter</kbd>
            进入工具
          </span>
        </div>
      </div>

      <!-- 空搜索结果 -->
      <div v-if="categorizedTools.length === 0" class="text-center py-16 text-gray-500">
        <HelpCircle class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-base font-semibold">没有找到匹配的工具</p>
        <p class="text-xs text-gray-400 mt-1">请尝试搜索其他关键字</p>
      </div>

      <!-- 分类工具列表 -->
      <div v-for="category in categorizedTools" :key="category.name" class="mb-10">
        <!-- 分类标题 -->
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
            <component :is="categoryIcons[category.name as keyof typeof categoryIcons]" class="h-5 w-5" />
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
            tabindex="0"
            class="tool-card group relative bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95 hover:shadow-xl hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:scale-[1.03] focus:shadow-md"
            @click="saveActiveRoute(tool.route)"
          >
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r" :class="tool.gradient"></div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300" :class="[tool.iconBg, tool.iconColor]">
              <component :is="toolIcons[tool.icon as keyof typeof toolIcons]" class="h-5 w-5" />
            </div>
            <h3 class="text-base font-bold text-gray-900 mb-1.5 transition-colors" :class="tool.hoverColor">{{ tool.name }}</h3>
            <p class="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">{{ tool.description }}</p>
            <div class="mt-auto pt-3 flex items-center text-xs font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 group-focus:translate-y-0" :class="tool.iconColor">
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
