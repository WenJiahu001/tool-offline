import { onMounted, onBeforeUnmount, ref } from 'vue'

export interface ShortcutConfig {
  key: string // 快捷键组合，例如 'ctrl+enter', 'ctrl+shift+c', '?', 'esc'
  description: string // 快捷键描述说明，例如 '格式化'
  action: (e: KeyboardEvent) => void
  disabledInInput?: boolean // 是否在输入框中禁用，默认单字符按键为 true，组合键为 false
}

export function useShortcuts(configs: ShortcutConfig[]) {
  const isMac = ref(false)

  if (typeof window !== 'undefined') {
    isMac.value = /Mac|iPod|iPad|iPhone/i.test(navigator.platform)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    // 1. 获取修饰键
    const keys: string[] = []
    if (e.ctrlKey || (isMac.value && e.metaKey)) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')

    // 2. 获取主键
    const keyName = e.key.toLowerCase()
    if (!['control', 'meta', 'shift', 'alt'].includes(keyName)) {
      keys.push(keyName === ' ' ? 'space' : keyName)
    }

    const pressedCombo = keys.join('+')

    // 3. 匹配注册的快捷键
    const target = configs.find(c => c.key.toLowerCase() === pressedCombo)

    if (target) {
      // 4. 判断是否处于输入框中
      const activeEl = document.activeElement
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).contentEditable === 'true'
      )

      // 默认规则：单字符快捷键（如 '?', 'esc'）在输入框内默认禁用；组合键（如 'ctrl+enter'）在输入框内可用
      const isSingleKey = target.key.split('+').length === 1
      const isDisabled = target.disabledInInput ?? isSingleKey

      if (isInput && isDisabled) {
        return
      }

      // 触发注册的逻辑，阻止浏览器默认事件（如 Ctrl+S 保存页面）
      e.preventDefault()
      target.action(e)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    isMac,
    shortcuts: configs
  }
}
