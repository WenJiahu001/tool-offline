import { ref } from 'vue'

/**
 * 通用的文件上传逻辑封装
 * 包含拖拽和点击上传的处理
 */
export function useFileUpload() {
  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const triggerUpload = () => {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }

  /**
   * 处理拖拽释放事件
   * @param e 拖拽事件
   * @param onFiles 成功获取文件后的回调函数
   */
  const handleDrop = (e: DragEvent, onFiles?: (files: FileList) => void) => {
    e.preventDefault()
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files && files.length > 0 && onFiles) {
      onFiles(files)
    }
  }

  return {
    isDragging,
    fileInput,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerUpload
  }
}
