import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventListener } from '@vueuse/core'

export interface ShortcutConfig {
  key: string // 快捷键组合，例如 'ctrl+enter', 'ctrl+shift+c', '?', 'esc'
  description: string // 快捷键描述说明，例如 '格式化'
  action: (e: KeyboardEvent) => void
  disabledInInput?: boolean // 是否在输入框中禁用，默认单字符按键为 true，组合键为 false
}

export interface FormattedShortcut {
  key: string
  description: string
  keys: string[] // 格式化后的按键数组，例如 ['⌘ Cmd', '⇧ Shift', 'C']
}

export interface UseShortcutsOptions {
  enableEscToHome?: boolean // 是否启用 esc 返回首页，默认 true
}

export function useShortcuts(configs: ShortcutConfig[], options: UseShortcutsOptions = {}) {
  const isMac = ref(false)
  if (typeof window !== 'undefined') {
    isMac.value = /Mac|iPod|iPad|iPhone/i.test(navigator.userAgent || navigator.platform || '')
  }

  const showShortcutHelp = ref(false)
  const router = useRouter()

  // 1. 合并默认的快捷键规则
  const mergedConfigs = [...configs]

  const { enableEscToHome = true } = options

  if (enableEscToHome && !configs.some(c => c.key.toLowerCase() === 'esc')) {
    mergedConfigs.push({
      key: 'esc',
      description: '返回首页 / 关闭帮助',
      action: () => {
        if (showShortcutHelp.value) {
          showShortcutHelp.value = false
        } else {
          router.push('/')
        }
      },
      disabledInInput: false // 允许在输入框焦点激活时响应 esc
    })
  }

  // 2. 格式化快捷键展示文案，供 ToolShortcutHelp 组件直接使用
  const formatKeyCombo = (keyCombo: string): string[] => {
    return keyCombo.split('+').map(part => {
      const p = part.trim().toLowerCase()
      if (p === 'ctrl') return isMac.value ? '⌘ Cmd' : 'Ctrl'
      if (p === 'shift') return isMac.value ? '⇧ Shift' : 'Shift'
      if (p === 'alt') return isMac.value ? '⌥ Option' : 'Alt'
      if (p === 'esc') return 'Esc'
      if (p === 'enter') return 'Enter'
      if (p === 'space') return 'Space'
      if (p === 'arrowup') return '↑'
      if (p === 'arrowdown') return '↓'
      if (p === 'arrowleft') return '←'
      if (p === 'arrowright') return '→'
      return p.toUpperCase()
    })
  }

  const shortcuts = ref<FormattedShortcut[]>(
    mergedConfigs.map(config => ({
      key: config.key,
      description: config.description,
      keys: formatKeyCombo(config.key)
    }))
  )

  // 3. 正规化组合按键字符串，解决修饰键顺序敏感问题 (如 ctrl+shift+c 和 shift+ctrl+c)
  const normalizeKeyCombo = (combo: string): string => {
    const parts = combo.toLowerCase().split('+').map(k => k.trim())
    const modifiers = new Set<string>()
    let mainKey = ''

    for (const part of parts) {
      if (['ctrl', 'control', 'meta', 'cmd', 'command'].includes(part)) {
        modifiers.add('ctrl')
      } else if (['shift'].includes(part)) {
        modifiers.add('shift')
      } else if (['alt', 'option'].includes(part)) {
        modifiers.add('alt')
      } else {
        const key = part === ' ' ? 'space' : part
        mainKey = key === 'escape' ? 'esc' : key
      }
    }

    const sorted: string[] = []
    if (modifiers.has('ctrl')) sorted.push('ctrl')
    if (modifiers.has('shift')) sorted.push('shift')
    if (modifiers.has('alt')) sorted.push('alt')
    if (mainKey) sorted.push(mainKey)

    return sorted.join('+')
  }

  // 4. 全局键盘按键捕获逻辑
  const handleKeyDown = (e: KeyboardEvent) => {
    // 提取当前事件中的修饰键
    const modifiers = new Set<string>()
    if (e.ctrlKey || (isMac.value && e.metaKey)) modifiers.add('ctrl')
    if (e.shiftKey) modifiers.add('shift')
    if (e.altKey) modifiers.add('alt')

    // 提取主按键名称
    const keyName = e.key.toLowerCase()
    let mainKey = ''
    if (!['control', 'meta', 'shift', 'alt'].includes(keyName)) {
      const key = keyName === ' ' ? 'space' : keyName
      mainKey = key === 'escape' ? 'esc' : key
    }

    // 按统一顺序组合
    const sorted: string[] = []
    if (modifiers.has('ctrl')) sorted.push('ctrl')
    if (modifiers.has('shift')) sorted.push('shift')
    if (modifiers.has('alt')) sorted.push('alt')
    if (mainKey) sorted.push(mainKey)

    const pressedCombo = sorted.join('+')

    // 与注册的快捷键比对
    const target = mergedConfigs.find(c => normalizeKeyCombo(c.key) === pressedCombo)

    if (target) {
      const activeEl = document.activeElement
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).contentEditable === 'true'
      )

      // 单字符快捷键默认在输入框中禁用，组合键默认可用
      const isSingleKey = target.key.split('+').length === 1
      const isDisabled = target.disabledInInput ?? isSingleKey

      if (isInput && isDisabled) {
        return
      }

      // 阻止浏览器默认事件 (例如 Ctrl+S 触发保存，Ctrl+K 触发浏览器搜索等)
      e.preventDefault()
      target.action(e)
    }
  }

  // 5. 绑定键盘监听，并在 Composable 卸载时自动解除绑定
  useEventListener(typeof window !== 'undefined' ? window : null, 'keydown', handleKeyDown)

  return {
    isMac,
    shortcuts,
    showShortcutHelp
  }
}

