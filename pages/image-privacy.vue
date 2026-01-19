<script setup>
import { ref, reactive, computed } from 'vue'
import exifr from 'exifr'
import { Upload, Download, Shield, MapPin, Camera, Calendar, Smartphone, AlertTriangle, CheckCircle } from 'lucide-vue-next'

// 图片状态管理
const state = reactive({
  images: []
})

// 拖拽状态
const isDragging = ref(false)

// 处理状态
const isProcessing = ref(false)

// 文件输入框引用
const fileInput = ref(null)

// 创建图片 URL 的辅助函数
const createImageUrl = (file) => {
  if (!file) return ''
  return URL.createObjectURL(file)
}

// 格式化 GPS 坐标
const formatGPS = (lat, lng) => {
  if (!lat || !lng) return null
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`
}

// 格式化日期
const formatDate = (date) => {
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
const parseExifData = async (file) => {
  try {
    const exif = await exifr.parse(file, {
      // 启用所有可能的数据段
      tiff: true,
      exif: true,
      gps: true,
      icc: true,
      iptc: true,
      xmp: true,
      // 额外选项
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })
    
    if (!exif) return null
    
    // 整理并分类 EXIF 数据
    const organized = {
      hasData: false,
      hasGPS: false,
      basic: {},
      camera: {},
      gps: {},
      software: {},
      raw: exif
    }
    
    // 基础信息
    if (exif.ImageWidth) organized.basic['图片宽度'] = exif.ImageWidth + ' px'
    if (exif.ImageHeight) organized.basic['图片高度'] = exif.ImageHeight + ' px'
    if (exif.ExifImageWidth) organized.basic['图片宽度'] = exif.ExifImageWidth + ' px'
    if (exif.ExifImageHeight) organized.basic['图片高度'] = exif.ExifImageHeight + ' px'
    if (exif.ColorSpace) organized.basic['色彩空间'] = exif.ColorSpace
    if (exif.BitsPerSample) organized.basic['位深度'] = exif.BitsPerSample
    
    // 拍摄信息
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
    
    // GPS 信息
    if (exif.latitude && exif.longitude) {
      organized.gps['GPS 坐标'] = formatGPS(exif.latitude, exif.longitude)
      organized.hasGPS = true
    }
    if (exif.GPSAltitude) organized.gps['海拔'] = `${exif.GPSAltitude.toFixed(2)} 米`
    if (exif.GPSSpeed) organized.gps['移动速度'] = `${exif.GPSSpeed} km/h`
    if (exif.GPSImgDirection) organized.gps['拍摄方向'] = `${exif.GPSImgDirection.toFixed(1)}°`
    if (exif.GPSDateStamp) organized.gps['GPS 时间'] = exif.GPSDateStamp
    
    // 软件信息
    if (exif.Software) organized.software['编辑软件'] = exif.Software
    if (exif.Artist) organized.software['作者'] = exif.Artist
    if (exif.Copyright) organized.software['版权'] = exif.Copyright
    if (exif.ImageDescription) organized.software['描述'] = exif.ImageDescription
    if (exif.HostComputer) organized.software['处理设备'] = exif.HostComputer
    
    // 检查是否有数据
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

// 处理文件选择
const handleFileSelect = async (files) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    alert('请选择图片文件！')
    return
  }
  
  isProcessing.value = true
  
  state.images = imageFiles.map(file => ({
    original: file,
    exifData: null,
    isProcessing: true,
    cleaned: null
  }))
  
  // 解析所有图片的 EXIF 数据
  for (let i = 0; i < state.images.length; i++) {
    const image = state.images[i]
    image.exifData = await parseExifData(image.original)
    image.isProcessing = false
  }
  
  isProcessing.value = false
}

// 清除隐私信息（通过 Canvas 重绘）
const cleanImage = (imageData) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.95)
    }
    img.src = URL.createObjectURL(imageData.original)
  })
}

// 下载单张清除隐私后的图片
const downloadCleanedImage = async (imageIndex) => {
  const image = state.images[imageIndex]
  if (!image) return
  
  image.isProcessing = true
  
  try {
    const cleanedBlob = await cleanImage(image)
    const url = URL.createObjectURL(cleanedBlob)
    const a = document.createElement('a')
    a.href = url
    const originalName = image.original.name.replace(/\.[^/.]+$/, '')
    a.download = `${originalName}_cleaned.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } finally {
    image.isProcessing = false
  }
}

// 批量下载清除隐私后的图片
const downloadAllCleanedImages = async () => {
  isProcessing.value = true
  
  for (let i = 0; i < state.images.length; i++) {
    await downloadCleanedImage(i)
    // 添加延迟避免浏览器阻止多个下载
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  isProcessing.value = false
}

// 统计信息
const stats = computed(() => {
  const total = state.images.length
  const withExif = state.images.filter(img => img.exifData?.hasData).length
  const withGPS = state.images.filter(img => img.exifData?.hasGPS).length
  return { total, withExif, withGPS }
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
  title: '图片隐私信息清除 - 查看并移除 EXIF 数据 - LocalTools',
  description: '在线查看图片隐私信息（GPS位置、拍摄设备、时间等），一键清除 EXIF 元数据保护隐私。纯本地处理，数据安全。',
  keywords: '图片隐私, EXIF清除, GPS位置, 隐私保护, 元数据清除, 本地工具'
})
</script>

<template>
  <div class="px-6 py-8 max-w-6xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图片隐私信息清除</h1>
      <p class="text-gray-500">上传图片查看隐私信息，一键清除后安全下载。</p>
    </div>
    
    <!-- 文件输入框 -->
    <input 
      type="file" 
      id="fileInput" 
      ref="fileInput"
      class="hidden" 
      accept="image/*"
      multiple
      @change="(e) => !isProcessing && handleFileSelect(e.target.files)"
    />
    
    <!-- 拖拽上传区域 -->
    <div 
      class="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group" 
      :class="{
        'border-rose-500 bg-rose-50/50': isDragging,
        'border-gray-300 hover:border-rose-400 hover:bg-gray-50': !isDragging && !isProcessing,
        'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60': isProcessing
      }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @dragenter="isDragging = true"
      @click="handleClickUpload"
    >
      
      <!-- 加载状态 -->
      <div v-if="isProcessing" class="flex flex-col items-center justify-center py-4">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600 mb-4"></div>
        <p class="text-gray-900 font-medium">正在分析图片...</p>
        <p class="text-gray-500 text-sm mt-1">正在读取 EXIF 元数据</p>
      </div>
      
      <!-- 正常状态 -->
      <div v-else class="flex flex-col items-center justify-center h-full w-full py-2">
        <div class="bg-white p-4 rounded-full mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
          <Shield class="h-8 w-8 text-rose-600" />
        </div>
        <p class="text-gray-900 text-lg font-semibold mb-1">点击或拖拽上传图片</p>
        <p class="text-gray-500 text-sm">支持 JPG、PNG、HEIC，可批量处理</p>
      </div>
    </div>
    
    <!-- 统计信息和批量操作 -->
    <div v-if="state.images.length > 0 && !isProcessing" class="mt-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <!-- 统计信息 -->
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">共</span>
            <span class="font-semibold text-gray-900">{{ stats.total }}</span>
            <span class="text-gray-500">张图片</span>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <Camera class="w-4 h-4 text-blue-500" />
            <span class="font-semibold text-blue-600">{{ stats.withExif }}</span>
            <span class="text-gray-500">包含 EXIF 数据</span>
          </div>
          <div v-if="stats.withGPS > 0" class="flex items-center gap-2 text-sm">
            <MapPin class="w-4 h-4 text-red-500" />
            <span class="font-semibold text-red-600">{{ stats.withGPS }}</span>
            <span class="text-gray-500">包含 GPS 位置</span>
          </div>
        </div>
        
        <!-- 批量下载按钮 -->
        <button 
          class="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          @click="downloadAllCleanedImages"
          :disabled="isProcessing"
        >
          <Download class="h-4 w-4" />
          一键清除并批量下载
        </button>
      </div>
      
      <!-- 图片列表 -->
      <div class="space-y-6">
        <div v-for="(image, index) in state.images" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
          
          <div class="p-6">
            <div class="flex flex-col lg:flex-row gap-6">
              <!-- 图片预览 -->
              <div class="shrink-0">
                <img 
                  :src="createImageUrl(image.original)" 
                  alt="图片预览" 
                  class="w-48 h-48 object-cover rounded-lg shadow-sm bg-gray-100"
                />
                <div class="mt-2 text-center">
                  <p class="text-sm font-medium text-gray-900 truncate max-w-[192px]">{{ image.original.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(image.original.size) }}</p>
                </div>
              </div>
              
              <!-- EXIF 信息 -->
              <div class="flex-1 min-w-0">
                <!-- 加载状态 -->
                <div v-if="image.isProcessing" class="flex items-center justify-center h-48">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-rose-600 border-t-transparent"></div>
                </div>
                
                <!-- 无数据状态 -->
                <div v-else-if="!image.exifData?.hasData" class="flex flex-col items-center justify-center h-48 text-center">
                  <CheckCircle class="w-12 h-12 text-green-500 mb-3" />
                  <p class="text-gray-900 font-medium">未检测到隐私信息</p>
                  <p class="text-gray-500 text-sm mt-1">此图片不包含 EXIF 元数据</p>
                </div>
                
                <!-- 有数据状态 -->
                <div v-else class="space-y-4">
                  <!-- GPS 警告 -->
                  <div v-if="image.exifData.hasGPS" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle class="w-5 h-5 text-red-600 shrink-0" />
                    <p class="text-sm text-red-800">
                      <span class="font-semibold">警告：</span>此图片包含 GPS 位置信息，可能暴露您的行踪！
                    </p>
                  </div>
                  
                  <!-- 信息分组 -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 拍摄信息 -->
                    <div v-if="Object.keys(image.exifData.camera).length > 0" class="space-y-2">
                      <h4 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Camera class="w-4 h-4" />
                        拍摄信息
                      </h4>
                      <dl class="space-y-1">
                        <div v-for="(value, key) in image.exifData.camera" :key="key" class="flex text-sm">
                          <dt class="text-gray-500 w-24 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-900 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- GPS 信息 -->
                    <div v-if="Object.keys(image.exifData.gps).length > 0" class="space-y-2">
                      <h4 class="text-sm font-semibold text-red-700 flex items-center gap-2">
                        <MapPin class="w-4 h-4" />
                        位置信息
                      </h4>
                      <dl class="space-y-1">
                        <div v-for="(value, key) in image.exifData.gps" :key="key" class="flex text-sm">
                          <dt class="text-gray-500 w-24 shrink-0">{{ key }}</dt>
                          <dd class="text-red-600 font-medium truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- 基础信息 -->
                    <div v-if="Object.keys(image.exifData.basic).length > 0" class="space-y-2">
                      <h4 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Smartphone class="w-4 h-4" />
                        基础信息
                      </h4>
                      <dl class="space-y-1">
                        <div v-for="(value, key) in image.exifData.basic" :key="key" class="flex text-sm">
                          <dt class="text-gray-500 w-24 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-900 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- 软件信息 -->
                    <div v-if="Object.keys(image.exifData.software).length > 0" class="space-y-2">
                      <h4 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar class="w-4 h-4" />
                        软件信息
                      </h4>
                      <dl class="space-y-1">
                        <div v-for="(value, key) in image.exifData.software" :key="key" class="flex text-sm">
                          <dt class="text-gray-500 w-24 shrink-0">{{ key }}</dt>
                          <dd class="text-gray-900 truncate">{{ value }}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="shrink-0 flex lg:flex-col gap-2">
                <button 
                  class="flex-1 lg:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="downloadCleanedImage(index)"
                  :disabled="image.isProcessing"
                >
                  <Download class="w-4 h-4" />
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
