import { onMounted, nextTick, type Ref } from 'vue'

export function useAutoFocus(elementRef: Ref<HTMLTextAreaElement | HTMLInputElement | null>) {
  onMounted(() => {
    nextTick(() => {
      // 延迟聚焦以确保 DOM 完全加载完毕并完成初始渲染
      setTimeout(() => {
        if (elementRef.value) {
          elementRef.value.focus()
        }
      }, 50)
    })
  })
}
