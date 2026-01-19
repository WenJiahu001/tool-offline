<script setup>
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import { Download, QrCode, RefreshCw, Copy, Check } from 'lucide-vue-next'

// 输入文本
const inputText = ref('')

// 二维码配置
const qrOptions = ref({
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  errorCorrectionLevel: 'M'
})

// 预设尺寸
const sizePresets = [
  { label: '小 (200px)', value: 200 },
  { label: '中 (300px)', value: 300 },
  { label: '大 (400px)', value: 400 },
  { label: '超大 (500px)', value: 500 }
]

// 容错级别
const errorLevels = [
  { label: '低 (L)', value: 'L' },
  { label: '中 (M)', value: 'M' },
  { label: '高 (Q)', value: 'Q' },
  { label: '最高 (H)', value: 'H' }
]

// Canvas 引用
const canvasRef = ref(null)

// 是否已生成
const hasQRCode = ref(false)

// 复制状态
const copied = ref(false)

// 生成二维码
const generateQRCode = async () => {
  if (!inputText.value.trim() || !canvasRef.value) {
    hasQRCode.value = false
    return
  }
  
  try {
    await QRCode.toCanvas(canvasRef.value, inputText.value, {
      width: qrOptions.value.width,
      margin: qrOptions.value.margin,
      color: qrOptions.value.color,
      errorCorrectionLevel: qrOptions.value.errorCorrectionLevel
    })
    hasQRCode.value = true
  } catch (error) {
    console.error('生成二维码失败:', error)
    hasQRCode.value = false
  }
}

// 下载二维码
const downloadQRCode = () => {
  if (!canvasRef.value || !hasQRCode.value) return
  
  const link = document.createElement('a')
  link.download = `qrcode_${Date.now()}.png`
  link.href = canvasRef.value.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!canvasRef.value || !hasQRCode.value) return
  
  try {
    const blob = await new Promise(resolve => {
      canvasRef.value.toBlob(resolve, 'image/png')
    })
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 清空
const clearAll = () => {
  inputText.value = ''
  hasQRCode.value = false
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

// 监听变化自动生成
watch([inputText, qrOptions], () => {
  generateQRCode()
}, { deep: true })

// 初始化
onMounted(() => {
  // 设置默认示例文本
  inputText.value = 'https://example.com'
})

useSeoMeta({
  title: '二维码生成器 - 在线免费生成二维码 - LocalTools',
  description: '在线二维码生成器，输入文字或链接即可生成二维码图片。支持自定义尺寸、颜色、容错级别，可下载 PNG 格式。',
  keywords: '二维码生成器, QR Code, 在线工具, 免费二维码, 二维码制作'
})
</script>

<template>
  <div class="px-6 py-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">二维码生成器</h1>
      <p class="text-gray-500">输入文字或链接，即可生成二维码并下载。</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 文本输入 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label class="block text-sm font-semibold text-gray-700 mb-3">
            输入内容
          </label>
          <textarea
            v-model="inputText"
            placeholder="输入文字、网址、电话号码等..."
            class="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm resize-none"
          ></textarea>
          <p class="mt-2 text-xs text-gray-400">已输入 {{ inputText.length }} 个字符</p>
        </div>
        
        <!-- 配置选项 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            配置选项
          </h3>
          
          <div class="space-y-4">
            <!-- 尺寸选择 -->
            <div>
              <label class="block text-sm text-gray-600 mb-2">尺寸</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in sizePresets"
                  :key="preset.value"
                  @click="qrOptions.width = preset.value"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-lg border transition-all',
                    qrOptions.width === preset.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  ]"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>
            
            <!-- 容错级别 -->
            <div>
              <label class="block text-sm text-gray-600 mb-2">容错级别</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="level in errorLevels"
                  :key="level.value"
                  @click="qrOptions.errorCorrectionLevel = level.value"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-lg border transition-all',
                    qrOptions.errorCorrectionLevel === level.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  ]"
                >
                  {{ level.label }}
                </button>
              </div>
            </div>
            
            <!-- 颜色选择 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="block text-sm text-gray-600">颜色方案</label>
                <button
                  @click="() => { const temp = qrOptions.color.dark; qrOptions.color.dark = qrOptions.color.light; qrOptions.color.light = temp }"
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                  title="交换前景色和背景色"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  交换颜色
                </button>
              </div>
              
              <!-- 预设颜色方案 -->
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(scheme, index) in [
                    { dark: '#000000', light: '#ffffff', name: '经典黑白' },
                    { dark: '#1e3a5f', light: '#ffffff', name: '深蓝' },
                    { dark: '#1a472a', light: '#ffffff', name: '深绿' },
                    { dark: '#7c3aed', light: '#ffffff', name: '紫色' },
                    { dark: '#dc2626', light: '#ffffff', name: '红色' },
                    { dark: '#ea580c', light: '#fff7ed', name: '橙色' },
                    { dark: '#0891b2', light: '#ecfeff', name: '青色' },
                    { dark: '#be185d', light: '#fdf2f8', name: '粉色' },
                  ]"
                  :key="index"
                  @click="qrOptions.color.dark = scheme.dark; qrOptions.color.light = scheme.light"
                  class="group relative w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md"
                  :class="qrOptions.color.dark === scheme.dark && qrOptions.color.light === scheme.light ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-gray-200'"
                  :style="{ background: `linear-gradient(135deg, ${scheme.dark} 50%, ${scheme.light} 50%)` }"
                  :title="scheme.name"
                >
                  <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                    {{ scheme.name }}
                  </span>
                </button>
              </div>
              
              <!-- 自定义颜色 -->
              <div class="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">前景色</label>
                  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <label class="relative cursor-pointer">
                      <input
                        type="color"
                        v-model="qrOptions.color.dark"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        class="w-8 h-8 rounded-md border-2 border-white shadow-sm transition-transform hover:scale-105"
                        :style="{ backgroundColor: qrOptions.color.dark }"
                      ></div>
                    </label>
                    <input
                      type="text"
                      v-model="qrOptions.color.dark"
                      class="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      maxlength="7"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">背景色</label>
                  <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <label class="relative cursor-pointer">
                      <input
                        type="color"
                        v-model="qrOptions.color.light"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        class="w-8 h-8 rounded-md border-2 border-gray-200 shadow-sm transition-transform hover:scale-105"
                        :style="{ backgroundColor: qrOptions.color.light }"
                      ></div>
                    </label>
                    <input
                      type="text"
                      v-model="qrOptions.color.light"
                      class="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      maxlength="7"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：预览和下载 -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <QrCode class="w-4 h-4 text-gray-500" />
            预览
          </h3>
          
          <!-- 二维码预览 -->
          <div 
            class="flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 min-h-[320px]"
            :style="{ backgroundColor: qrOptions.color.light }"
          >
            <canvas 
              ref="canvasRef"
              :class="{ 'opacity-30': !inputText.trim() }"
            ></canvas>
          </div>
          
          <!-- 提示文字 -->
          <p v-if="!inputText.trim()" class="mt-4 text-center text-sm text-gray-400">
            请在左侧输入内容以生成二维码
          </p>
          
          <!-- 操作按钮 -->
          <div v-if="hasQRCode" class="mt-6 flex flex-wrap gap-3">
            <button
              @click="downloadQRCode"
              class="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              下载 PNG
            </button>
            <button
              @click="copyToClipboard"
              class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check v-if="copied" class="w-4 h-4 text-green-600" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制' : '复制' }}
            </button>
            <button
              @click="clearAll"
              class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              清空
            </button>
          </div>
        </div>
        
        <!-- 使用提示 -->
        <div class="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
          <h4 class="text-sm font-semibold text-cyan-800 mb-2">💡 使用提示</h4>
          <ul class="text-xs text-cyan-700 space-y-1">
            <li>• 支持输入网址、文字、电话号码等内容</li>
            <li>• 容错级别越高，二维码越复杂但越不易损坏</li>
            <li>• 建议前景色和背景色保持足够对比度</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
