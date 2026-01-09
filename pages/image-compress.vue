<script setup>
import { ref, reactive } from 'vue'
import browserImageCompression from 'browser-image-compression'
import { Upload, Download, Info } from 'lucide-vue-next'

// 图片状态管理
const state = reactive({
  images: []
})

// 拖拽状态
const isDragging = ref(false)

// 压缩状态
const isCompressing = ref(false)

// 文件输入框引用
const fileInput = ref(null)

// 压缩配置
const compressionOptions = reactive({
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  initialQuality: 80,
  useWebWorker: true,
  resolutionMode: 'custom' // 'original' | 'custom'
})

// 创建图片 URL 的辅助函数
const createImageUrl = (file) => {
  if (!file) return ''
  return URL.createObjectURL(file)
}

// 处理文件选择
const handleFileSelect = (files) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    alert('请选择图片文件！')
    return
  }
  
  state.images = imageFiles.map(file => ({
    original: file,
    compressed: null,
    originalSize: file.size,
    compressedSize: 0,
    compressionRatio: 0,
    isCompressing: false
  }))
  
  compressImages()
}

// 图片压缩函数
const compressImage = async (imageIndex) => {
  const image = state.images[imageIndex]
  if (!image) return
  
  image.isCompressing = true
  const options = {
    ...compressionOptions,
    initialQuality: compressionOptions.initialQuality / 100
  }

  // 如果选择保持原图分辨率，则移除 maxWidthOrHeight 限制
  if (compressionOptions.resolutionMode === 'original') {
    delete options.maxWidthOrHeight
  }
  
  try {
// 调用 browser-image-compression 库，对原始图片进行压缩
// 参数：image.original 为原始文件对象，options 为压缩配置（最大 1MB、最大宽高 1920、启用 Web Worker）
const compressedFile = await browserImageCompression(image.original, options)

// 将压缩后的文件对象存回响应式数据，触发界面更新
image.compressed = compressedFile

// 记录压缩后文件的字节大小，用于显示
image.compressedSize = compressedFile.size

// 计算压缩率（百分比），公式：(1 - 压缩后大小 / 原始大小) * 100，四舍五入取整
image.compressionRatio = Math.round((1 - image.compressedSize / image.originalSize) * 100)
  } catch (error) {
    console.error('压缩失败：', error)
  } finally {
    image.isCompressing = false
  }
}

// 批量压缩图片
const compressImages = async () => {
  isCompressing.value = true
  
  for (let i = 0; i < state.images.length; i++) {
    await compressImage(i)
  }
  
  isCompressing.value = false
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 下载单张压缩图片
const downloadCompressedImage = (imageIndex) => {
  const image = state.images[imageIndex]
  if (!image || !image.compressed) return
  
  const url = URL.createObjectURL(image.compressed)
  const a = document.createElement('a')
  a.href = url
  a.download = `compressed_${image.original.name}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 批量下载压缩图片
const downloadAllCompressedImages = () => {
  const compressedImages = state.images.filter(image => image.compressed)
  
  if (compressedImages.length === 0) {
    alert('没有可下载的压缩图片！')
    return
  }
  
  compressedImages.forEach((image, index) => {
    setTimeout(() => {
      const url = URL.createObjectURL(image.compressed)
      const a = document.createElement('a')
      a.href = url
      a.download = `compressed_${image.original.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, index * 100)
  })
}

// 拖拽事件处理
const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFileSelect(files)
  }
}

// 点击上传处理
const handleClickUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

useSeoMeta({
  title: '在线图片压缩 - 免费无损压缩 PNG/JPG - LocalTools',
  description: '高效的本地图片压缩工具，无需上传服务器，支持批量压缩 PNG、JPG、WebP 图片，智能平衡画质与体积。用户数据完全安全。',
  keywords: '图片压缩, 在线压缩, PNG压缩, JPG压缩, 本地工具, 免费压缩'
})
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图片压缩工具</h1>
      <p class="text-gray-500">高效压缩 PNG/JPG 图片，智能平衡画质与体积。</p>
    </div>
      
    <!-- 压缩参数设置 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 class="text-lg font-semibold mb-6 text-gray-900 flex items-center gap-2">
        <svg height="20" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>压缩配置</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div class="md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">最大大小(MB)</label>
          <input 
            type="number" 
            v-model.number="compressionOptions.maxSizeMB" 
            min="0.1" 
            max="10" 
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
        </div>

        <div class="md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">初始质量(%)</label>
          <input 
            type="number" 
            v-model.number="compressionOptions.initialQuality" 
            min="10" 
            max="100" 
            step="10"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          >
        </div>

        <!-- 分辨率设置 -->
        <div class="md:col-span-5 flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">分辨率</label>
          <div class="flex flex-wrap items-center gap-2 h-[42px]">
            <div class="flex items-center gap-1">
              <label class="inline-flex items-center cursor-pointer">
                <input type="radio" v-model="compressionOptions.resolutionMode" value="original" class="hidden peer">
                <span class="px-3 py-2 text-sm rounded-lg border border-gray-200 peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 transition-all hover:bg-gray-50 peer-checked:hover:bg-gray-900 whitespace-nowrap">保持原图</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input type="radio" v-model="compressionOptions.resolutionMode" value="custom" class="hidden peer">
                <span class="px-3 py-2 text-sm rounded-lg border border-gray-200 peer-checked:bg-gray-900 peer-checked:text-white peer-checked:border-gray-900 transition-all hover:bg-gray-50 peer-checked:hover:bg-gray-900 whitespace-nowrap">自定义</span>
              </label>
            </div>
            
            <div v-if="compressionOptions.resolutionMode === 'custom'" class="flex items-center gap-1">
               <div class="relative w-24">
                 <input 
                  type="number" 
                  v-model.number="compressionOptions.maxWidthOrHeight" 
                  min="320" 
                  max="4096" 
                  step="10"
                  class="w-full pl-2 pr-6 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                <span class="absolute right-2 top-2.5 text-xs text-gray-400 pointer-events-none">px</span>
              </div>
              
              <div class="group relative flex items-center">
                <Info class="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] p-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed">
                  限制图片的最大边长。若原图宽高均未超过此值，则保持原尺寸；若超过，则在保持比例的前提下缩小至此数值。
                  <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="md:col-span-3 flex justify-end pb-[2px]">
          <button 
            v-if="state.images.length > 0"
            @click="compressImages"
            :disabled="isCompressing"
            class="w-full px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            title="使用当前配置重新压缩所有图片"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新压缩
          </button>
        </div>
      </div>
    </div>  
      <!-- 文件输入框 -->
      <input 
        type="file" 
        id="fileInput" 
        ref="fileInput"
        class="hidden" 
        accept="image/*"
        multiple
        @change="(e) => !isCompressing && handleFileSelect(e.target.files)"
      />
      
      <!-- 拖拽上传区域 -->
      <div 
        class="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group" 
        :class="{
          'border-blue-500 bg-blue-50/50': isDragging,
          'border-gray-300 hover:border-blue-400 hover:bg-gray-50': !isDragging && !isCompressing,
          'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60': isCompressing
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @dragenter="isDragging = true"
        @click="handleClickUpload"
      >
        
        <!-- 加载状态 -->
        <div v-if="isCompressing" class="flex flex-col items-center justify-center py-4">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-900 font-medium">正在压缩图片...</p>
          <p class="text-gray-500 text-sm mt-1">请稍候，处理大图片可能需要一点时间</p>
        </div>
        
        <!-- 正常状态 -->
        <div v-else class="flex flex-col items-center justify-center h-full w-full py-2">
          <div class="bg-white p-4 rounded-full mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
            <Upload class="h-8 w-8 text-blue-600" />
          </div>
          <p class="text-gray-900 text-lg font-semibold mb-1">点击或拖拽上传图片</p>
          <p class="text-gray-500 text-sm">支持 JPG、PNG、WebP，可批量处理</p>
        </div>
      </div>
      
      <!-- 图片预览和数据对比 -->
      <div v-if="state.images.length > 0" class="mt-8">
        <!-- 批量下载按钮 -->
        <div class="flex justify-end mb-6">
          <button 
            class="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            @click="downloadAllCompressedImages"
            :disabled="isCompressing"
          >
            <Download class="h-4 w-4" />
            批量下载
          </button>
        </div>
        
        <!-- 图片列表 -->
        <div class="space-y-6">
          <div v-for="(image, index) in state.images" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <!-- 对比头部 -->
             <div class="grid grid-cols-2 divide-x divide-gray-100 bg-gray-50/50 border-b border-gray-100">
               <div class="p-3 text-center text-sm font-medium text-gray-700">原图</div>
               <div class="p-3 text-center text-sm font-medium text-gray-700">压缩后</div>
             </div>
             
             <!-- 内容区域 -->
             <div class="grid grid-cols-2 divide-x divide-gray-100">
               <!-- 左侧原图 -->
               <div class="p-6 flex flex-col items-center justify-center bg-gray-50/30">
                 <img 
                   :src="createImageUrl(image.original)" 
                   alt="原图" 
                   class="max-h-64 max-w-full object-contain rounded shadow-sm mb-3 bg-white"
                 />
                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                   {{ formatFileSize(image.originalSize) }}
                 </span>
               </div>
               
               <!-- 右侧压缩后 -->
               <div class="p-6 flex flex-col items-center justify-center">
                 <div v-if="image.isCompressing" class="flex flex-col items-center py-12">
                   <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
                   <span class="text-sm text-gray-500">处理中...</span>
                 </div>
                 <template v-else>
                   <img 
                     :src="createImageUrl(image.compressed)" 
                     alt="压缩后图片" 
                     class="max-h-64 max-w-full object-contain rounded shadow-sm mb-3 bg-white"
                   />
                   <div class="flex flex-col items-center gap-2">
                     <div class="flex items-center gap-2">
                       <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                         {{ formatFileSize(image.compressedSize) }}
                       </span>
                       <span v-if="image.compressionRatio > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         -{{ image.compressionRatio }}%
                       </span>
                     </div>
                     <button 
                       v-if="image.compressed" 
                       class="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:underline"
                       @click="downloadCompressedImage(index)"
                     >
                       <Download class="h-3 w-3" />
                       下载此图
                     </button>
                   </div>
                 </template>
               </div>
             </div>
          </div>
        </div>
      </div>
  </div>
</template>