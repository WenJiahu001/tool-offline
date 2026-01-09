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

// PDF 合并状态
const pdfMergeState = reactive({
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
    handlePdfFileSelect(files)
  }
}

// 处理 PDF 文件选择
const handlePdfFileSelect = (files) => {
  const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf')
  
  if (pdfFiles.length === 0) {
    alert('请选择 PDF 文件！')
    return
  }
  
  pdfMergeState.files = [...pdfMergeState.files, ...pdfFiles]
}

// 调整 PDF 顺序
const movePdfUp = (index) => {
  if (index > 0) {
    const temp = pdfMergeState.files[index]
    pdfMergeState.files[index] = pdfMergeState.files[index - 1]
    pdfMergeState.files[index - 1] = temp
  }
}

const movePdfDown = (index) => {
  if (index < pdfMergeState.files.length - 1) {
    const temp = pdfMergeState.files[index]
    pdfMergeState.files[index] = pdfMergeState.files[index + 1]
    pdfMergeState.files[index + 1] = temp
  }
}

// 删除 PDF 文件
const removePdfFile = (index) => {
  pdfMergeState.files.splice(index, 1)
}

// 合并 PDF
const mergePdfs = async () => {
  if (pdfMergeState.files.length < 2) {
    alert('请至少选择两个 PDF 文件！')
    return
  }
  
  isProcessing.value = true
  
  try {
    const mergedPdf = await PDFDocument.create()
    
    for (const file of pdfMergeState.files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
      pages.forEach(page => mergedPdf.addPage(page))
    }
    
    const pdfBytes = await mergedPdf.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = 'merged.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert('PDF 合并成功！')
  } catch (error) {
    console.error('PDF 合并失败：', error)
    alert('PDF 合并失败，请检查文件是否损坏。')
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
      <h1 class="text-3xl font-bold text-gray-900 mb-2">PDF 合并工具</h1>
      <p class="text-gray-500">将多个 PDF 文件合并为一个文件，支持调整顺序。</p>
    </div>
      
      <!-- 文件输入框 -->
      <input 
        type="file" 
        id="pdfFileInput" 
        ref="fileInput"
        class="hidden" 
        accept="application/pdf"
        multiple
        @change="(e) => !isProcessing && handlePdfFileSelect(e.target.files)"
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
          <p class="text-gray-900 font-medium">正在处理 PDF...</p>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-full w-full py-2">
          <div class="bg-white p-4 rounded-full mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
            <Upload class="h-8 w-8 text-blue-600" />
          </div>
          <p class="text-gray-900 text-lg font-semibold mb-1">点击或拖拽上传 PDF</p>
          <p class="text-gray-500 text-sm">支持批量上传</p>
        </div>
      </div>
      
      <!-- PDF 文件列表 -->
      <div v-if="pdfMergeState.files.length > 0" class="mt-6">
        <h3 class="text-lg font-bold mb-2 text-gray-800">PDF 文件列表</h3>
        <div class="flex flex-col gap-2">
          <div v-for="(file, index) in pdfMergeState.files" :key="index" class="bg-white rounded p-1.5 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all group">
            <!-- 序号 -->
            <div class="w-6 h-6 flex items-center justify-center bg-gray-800 rounded-md text-xs font-bold text-white shrink-0 shadow-sm">
              {{ index + 1 }}
            </div>

            <!-- 图标 -->
            <div class="relative shrink-0">
                <div class="w-8 h-8 flex items-center justify-center bg-red-50 rounded text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
            </div>

            <!-- 文件信息 -->
            <div class="flex-1 min-w-0 flex items-baseline gap-2">
              <p class="text-xs text-gray-700 truncate" :title="file.name">{{ file.name }}</p>
              <p class="text-[10px] text-gray-400 shrink-0">{{ formatFileSize(file.size) }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="p-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                @click="movePdfUp(index)"
                :disabled="index === 0"
                :class="{ 'invisible': index === 0 }"
                title="前移"
              >
                <MoveUp class="h-3 w-3" />
              </button>
              <button 
                class="p-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                @click="movePdfDown(index)"
                :disabled="index === pdfMergeState.files.length - 1"
                :class="{ 'invisible': index === pdfMergeState.files.length - 1 }"
                title="后移"
              >
                <MoveDown class="h-3 w-3" />
              </button>
              <button 
                class="p-0.5 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors ml-1"
                @click="removePdfFile(index)"
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
            @click="mergePdfs"
            :disabled="isProcessing || pdfMergeState.files.length < 2"
          >
            <Download class="h-5 w-5" />
            合并 PDF 并下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>