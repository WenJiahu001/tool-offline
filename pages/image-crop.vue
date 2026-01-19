<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">图片裁剪工具</h1>
      <p class="mt-2 text-gray-600">支持自定义尺寸和常用证件照尺寸裁剪，简单好用。</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 裁剪区域 -->
      <div class="lg:col-span-2">
        <div class="bg-gray-100 rounded-xl shadow-sm border border-gray-200 overflow-hidden relative h-[600px] flex items-center justify-center">
          <ClientOnly>
             <div v-if="!imgSrc" class="text-center p-8">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <Upload class="h-8 w-8 text-blue-600" />
                </div>
                <h3 class="text-lg font-medium text-gray-900">选择一张图片开始裁剪</h3>
                <p class="mt-1 text-gray-500 mb-6">支持 JPG, PNG 等常见格式</p>
                <button
                  @click="triggerUpload"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload class="w-5 h-5 mr-2" />
                  上传图片
                </button>
             </div>
             
             <VueCropper
               v-else
               ref="cropper"
               :img="imgSrc"
               :outputSize="option.size"
               :outputType="option.outputType"
               :info="true"
               :full="option.full"
               :canMove="option.canMove"
               :canMoveBox="option.canMoveBox"
               :fixedBox="option.fixedBox"
               :original="option.original"
               :autoCrop="option.autoCrop"
               :autoCropWidth="option.autoCropWidth"
               :autoCropHeight="option.autoCropHeight"
               :centerBox="option.centerBox"
               :high="option.high"
               :maxImgSize="option.maxImgSize"
               :fixed="option.fixed"
               :fixedNumber="option.fixedNumber"
               mode="contain"
               @realTime="handleRealTime"
               @cropMoving="handleCropMoving"
             ></VueCropper>
          </ClientOnly>
          
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/*" 
            class="hidden" 
            @change="handleFileChange"
          />
        </div>
        
        <!-- 底部工具栏 (仅在有图片时显示) -->
        <div v-if="imgSrc" class="mt-4 flex flex-wrap gap-4 items-center justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
           <button @click="rotateLeft" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="向左旋转">
             <RotateCcw class="w-5 h-5" />
           </button>
           <button @click="rotateRight" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="向右旋转">
             <RotateCw class="w-5 h-5" />
           </button>
           <div class="w-px h-6 bg-gray-300 mx-2"></div>
           <button @click="changeScale(1)" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="放大">
             <ZoomIn class="w-5 h-5" />
           </button>
           <button @click="changeScale(-1)" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="缩小">
             <ZoomOut class="w-5 h-5" />
           </button>
           <div class="w-px h-6 bg-gray-300 mx-2"></div>
           <button @click="resetObj" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="重置">
             <RefreshCw class="w-5 h-5" />
           </button>
        </div>
      </div>

      <!-- 右侧控制面板 -->
      <div class="space-y-6">
        <!-- 尺寸设置 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">裁剪尺寸</h3>
          
          <div class="space-y-4">
            <!-- 预设尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">常用尺寸</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in presets"
                  :key="preset.name"
                  @click="applyPreset(preset)"
                  :class="[
                    'px-3 py-2 text-sm text-left rounded-md border transition-colors',
                    currentPreset?.name === preset.name
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 text-gray-700'
                  ]"
                >
                  <div class="font-medium">{{ preset.name }}</div>
                  <div class="text-xs text-gray-500">{{ preset.width }}x{{ preset.height }}mm</div>
                </button>
              </div>
            </div>

            <!-- 自定义尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">自定义 (像素)</label>
              <div class="flex items-center gap-2">
                <div class="relative rounded-md shadow-sm">
                   <input
                     v-model.number="customWidth"
                     type="number"
                     class="block w-full rounded-md border-gray-300 border p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                     placeholder="宽"
                     @input="handleCustomSizeChange"
                   />
                   <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                     <span class="text-gray-500 sm:text-sm">px</span>
                   </div>
                </div>
                <span class="text-gray-400">×</span>
                 <div class="relative rounded-md shadow-sm">
                   <input
                     v-model.number="customHeight"
                     type="number"
                     class="block w-full rounded-md border-gray-300 border p-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                     placeholder="高"
                     @input="handleCustomSizeChange"
                   />
                   <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                     <span class="text-gray-500 sm:text-sm">px</span>
                   </div>
                </div>
              </div>
              <div class="mt-2 flex items-center">
                 <input 
                    id="fixed-ratio" 
                    type="checkbox" 
                    v-model="option.fixed" 
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                 >
                 <label for="fixed-ratio" class="ml-2 block text-sm text-gray-900">
                   锁定比例
                 </label>
              </div>
            </div>
            
          </div>
        </div>

        <!-- 导出设置 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <h3 class="text-lg font-medium text-gray-900 mb-4">导出</h3>
           <div class="space-y-4">
              <button
                @click="downloadImage"
                :disabled="!imgSrc"
                class="w-full flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download class="w-5 h-5 mr-2" />
                下载裁剪图片
              </button>
              
              <button
                @click="triggerUpload"
                class="w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                重新上传
              </button>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { Upload, Download, RefreshCw, ZoomIn, ZoomOut, RotateCw, RotateCcw } from 'lucide-vue-next'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

// 预设尺寸定义 (按300DPI计算像素: 1mm ≈ 11.81px)
const DPI = 300
const MM_TO_PX = DPI / 25.4

// 定义预设类型
interface Preset {
  name: string
  width: number
  height: number
  unit: string
}

const presets: Preset[] = [
  { name: '小一寸', width: 22, height: 32, unit: 'mm' },
  { name: '一寸', width: 25, height: 35, unit: 'mm' },
  { name: '大一寸', width: 33, height: 48, unit: 'mm' },
  { name: '两寸', width: 35, height: 49, unit: 'mm' },
  { name: '大两寸', width: 35, height: 53, unit: 'mm' },
  { name: '五寸', width: 89, height: 127, unit: 'mm' },
]

const cropper = ref()
const fileInput = ref()
const imgSrc = ref('')
const currentPreset = ref<Preset | null>(null)

// 实际导出的目标尺寸 (像素)
const customWidth = ref(295) 
const customHeight = ref(413)

// 内部标记，防止 watch 循环触发
let isUpdatingSize = false

const option = reactive({
  size: 1,
  full: false,
  outputType: 'png',
  canMove: true,
  canMoveBox: true,
  original: false,
  autoCrop: true,
  autoCropWidth: 295,
  autoCropHeight: 413,
  centerBox: false, // 关闭居中限制，防止图片被裁剪框顶住无法缩小
  high: true,
  maxImgSize: 5000, // 增加最大尺寸限制
  fixed: true, // 锁定比例
  fixedNumber: [295, 413], // 截图框的宽高比例
  fixedBox: false, // 允许改变截图框大小
  canScale: true, // 允许滚轮缩放图片
  limitMinSize: [50, 50], // 放宽最小裁剪限制
})

// 监听宽度变化来实现联动
watch(customWidth, (newVal) => {
  if (isUpdatingSize || !option.fixed || !newVal) return
  isUpdatingSize = true
  const ratio = option.fixedNumber[1] / option.fixedNumber[0]
  customHeight.value = Math.round(newVal * ratio)
  // 更新裁剪框比例 (虽然比例没变，但尺寸变了可能需要重置一下框?)
  // 不需要，因为比例还是那个比例
  isUpdatingSize = false
})

// 监听高度变化
watch(customHeight, (newVal) => {
  if (isUpdatingSize || !option.fixed || !newVal) return
  isUpdatingSize = true
  const ratio = option.fixedNumber[0] / option.fixedNumber[1]
  customWidth.value = Math.round(newVal * ratio)
  isUpdatingSize = false
})

// 监听锁定比例开关
watch(() => option.fixed, (val) => {
    if (val) {
        // 重新锁定当前输入的比例
        option.fixedNumber = [customWidth.value, customHeight.value]
    }
})

const triggerUpload = () => {
  fileInput.value.click()
}

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  if (!file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imgSrc.value = e.target?.result as string
    // 默认选中一寸
    applyPreset(presets[1])
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const applyPreset = (preset: Preset) => {
  currentPreset.value = preset
  
  // 计算目标像素值
  const w = Math.round(preset.width * MM_TO_PX)
  const h = Math.round(preset.height * MM_TO_PX)
  
  // 暂时关闭联动监听
  isUpdatingSize = true
  
  // 更新输入值
  customWidth.value = w
  customHeight.value = h
  
  // 更新裁剪配置
  option.fixed = true
  option.fixedNumber = [w, h]
  option.autoCropWidth = w
  option.autoCropHeight = h
  
  isUpdatingSize = false
  
  // 仅调整裁剪框大小，不重置图片位置 (移除 refresh)
  nextTick(() => {
    if (cropper.value) {
        cropper.value.goAutoCrop() 
    }
  })
}

// 统一处理裁剪变化 (移动、缩放、调整大小)
const handleRealTime = () => {
    if (isUpdatingSize || !cropper.value) return
    
    // getCropAxis 获取基于原图的坐标
    const axis = cropper.value.getCropAxis()
    if (axis.x2 - axis.x1 > 0) {
        syncSize(axis.x2 - axis.x1, axis.y2 - axis.y1)
    }
}

// 兼容单独的 cropMoving 事件 (主要用于拖拽)
const handleCropMoving = (data: any) => {
    if (isUpdatingSize) return
    const { axis } = data
    if (axis && (axis.x2 - axis.x1) > 0) {
        syncSize(axis.x2 - axis.x1, axis.y2 - axis.y1)
    }
}

const syncSize = (w: number, h: number) => {
    isUpdatingSize = true
    
    const newW = Math.round(w)
    const newH = Math.round(h)
    
    // 只有数值变化时才更新，减少抖动
    if (customWidth.value !== newW || customHeight.value !== newH) {
        customWidth.value = newW
        customHeight.value = newH
        
        // 如果当前有预设，且尺寸偏差过大，取消预设选中状态
        if (currentPreset.value) {
            const presetW = Math.round(currentPreset.value.width * MM_TO_PX)
            const presetH = Math.round(currentPreset.value.height * MM_TO_PX)
            // 允许 1px 误差
            if (Math.abs(newW - presetW) > 1 || Math.abs(newH - presetH) > 1) {
                currentPreset.value = null
            }
        }
    }
    
    isUpdatingSize = false
}

const handleCustomSizeChange = () => {
    currentPreset.value = null // 清除预设选中状态
    
    if (isUpdatingSize) return
    
    // 更新裁剪配置
    option.autoCropWidth = customWidth.value
    option.autoCropHeight = customHeight.value
    
    // 如果是锁定的，同时更新比例配置
    if (option.fixed) {
         option.fixedNumber = [customWidth.value, customHeight.value]
    }
    
    nextTick(() => {
        cropper.value?.goAutoCrop()
    })
}

// 旋转
const rotateLeft = () => cropper.value?.rotateLeft()
const rotateRight = () => cropper.value?.rotateRight()

// 缩放
const changeScale = (num: number) => cropper.value?.changeScale(num)

// 重置
const resetObj = () => {
    // 简单的重置位置和缩放
   cropper.value?.refresh() 
}

const downloadImage = () => {
  if (!cropper.value) return
  
  // 1. 获取裁剪后的原始 Blob (不限尺寸)
  cropper.value.getCropBlob((blob: Blob) => {
     // 2. 创建图片对象
     const img = new Image()
     const url = URL.createObjectURL(blob)
     img.src = url
     
     img.onload = () => {
         // 3. 创建 Canvas 进行 Resize
         const canvas = document.createElement('canvas')
         const ctx = canvas.getContext('2d')
         
         // 设置为目标尺寸
         canvas.width = customWidth.value
         canvas.height = customHeight.value
         
         if (ctx) {
             // 使用高质量缩放
             ctx.imageSmoothingEnabled = true
             ctx.imageSmoothingQuality = 'high'
             
             // 绘制图片
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
             
             // 4. 导出最终图片
             const mimeType = option.outputType === 'png' ? 'image/png' : 'image/jpeg'
             canvas.toBlob((finalBlob) => {
                 if (finalBlob) {
                     const downloadUrl = URL.createObjectURL(finalBlob)
                     const a = document.createElement('a')
                     a.href = downloadUrl
                     const suffix = option.outputType === 'png' ? 'png' : 'jpg'
                     const sizeName = currentPreset.value ? `_${currentPreset.value.name}` : ''
                     a.download = `crop_image${sizeName}_${canvas.width}x${canvas.height}.${suffix}`
                     a.click()
                     URL.revokeObjectURL(downloadUrl)
                 }
                 URL.revokeObjectURL(url)
             }, mimeType, 0.95) // JPG 质量 0.95
         }
     }
  })
}
</script>

<style scoped>
/* 可以在这里覆盖 vue-cropper 的样式 */
</style>
