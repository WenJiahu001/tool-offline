import { computed, ref, unref, type Ref } from 'vue'

interface UseFileUploadOptions {
  accept?: string | string[]
  multiple?: boolean
  disabled?: boolean | Ref<boolean>
  onError?: (message: string) => void
}

const matchAcceptRule = (file: File, rule: string) => {
  const normalizedRule = rule.trim().toLowerCase()
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  if (!normalizedRule) return true
  if (normalizedRule.startsWith('.')) return fileName.endsWith(normalizedRule)
  if (normalizedRule.endsWith('/*')) return fileType.startsWith(normalizedRule.slice(0, -1))
  return fileType === normalizedRule
}

/**
 * 通用的文件上传逻辑封装
 * 包含拖拽和点击上传的处理
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const acceptRules = computed(() => {
    const accept = options.accept
    if (!accept) return []
    return Array.isArray(accept) ? accept : accept.split(',')
  })

  const resetInput = () => {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }

  const reportError = (message: string) => {
    options.onError?.(message)
  }

  const isDisabled = () => !!unref(options.disabled)

  const validateFiles = (files: File[]) => {
    if (files.length === 0) return null

    if (!options.multiple && files.length > 1) {
      reportError('当前工具一次只能选择一个文件')
      return null
    }

    if (acceptRules.value.length === 0) {
      return files
    }

    const acceptedFiles = files.filter(file =>
      acceptRules.value.some(rule => matchAcceptRule(file, rule)),
    )

    if (acceptedFiles.length === 0) {
      reportError('所选文件类型不受支持')
      return null
    }

    return acceptedFiles
  }

  const processFiles = (files: FileList | File[] | null | undefined, onFiles?: (files: File[]) => void) => {
    if (isDisabled() || !files) return

    const validatedFiles = validateFiles(Array.from(files))
    if (!validatedFiles || validatedFiles.length === 0) return

    onFiles?.(validatedFiles)
    resetInput()
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (isDisabled()) return
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const triggerUpload = () => {
    if (isDisabled()) return
    if (fileInput.value) {
      fileInput.value.click()
    }
  }

  /**
   * 处理拖拽释放事件
   * @param e 拖拽事件
   * @param onFiles 成功获取文件后的回调函数
   */
  const handleDrop = (e: DragEvent, onFiles?: (files: File[]) => void) => {
    e.preventDefault()
    isDragging.value = false
    processFiles(e.dataTransfer?.files, onFiles)
  }

  const handleInputChange = (e: Event, onFiles?: (files: File[]) => void) => {
    const target = e.target as HTMLInputElement | null
    processFiles(target?.files, onFiles)
  }

  return {
    isDragging,
    fileInput,
    resetInput,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    triggerUpload
  }
}
