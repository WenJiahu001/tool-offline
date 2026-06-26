<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useStorage } from '@vueuse/core'
import { Upload, Download, RefreshCw } from 'lucide-vue-next'

interface ConvertedImage {
  original: File
  converted: Blob | null
  originalSize: number
  convertedSize: number
  originalType: string
  isConverting: boolean
}

const state = reactive<{ images: ConvertedImage[] }>({
  images: []
})

const {
  errorMessage,
  successMessage,
  showError,
  showSuccess,
} = useToolFeedback()

const previewUrls = useObjectUrlMap()

const isConverting = ref(false)

const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload, handleInputChange } = useFileUpload({
  accept: 'image/*',
  multiple: true,
  disabled: isConverting,
  onError: showError,
})

// 目标格式
const targetFormat = ref<string>('image/png')
const outputQuality = ref<number>(92)

const formatOptions = [
  { label: 'PNG', value: 'image/png', ext: 'png', desc: '无损，支持透明' },
  { label: 'JPG', value: 'image/jpeg', ext: 'jpg', desc: '有损，体积小' },
  { label: 'WebP', value: 'image/webp', ext: 'webp', desc: '新一代格式，体积更小' }
]

const getOriginalPreviewKey = (index: number) => `original-${index}`
const getConvertedPreviewKey = (index: number) => `converted-${index}`

const syncPreviewUrls = () => {
  previewUrls.clear()
  state.images.forEach((image, index) => {
    previewUrls.set(getOriginalPreviewKey(index), image.original)
    previewUrls.set(getConvertedPreviewKey(index), image.converted)
  })
}

const getFormatExt = (mimeType: string) => {
  const opt = formatOptions.find(f => f.value === mimeType)
  return opt ? opt.ext : 'png'
}

const getFormatLabel = (mimeType: string) => {
  const opt = formatOptions.find(f => f.value === mimeType)
  return opt ? opt.label : mimeType.split('/')[1]?.toUpperCase() || '未知'
}

// 处理文件选择
const handleFileSelect = (files: FileList | File[]) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    showError('请选择图片文件！')
    return
  }

  state.images = imageFiles.map(file => ({
    original: file as File,
    converted: null,
    originalSize: file.size,
    convertedSize: 0,
    originalType: file.type,
    isConverting: false
  }))

  syncPreviewUrls()

  convertImages()
}

// 单张图片转换
const convertImage = async (imageIndex: number) => {
  const image = state.images[imageIndex]
  if (!image) return

  image.isConverting = true

  try {
    const img = new Image()
    const url = URL.createObjectURL(image.original)

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    const ctx = canvas.getContext('2d')!

    // JPG 不支持透明，填充白色背景
    if (targetFormat.value === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    const quality = targetFormat.value === 'image/png' ? undefined : outputQuality.value / 100

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('转换失败')),
        targetFormat.value,
        quality
      )
    })

    image.converted = blob
    image.convertedSize = blob.size
    previewUrls.set(getConvertedPreviewKey(imageIndex), blob)
  } catch (error) {
    console.error('转换失败：', error)
    showError(`图片转换失败：${image.original.name}`)
  } finally {
    image.isConverting = false
  }
}

// 批量转换
const convertImages = async () => {
  isConverting.value = true

  for (let i = 0; i < state.images.length; i++) {
    await convertImage(i)
  }

  isConverting.value = false
  showSuccess(`已完成 ${state.images.length} 张图片转换`)
}

// 下载单张
const downloadConvertedImage = (imageIndex: number) => {
  const image = state.images[imageIndex]
  if (!image || !image.converted) return

  const ext = getFormatExt(targetFormat.value)
  const baseName = image.original.name.replace(/\.[^.]+$/, '')
  downloadFile(image.converted, `${baseName}.${ext}`)
}

// 批量下载
const downloadAllConvertedImages = () => {
  const convertedImages = state.images.filter(image => image.converted)

  if (convertedImages.length === 0) {
    showError('没有可下载的图片！')
    return
  }

  const ext = getFormatExt(targetFormat.value)

  convertedImages.forEach((image, index) => {
    setTimeout(() => {
      if (image.converted) {
        const baseName = image.original.name.replace(/\.[^.]+$/, '')
        downloadFile(image.converted, `${baseName}.${ext}`)
      }
    }, index * 100)
  })
  showSuccess('浏览器将依次触发多张图片下载')
}

// 移除单张
const removeImage = (index: number) => {
  state.images.splice(index, 1)
  syncPreviewUrls()
}

// 清空全部
const clearAll = () => {
  state.images = []
  previewUrls.clear()
}

// 计算总大小变化
const totalOriginalSize = computed(() => state.images.reduce((sum, img) => sum + img.originalSize, 0))
const totalConvertedSize = computed(() => state.images.reduce((sum, img) => sum + img.convertedSize, 0))

useSeoMeta({
  title: '图片格式转换 - PNG/JPG/WebP 互转 - LocalTools',
  description: '免费在线图片格式转换工具，支持 PNG、JPG、WebP 互转，批量处理，纯浏览器本地运行，无需上传服务器。',
  keywords: '图片格式转换, PNG转JPG, JPG转PNG, WebP转换, 图片格式, 本地工具'
})

useShortcuts([])
</script>

<template>
  <div class="max-w-[98%] xl:max-w-[95%] mx-auto space-y-3 px-3 py-4">
    <ToolPageHeader
      title="图片格式转换"
      description="支持 PNG、JPG、WebP 格式互转，批量处理，纯本地运行。"
      icon="refresh-cw"
      icon-bg="bg-indigo-50"
      icon-color="text-indigo-600"
    />
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />

    <!-- 转换配置 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-3 px-4">
      <h3 class="text-xs font-semibold mb-3 text-gray-900 flex items-center gap-2">
        <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>转换配置</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <!-- 目标格式选择 -->
        <div class="md:col-span-6 flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-700">目标格式</label>
          <div class="flex flex-wrap gap-1.5">
            <label v-for="fmt in formatOptions" :key="fmt.value" class="inline-flex items-center cursor-pointer">
              <input type="radio" v-model="targetFormat" :value="fmt.value" class="hidden peer">
              <span class="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 transition-all hover:bg-gray-50 peer-checked:hover:bg-gray-900 whitespace-nowrap">
                {{ fmt.label }}
                <span class="text-[10px] opacity-60 ml-1">{{ fmt.desc.split('，')[0] }}</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 输出质量 -->
        <div v-if="targetFormat !== 'image/png'" class="md:col-span-3 flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-700">输出质量</label>
          <div class="flex items-center gap-2">
            <input
              type="range"
              v-model.number="outputQuality"
              min="10"
              max="100"
              step="1"
              class="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            >
            <span class="text-xs font-medium text-gray-700 w-8 text-right font-mono">{{ outputQuality }}%</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="md:col-span-3 flex justify-end gap-1.5">
          <button
            v-if="state.images.length > 0"
            @click="convertImages"
            :disabled="isConverting"
            class="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap"
            title="使用当前配置重新转换所有图片"
          >
            <RefreshCw class="h-3.5 w-3.5" />
            重新转换
          </button>
        </div>
      </div>
    </div>

    <input
      type="file"
      id="fileInput"
      ref="fileInput"
      class="hidden"
      accept="image/*"
      multiple
      @change="(e) => handleInputChange(e, handleFileSelect)"
    />

    <!-- 拖拽上传区域 -->
    <div
      class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 group"
      :class="{
        'border-blue-500 bg-blue-50/50': isDragging,
        'border-gray-300 hover:border-blue-400 hover:bg-gray-50': !isDragging && !isConverting,
        'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60': isConverting
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="(e) => handleDrop(e, handleFileSelect)"
      @dragenter="isDragging = true"
      @click="triggerUpload"
    >
      <div v-if="isConverting" class="flex flex-col items-center justify-center py-2">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
        <p class="text-gray-900 font-medium text-sm">正在转换图片...</p>
        <p class="text-gray-500 text-xs mt-1">请稍候，处理大图片可能需要一点时间</p>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-full w-full py-1">
        <div class="bg-white p-3 rounded-full mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
          <Upload class="h-6 w-6 text-blue-600" />
        </div>
        <p class="text-gray-900 text-base font-semibold mb-1">点击或拖拽上传图片</p>
        <p class="text-gray-500 text-xs">支持 PNG、JPG、WebP、BMP、GIF 等格式，可批量处理</p>
      </div>
    </div>

    <!-- 图片列表 -->
    <div v-if="state.images.length > 0" class="mt-4">
      <!-- 操作栏 -->
      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span>共 {{ state.images.length }} 张图片</span>
          <span v-if="totalConvertedSize > 0" class="font-mono">
            总大小：{{ formatFileSize(totalOriginalSize) }} → {{ formatFileSize(totalConvertedSize) }}
            <span
              v-if="totalConvertedSize < totalOriginalSize"
              class="text-green-600 font-semibold"
            >
              (减少 {{ Math.round((1 - totalConvertedSize / totalOriginalSize) * 100) }}%)
            </span>
            <span
              v-else-if="totalConvertedSize > totalOriginalSize"
              class="text-orange-600 font-semibold"
            >
              (增加 {{ Math.round((totalConvertedSize / totalOriginalSize - 1) * 100) }}%)
            </span>
          </span>
        </div>
        <div class="flex gap-2">
          <button
            @click="clearAll"
            class="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
          >
            清空全部
          </button>
          <button
            class="bg-gray-900 hover:bg-black text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            @click="downloadAllConvertedImages"
            :disabled="isConverting"
          >
            <Download class="h-3.5 w-3.5" />
            批量下载
          </button>
        </div>
      </div>

      <!-- 图片卡片列表 -->
      <div class="space-y-2">
        <div v-for="(image, index) in state.images" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-3 flex items-center gap-4">
            <!-- 原图预览 -->
            <div class="flex-shrink-0 w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                <img
                :src="previewUrls.get(getOriginalPreviewKey(index))"
                alt="原图"
                class="max-w-full max-h-full object-contain"
              />
            </div>

            <!-- 信息区 -->
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-gray-900 truncate mb-1">{{ image.original.name }}</p>
              <div class="flex items-center gap-2.5 text-[10px] text-gray-500 font-mono">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium font-sans">
                  {{ getFormatLabel(image.originalType) }}
                </span>
                <span>{{ formatFileSize(image.originalSize) }}</span>
                <template v-if="image.converted">
                  <span class="text-gray-300 font-sans">→</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium font-sans">
                    {{ getFormatLabel(targetFormat) }}
                  </span>
                  <span>{{ formatFileSize(image.convertedSize) }}</span>
                  <span
                    v-if="image.convertedSize < image.originalSize"
                    class="text-green-600 font-semibold"
                  >
                    -{{ Math.round((1 - image.convertedSize / image.originalSize) * 100) }}%
                  </span>
                  <span
                    v-else-if="image.convertedSize > image.originalSize"
                    class="text-orange-600 font-semibold"
                  >
                    +{{ Math.round((image.convertedSize / image.originalSize - 1) * 100) }}%
                  </span>
                </template>
              </div>
            </div>

            <!-- 转换中状态 -->
            <div v-if="image.isConverting" class="flex-shrink-0">
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            </div>

            <!-- 操作按钮 -->
            <div v-else-if="image.converted" class="flex-shrink-0 flex items-center gap-2">
              <button
                @click="downloadConvertedImage(index)"
                class="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 hover:underline"
              >
                <Download class="h-3.5 w-3.5" />
                下载
              </button>
            </div>

            <!-- 删除按钮 -->
            <button
              @click="removeImage(index)"
              class="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
              title="移除此图片"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
