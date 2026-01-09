<script setup>
import { ref, reactive } from 'vue'
import { PDFDocument } from 'pdf-lib'
import { Upload, Download, MoveUp, MoveDown, Trash2 } from 'lucide-vue-next'

// 拖拽状态
const isDragging = ref(false)

// 处理状态
const isProcessing = ref(false)

// 文件输入框引用
const fileInput = ref(null)

// 图片转 PDF 状态
const imageToPdfState = reactive({
  files: []
})

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
    handleImageFileSelect(files)
  }
}

// 处理图片文件选择
const handleImageFileSelect = (files) => {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    alert('请选择图片文件！')
    return
  }
  
  imageToPdfState.files = [...imageToPdfState.files, ...imageFiles]
}

// 调整图片顺序
const moveImageUp = (index) => {
  if (index > 0) {
    const temp = imageToPdfState.files[index]
    imageToPdfState.files[index] = imageToPdfState.files[index - 1]
    imageToPdfState.files[index - 1] = temp
  }
}

const moveImageDown = (index) => {
  if (index < imageToPdfState.files.length - 1) {
    const temp = imageToPdfState.files[index]
    imageToPdfState.files[index] = imageToPdfState.files[index + 1]
    imageToPdfState.files[index + 1] = temp
  }
}

// 删除图片文件
const removeImageFile = (index) => {
  imageToPdfState.files.splice(index, 1)
}

// 图片转 PDF
const imagesToPdf = async () => {
  if (imageToPdfState.files.length === 0) {
    alert('请选择图片文件！')
    return
  }
  
  isProcessing.value = true
  
  try {
    const pdfDoc = await PDFDocument.create()
    
    for (const file of imageToPdfState.files) {
      const arrayBuffer = await file.arrayBuffer()
      const image = await pdfDoc.embedPng(arrayBuffer)
      const page = pdfDoc.addPage([image.width, image.height])
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      })
    }
    
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'images_to_pdf.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert('图片转 PDF 成功！')
  } catch (error) {
    console.error('图片转 PDF 失败：', error)
    alert('图片转 PDF 失败，请检查文件是否损坏。')
  } finally {
    isProcessing.value = false
  }
}

// 点击上传处理
const handleClickUpload = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

useSeoMeta({
  title: '图片转 PDF - 免费在线图片合并 PDF - LocalTools',
  description: '将 JPG、PNG 等多种格式图片批量转换为 PDF 文档。支持自定义排序，保留高清画质，完全本地运行，保护隐私。',
  keywords: '图片转PDF, JPG转PDF, PNG转PDF, 图片合并PDF, 本地工具, 免费转换'
})

// 创建图片 URL
const createImageUrl = (file) => {
  if (!file) return ''
  return URL.createObjectURL(file)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="p-6">
  <div class="px-6 py-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图片合并为 PDF</h1>
      <p class="text-gray-500">将多张图片按顺序合并为一个 PDF 文档。</p>
    </div>
      
      <!-- 文件输入框 -->
      <input 
        type="file" 
        id="imageFileInput" 
        ref="fileInput"
        class="hidden" 
        accept="image/*"
        multiple
        @change="(e) => !isProcessing && handleImageFileSelect(e.target.files)"
      />
      
      <!-- 拖拽上传区域 -->
      <div 
        class="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group" 
        :class="{
          'border-blue-500 bg-blue-50/50': isDragging,
          'border-gray-300 hover:border-blue-400 hover:bg-gray-50': !isDragging && !isProcessing,
          'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60': isProcessing
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="handleClickUpload"
      >
        <div v-if="isProcessing" class="flex flex-col items-center justify-center py-4">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-900 font-medium">正在处理...</p>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-full w-full py-2">
          <div class="bg-white p-4 rounded-full mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
            <Upload class="h-8 w-8 text-blue-600" />
          </div>
          <p class="text-gray-900 text-lg font-semibold mb-1">点击或拖拽上传图片</p>
          <p class="text-gray-500 text-sm">支持批量上传</p>
        </div>
      </div>
      
      <!-- 图片文件列表 -->
      <div v-if="imageToPdfState.files.length > 0" class="mt-6">
        <h3 class="text-lg font-bold mb-2 text-gray-800">图片文件列表</h3>
        <div class="flex flex-col gap-2">
          <div v-for="(file, index) in imageToPdfState.files" :key="index" class="bg-white rounded p-1.5 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all group">
            <!-- 序号 -->
            <div class="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-md text-xs font-bold text-white shrink-0 shadow-sm">
              {{ index + 1 }}
            </div>

            <!-- 图片预览 -->
            <div class="relative shrink-0">
              <img 
                :src="createImageUrl(file)" 
                alt="预览" 
                class="w-8 h-8 object-cover rounded shadow-sm border border-gray-100"
              />
            </div>
            
            <!-- 文件信息 (单行显示) -->
            <div class="flex-1 min-w-0 flex items-baseline gap-2">
              <p class="text-xs text-gray-700 truncate" :title="file.name">{{ file.name }}</p>
              <p class="text-[10px] text-gray-400 shrink-0">{{ formatFileSize(file.size) }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="p-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                @click="moveImageUp(index)"
                :disabled="index === 0"
                :class="{ 'invisible': index === 0 }"
                title="前移"
              >
                <MoveUp class="h-3 w-3" />
              </button>
              <button 
                class="p-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                @click="moveImageDown(index)"
                :disabled="index === imageToPdfState.files.length - 1"
                :class="{ 'invisible': index === imageToPdfState.files.length - 1 }"
                title="后移"
              >
                <MoveDown class="h-3 w-3" />
              </button>
              <button 
                class="p-0.5 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors ml-1"
                @click="removeImageFile(index)"
                title="删除"
              >
                <Trash2 class="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end mt-8">
          <button 
            class="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            @click="imagesToPdf"
            :disabled="isProcessing || imageToPdfState.files.length === 0"
          >
            <Download class="h-5 w-5" />
            转换为 PDF 并下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
