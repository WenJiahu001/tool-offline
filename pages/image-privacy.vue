<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import exifr from 'exifr'
import { Upload, Download, Shield, MapPin, Camera, Calendar, Smartphone, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const {
  errorMessage,
  successMessage,
  showError,
  showSuccess,
} = useToolFeedback()

const previewUrls = useObjectUrlMap()

// 处理状态
const isProcessing = ref(false)

const { isDragging, fileInput, handleDragOver, handleDragLeave, handleDrop, triggerUpload, handleInputChange } = useFileUpload({
  accept: 'image/*',
  multiple: true,
  disabled: isProcessing,
  onError: showError,
})

// 图片状态管理
interface ImageState {
  original: File
  exifData: any | null
  isProcessing: boolean
  cleaned: Blob | null
}

const state = reactive<{ images: ImageState[] }>({
  images: []
})

const getPreviewKey = (index: number) => `original-${index}`

// 格式化 GPS 坐标
const formatGPS = (lat: number, lng: number) => {
  if (lat === undefined || lng === undefined) return null
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`
}

// 格式化日期
const formatDate = (date: any) => {
  if (!date) return null
  if (date instanceof Date) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  return String(date)
}

// 解析 EXIF 数据
const parseExifData = async (file: File) => {
  try {
    const exif = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      icc: true,
      iptc: true,
      xmp: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })
    
    if (!exif) return null
    
    const organized: any = {
      hasData: false,
      hasGPS: false,
      basic: {},
      camera: {},
      gps: {},
      software: {},
      raw: exif
    }
    
    if (exif.ImageWidth) organized.basic['图片宽度'] = exif.ImageWidth + ' px'
    if (exif.ImageHeight) organized.basic['图片高度'] = exif.ImageHeight + ' px'
    if (exif.ExifImageWidth) organized.basic['图片宽度'] = exif.ExifImageWidth + ' px'
    if (exif.ExifImageHeight) organized.basic['图片高度'] = exif.ExifImageHeight + ' px'
    if (exif.ColorSpace) organized.basic['色彩空间'] = exif.ColorSpace
    if (exif.BitsPerSample) organized.basic['位深度'] = exif.BitsPerSample
    
    if (exif.Make) organized.camera['设备厂商'] = exif.Make
    if (exif.Model) organized.camera['设备型号'] = exif.Model
    if (exif.LensModel) organized.camera['镜头型号'] = exif.LensModel
    if (exif.LensMake) organized.camera['镜头厂商'] = exif.LensMake
    if (exif.DateTimeOriginal) organized.camera['拍摄时间'] = formatDate(exif.DateTimeOriginal)
    if (exif.CreateDate) organized.camera['创建时间'] = formatDate(exif.CreateDate)
    if (exif.ModifyDate) organized.camera['修改时间'] = formatDate(exif.ModifyDate)
    if (exif.FNumber) organized.camera['光圈'] = `f/${exif.FNumber}`
    if (exif.ExposureTime) {
      const exposure = exif.ExposureTime < 1 
        ? `1/${Math.round(1/exif.ExposureTime)}` 
        : exif.ExposureTime
      organized.camera['快门速度'] = `${exposure} 秒`
    }
    if (exif.ISO) organized.camera['ISO'] = exif.ISO
    if (exif.FocalLength) organized.camera['焦距'] = `${exif.FocalLength} mm`
    if (exif.FocalLengthIn35mmFormat) organized.camera['等效焦距'] = `${exif.FocalLengthIn35mmFormat} mm`
    if (exif.Flash) organized.camera['闪光灯'] = exif.Flash
    if (exif.WhiteBalance) organized.camera['白平衡'] = exif.WhiteBalance
    if (exif.ExposureMode) organized.camera['曝光模式'] = exif.ExposureMode
    if (exif.MeteringMode) organized.camera['测光模式'] = exif.MeteringMode
    if (exif.Orientation) organized.camera['方向'] = exif.Orientation
    
    if (exif.latitude !== undefined && exif.longitude !== undefined) {
      organized.gps['GPS 坐标'] = formatGPS(exif.latitude, exif.longitude)
      organized.hasGPS = true
    }
    if (exif.GPSAltitude) organized.gps['海拔'] = `${exif.GPSAltitude.toFixed(2)} 米`
    if (exif.GPSSpeed) organized.gps['移动速度'] = `${exif.GPSSpeed} km/h`
    if (exif.GPSImgDirection) organized.gps['拍摄方向'] = `${exif.GPSImgDirection.toFixed(1)}°`
    if (exif.GPSDateStamp) organized.gps['GPS 时间'] = exif.GPSDateStamp
    
    if (exif.Software) organized.software['编辑软件'] = exif.Software
    if (exif.Artist) organized.software['作者'] = exif.Artist
    if (exif.Copyright) organized.software['版权'] = exif.Copyright
    if (exif.ImageDescription) organized.software['描述'] = exif.ImageDescription
    if (exif.HostComputer) organized.software['处理设备'] = exif.HostComputer
    
    organized.hasData = Object.keys(organized.basic).length > 0 ||
                        Object.keys(organized.camera).length > 0 ||
                        Object.keys(organized.gps).length > 0 ||
                        Object.keys(organized.software).length > 0
    
    return organized
  } catch (error) {
    console.error('EXIF 解析失败:', error)
    return null
  }
}

const handleFileSelect = async (files: FileList | File[]) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    showError('请选择图片文件！')
    return
  }
  
  isProcessing.value = true
  
  state.images = imageFiles.map(file => ({
    original: file as File,
    exifData: null,
    isProcessing: true,
    cleaned: null
  }))

  previewUrls.clear()
  state.images.forEach((image, index) => {
    previewUrls.set(getPreviewKey(index), image.original)
  })
  
  for (let i = 0; i < state.images.length; i++) {
    const image = state.images[i]
    image.exifData = await parseExifData(image.original)
    image.isProcessing = false
  }
  
  isProcessing.value = false
}

const cleanImage = (imageData: ImageState): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageData.original)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          resolve(blob)
        }, 'image/jpeg', 0.95)
      } else {
        URL.revokeObjectURL(url)
        resolve(null)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

const downloadCleanedImage = async (imageIndex: number) => {
  const image = state.images[imageIndex]
  if (!image) return
  
  image.isProcessing = true
  
  try {
    const cleanedBlob = await cleanImage(image)
    if (cleanedBlob) {
      const originalName = image.original.name.replace(/\.[^/.]+$/, '')
      downloadFile(cleanedBlob, `${originalName}_cleaned.jpg`)
      showSuccess(`已清除并下载：${image.original.name}`)
    }
  } finally {
    image.isProcessing = false
  }
}

const downloadAllCleanedImages = async () => {
  isProcessing.value = true
  
  for (let i = 0; i < state.images.length; i++) {
    await downloadCleanedImage(i)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  isProcessing.value = false
  showSuccess('浏览器将依次触发多张图片下载')
}

const stats = computed(() => {
  const total = state.images.length
  const withExif = state.images.filter(img => img.exifData?.hasData).length
  const withGPS = state.images.filter(img => img.exifData?.hasGPS).length
  return { total, withExif, withGPS }
})

useSeoMeta({
  title: '图片隐私信息清除 - 查看并移除 EXIF 数据 - LocalTools',
  description: '在线查看图片隐私信息（GPS位置、拍摄设备、时间等），一键清除 EXIF 元数据保护隐私。纯本地处理，数据安全。',
  keywords: '图片隐私, EXIF清除, GPS位置, 隐私保护, 元数据清除, 本地工具'
})

useShortcuts([])
</script>

<template>
  <div class="max-w-[98%] xl:max-w-[95%] mx-auto space-y-3 px-3 py-4">
    <ToolPageHeader
      title="图片隐私信息清除"
      description="上传图片查看隐私信息，一键清除后安全下载。"
      icon="shield"
      icon-bg="bg-rose-50"
      icon-color="text-rose-600"
    />
    <ToolFeedback
      :error="errorMessage"
      :success="successMessage"
      @close-error="errorMessage = ''"
      @close-success="successMessage = ''"
    />
    
    <!-- 文件输入框 -->
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
        'border-rose-500 bg-rose-50/50': isDragging,
        'border-gray-300 hover:border-rose-400 hover:bg-gray-50': !isDragging && !isProcessing,
        'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60': isProcessing
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="(e) => handleDrop(e, handleFileSelect)"
      @dragenter="isDragging = true"
      @click="triggerUpload"
    >
      
      <!-- 加载状态 -->
      <div v-if="isProcessing" class="flex flex-col items-center justify-center py-2">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600 mb-2"></div>
        <p class="text-gray-900 font-medium text-sm">正在分析图片...</p>
        <p class="text-gray-500 text-xs mt-1">正在读取 EXIF 元数据</p>
      </div>
      
      <!-- 正常状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full w-full py-1">
        <div class="bg-white p-3 rounded-full mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
          <Shield class="h-6 w-6 text-rose-600" />
        </div>
        <p class="text-gray-900 text-base font-semibold mb-1">点击或拖拽上传图片</p>
        <p class="text-gray-500 text-xs">支持 JPG、PNG、HEIC，可批量处理</p>
      </div>
    </div>
    
    <!-- 统计信息和批量操作 -->
    <div v-if="state.images.length > 0 && !isProcessing" class="mt-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <!-- 统计信息 -->
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-gray-500">共</span>
            <span class="font-bold text-gray-900">{{ stats.total }}</span>
            <span class="text-gray-500">张图片</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <Camera class="w-3.5 h-3.5 text-blue-500" />
            <span class="font-bold text-blue-600">{{ stats.withExif }}</span>
            <span class="text-gray-500 font-medium">包含 EXIF 数据</span>
          </div>
          <div v-if="stats.withGPS > 0" class="flex items-center gap-1.5 text-xs">
            <MapPin class="w-3.5 h-3.5 text-red-500" />
            <span class="font-bold text-red-600">{{ stats.withGPS }}</span>
            <span class="text-gray-500 font-medium">包含 GPS 位置</span>
          </div>
        </div>
        
        <!-- 批量下载按钮 -->
        <button 
          class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          @click="downloadAllCleanedImages"
          :disabled="isProcessing"
        >
          <Download class="h-3.5 w-3.5" />
          一键清除并批量下载
        </button>
      </div>
      
      <!-- 图片列表 -->
      <div class="space-y-3">
        <div v-for="(image, index) in state.images" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <div class="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 to-pink-500"></div>
          
          <div class="p-4">
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- 图片预览 -->
              <div class="shrink-0 flex flex-col items-center justify-center bg-gray-50/20 p-2 rounded-lg border border-gray-100/50">
                <img 
                  :src="previewUrls.get(getPreviewKey(index))" 
                  alt="图片预览" 
                  class="w-32 h-32 object-cover rounded-lg shadow-sm bg-gray-100"
                />
                <div class="mt-2 text-center max-w-[128px]">
                  <p class="text-xs font-semibold text-gray-900 truncate" :title="image.original.name">{{ image.original.name }}</p>
                  <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ formatFileSize(image.original.size) }}</p>
                </div>
              </div>
              
              <!-- EXIF 信息 -->
              <div class="flex-1 min-w-0">
                <!-- 加载状态 -->
                <div v-if="image.isProcessing" class="flex items-center justify-center h-32">
                  <div class="animate-spin rounded-full h-6 w-6 border-2 border-rose-600 border-t-transparent"></div>
                </div>
                
                <!-- 无数据状态 -->
                <div v-else-if="!image.exifData?.hasData" class="flex flex-col items-center justify-center h-32 text-center">
                  <CheckCircle class="w-10 h-10 text-green-500 mb-2" />
                  <p class="text-sm font-semibold text-gray-900">未检测到隐私信息</p>
                  <p class="text-xs text-gray-400 mt-0.5">此图片不包含 EXIF 元数据</p>
                </div>
                
                <!-- 有数据状态 -->
                <div v-else class="space-y-3">
                  <!-- GPS 警告 -->
                  <div v-if="image.exifData.hasGPS" class="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle class="w-4 h-4 text-red-600 shrink-0" />
                    <p class="text-xs text-red-800">
                      <span class="font-bold">警告：</span>此图片包含 GPS 位置信息，可能暴露您的行踪！
                    </p>
                  </div>
                  
                  <!-- 信息分组 -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <!-- 拍摄信息 -->
                    <div v-if="Object.keys(image.exifData.camera).length > 0" class="space-y-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                       <h4 class="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Camera class="w-3.5 h-3.5 text-gray-500" />
                        拍摄信息
                      </h4>
                      <dl class="space-y-0.5 text-[11px]">
                        <div v-for="(value, key) in image.exifData.camera" :key="key" class="flex">
                          <dt class="text-gray-400 w-16 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-800 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- GPS 信息 -->
                    <div v-if="Object.keys(image.exifData.gps).length > 0" class="space-y-1 bg-red-50/20 p-2.5 rounded-lg border border-red-100/50">
                      <h4 class="text-xs font-bold text-red-700 flex items-center gap-1">
                        <MapPin class="w-3.5 h-3.5 text-red-500" />
                        位置信息
                      </h4>
                      <dl class="space-y-0.5 text-[11px]">
                        <div v-for="(value, key) in image.exifData.gps" :key="key" class="flex">
                          <dt class="text-gray-400 w-16 shrink-0">{{ key }}</dt>
                          <dd class="text-red-600 font-medium truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- 基础信息 -->
                    <div v-if="Object.keys(image.exifData.basic).length > 0" class="space-y-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                      <h4 class="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Smartphone class="w-3.5 h-3.5 text-gray-500" />
                        基础信息
                      </h4>
                      <dl class="space-y-0.5 text-[11px]">
                        <div v-for="(value, key) in image.exifData.basic" :key="key" class="flex">
                          <dt class="text-gray-400 w-16 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-800 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- 软件信息 -->
                    <div v-if="Object.keys(image.exifData.software).length > 0" class="space-y-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                      <h4 class="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Calendar class="w-3.5 h-3.5 text-gray-500" />
                        软件信息
                      </h4>
                      <dl class="space-y-0.5 text-[11px]">
                        <div v-for="(value, key) in image.exifData.software" :key="key" class="flex">
                          <dt class="text-gray-400 w-16 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-800 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="shrink-0 flex lg:flex-col items-center justify-center">
                <button 
                  class="w-full px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  @click="downloadCleanedImage(index)"
                  :disabled="image.isProcessing"
                >
                  <Download class="w-3.5 h-3.5" />
                  清除并下载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 可以在这里添加微调样式 */
</style>
