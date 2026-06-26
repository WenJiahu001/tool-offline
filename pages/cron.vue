<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Copy, Check, RotateCcw, Play, Sparkles, AlertCircle, HelpCircle, ArrowRight, Keyboard } from 'lucide-vue-next'
import { useStorage } from '@vueuse/core'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/zh_CN'
import { CronExpressionParser } from 'cron-parser'

useSeoMeta({
  title: 'Cron 表达式助手 - LocalTools',
  description: '纯前端本地运行的 Cron 表达式助手，支持可视化配置生成 Cron、中英文双向翻译以及未来 5 次运行时间预测，保障开发数据安全隐私。',
  keywords: 'Cron 表达式,Cron 生成器,Cron 解析,定时任务,Cron 翻译,本地工具,Nuxt3',
})

const {
  errorMessage,
  successMessage,
  clearMessages,
  showError,
  showSuccess,
} = useToolFeedback()

// 状态定义
const secondsEnabled = ref(false)
const cronExpression = useStorage('cron-expression', '*/5 * * * *')
const isInternalUpdate = ref(false)
const hasError = ref(false)

const translationText = ref('')
const futureExecutionTimes = ref<string[]>([])
const copied = ref(false)

// 可选 Tab 列表
const activeTab = ref<'second' | 'minute' | 'hour' | 'day' | 'month' | 'week'>('minute')

// 各项的初始状态
const secondState = reactive({
  type: 'all', // all, cycle, range, specific
  cycleStart: 0,
  cycleInterval: 5,
  rangeStart: 0,
  rangeEnd: 59,
  specific: [] as number[]
})

const minuteState = reactive({
  type: 'cycle', // all, cycle, range, specific
  cycleStart: 0,
  cycleInterval: 5,
  rangeStart: 0,
  rangeEnd: 59,
  specific: [] as number[]
})

const hourState = reactive({
  type: 'all', // all, cycle, range, specific
  cycleStart: 0,
  cycleInterval: 1,
  rangeStart: 0,
  rangeEnd: 23,
  specific: [] as number[]
})

const dayState = reactive({
  type: 'all', // all, no-specific, cycle, range, specific
  cycleStart: 1,
  cycleInterval: 1,
  rangeStart: 1,
  rangeEnd: 31,
  specific: [] as number[]
})

const monthState = reactive({
  type: 'all', // all, cycle, range, specific
  cycleStart: 1,
  cycleInterval: 1,
  rangeStart: 1,
  rangeEnd: 12,
  specific: [] as number[]
})

const weekState = reactive({
  type: 'no-specific', // all, no-specific, cycle, range, specific
  cycleStart: 1,
  cycleInterval: 1,
  rangeStart: 1,
  rangeEnd: 7, // 1-7 代表周一至周日
  specific: [] as number[]
})

// 快捷模板列表
const templates = [
  { name: '每分钟', value: '* * * * *' },
  { name: '每 5 分钟', value: '*/5 * * * *' },
  { name: '每小时整点', value: '0 * * * *' },
  { name: '每小时半点', value: '30 * * * *' },
  { name: '每天凌晨 0 点', value: '0 0 * * *' },
  { name: '每天凌晨 4 点半', value: '30 4 * * *' },
  { name: '每周一早上 8:30', value: '30 8 * * 1' },
  { name: '每月 1 号中午 12 点', value: '0 12 1 * *' },
  { name: '工作日朝九晚五整点', value: '0 9-17 * * 1-5' },
  { name: '每秒执行 (6位)', value: '* * * * * *', seconds: true }
]

// 应用快捷模板
const applyTemplate = (tpl: typeof templates[0]) => {
  clearMessages()
  secondsEnabled.value = !!tpl.seconds
  cronExpression.value = tpl.value
}

// 格式化日期时间
const formatDateTime = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

// 解析各部分状态生成 cron 语法片段
const resolvePart = (state: any, min: number, max: number, supportNoSpecific = false) => {
  switch (state.type) {
    case 'all':
      return '*'
    case 'no-specific':
      return supportNoSpecific ? '?' : '*'
    case 'cycle':
      const start = isNaN(state.cycleStart) ? min : state.cycleStart
      const interval = isNaN(state.cycleInterval) ? 1 : state.cycleInterval
      return `${start}/${interval}`
    case 'range':
      const rStart = isNaN(state.rangeStart) ? min : state.rangeStart
      const rEnd = isNaN(state.rangeEnd) ? max : state.rangeEnd
      return `${rStart}-${rEnd}`
    case 'specific':
      if (!state.specific || state.specific.length === 0) return '*'
      return [...state.specific].sort((a, b) => a - b).join(',')
    default:
      return '*'
  }
}

// 从可视化表单同步更新 Cron 表达式
const updateExpressionFromForm = () => {
  isInternalUpdate.value = true
  const parts = []
  if (secondsEnabled.value) {
    parts.push(resolvePart(secondState, 0, 59))
  }
  parts.push(resolvePart(minuteState, 0, 59))
  parts.push(resolvePart(hourState, 0, 23))
  parts.push(resolvePart(dayState, 1, 31, true))
  parts.push(resolvePart(monthState, 1, 12))
  parts.push(resolvePart(weekState, 1, 7, true))

  cronExpression.value = parts.join(' ')
}

// 智能规避日和周冲突的逻辑
watch(() => dayState.type, (newType) => {
  if (newType !== 'all' && newType !== 'no-specific') {
    if (weekState.type !== 'no-specific') {
      weekState.type = 'no-specific'
    }
  }
})

watch(() => weekState.type, (newType) => {
  if (newType !== 'all' && newType !== 'no-specific') {
    if (dayState.type !== 'no-specific') {
      dayState.type = 'no-specific'
    }
  }
})

// 监听可视化表单各项的变化，触发同步
watch(
  [
    secondState,
    minuteState,
    hourState,
    dayState,
    monthState,
    weekState,
    secondsEnabled
  ],
  () => {
    updateExpressionFromForm()
  },
  { deep: true }
)

// 校验并翻译 Cron，计算未来运行时间
const parseExpression = () => {
  if (!cronExpression.value.trim()) {
    translationText.value = ''
    futureExecutionTimes.value = []
    return
  }

  try {
    // 1. 翻译中文
    let humanReadable = cronstrue.toString(cronExpression.value, { locale: 'zh_CN' })
    humanReadable = humanReadable
      .replace(/，/g, '，')
      .replace(/。/g, '')
    translationText.value = humanReadable

    // 2. 预测未来 5 次时间
    const interval = CronExpressionParser.parse(cronExpression.value)
    const times: string[] = []
    for (let i = 0; i < 5; i++) {
      if (interval.hasNext()) {
        const nextDate = interval.next()
        times.push(formatDateTime(nextDate.toDate()))
      }
    }
    futureExecutionTimes.value = times
    hasError.value = false
    clearMessages()
  } catch (err: any) {
    translationText.value = '解析失败：Cron 格式存在语法错误'
    futureExecutionTimes.value = []
    hasError.value = true
    showError(err.message || 'Cron 表达式解析出错')
  }
}

// 还原具体字段的状态
const fillPartState = (state: any, partStr: string, min: number, max: number) => {
  if (partStr === '*') {
    state.type = 'all'
  } else if (partStr === '?') {
    state.type = 'no-specific'
  } else if (partStr.includes('/')) {
    state.type = 'cycle'
    const [start, interval] = partStr.split('/')
    state.cycleStart = parseInt(start)
    state.cycleInterval = parseInt(interval)
  } else if (partStr.includes('-')) {
    state.type = 'range'
    const [start, end] = partStr.split('-')
    state.rangeStart = parseInt(start)
    state.rangeEnd = parseInt(end)
  } else if (partStr.includes(',') || /^\d+$/.test(partStr)) {
    state.type = 'specific'
    state.specific = partStr.split(',').map(v => parseInt(v)).filter(v => !isNaN(v) && v >= min && v <= max)
  } else {
    state.type = 'all'
  }
}

// 当用户直接输入或点击模板导致 cron 变动时的回填还原
const parseAndFillForm = (expression: string) => {
  const parts = expression.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) return

  const hasSeconds = parts.length === 6
  secondsEnabled.value = hasSeconds

  let offset = 0
  if (hasSeconds) {
    fillPartState(secondState, parts[0], 0, 59)
    offset = 1
  } else {
    secondState.type = 'all'
  }

  fillPartState(minuteState, parts[0 + offset], 0, 59)
  fillPartState(hourState, parts[1 + offset], 0, 23)
  fillPartState(dayState, parts[2 + offset], 1, 31)
  fillPartState(monthState, parts[3 + offset], 1, 12)
  fillPartState(weekState, parts[4 + offset], 1, 7)
}

// 监听 Cron 表达式核心字段
watch(cronExpression, (newVal) => {
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false
    parseExpression()
  } else {
    parseAndFillForm(newVal)
    parseExpression()
  }
}, { immediate: true })

// 可视化配置当前选中的 Tab 计算属性
const currentTabConfig = computed(() => {
  switch (activeTab.value) {
    case 'second':
      return { label: '秒', min: 0, max: 59, state: secondState }
    case 'minute':
      return { label: '分', min: 0, max: 59, state: minuteState }
    case 'hour':
      return { label: '时', min: 0, max: 23, state: hourState }
    case 'day':
      return { label: '日', min: 1, max: 31, state: dayState }
    case 'month':
      return { label: '月', min: 1, max: 12, state: monthState }
    case 'week':
      return { label: '周', min: 1, max: 7, state: weekState }
  }
})

// 指定周名
const getWeekName = (val: number) => {
  const weekNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return `${weekNames[val - 1]} (${val})`
}

// 全选/全不选特定值
const toggleAllSpecific = (selectAll: boolean) => {
  const config = currentTabConfig.value
  if (!config) return

  if (selectAll) {
    config.state.specific = Array.from(
      { length: config.max - config.min + 1 },
      (_, i) => i + config.min
    )
  } else {
    config.state.specific = []
  }
}

// 复制
const copyExpression = async () => {
  try {
    await navigator.clipboard.writeText(cronExpression.value)
    copied.value = true
    showSuccess('复制成功')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    showError('复制失败，请手动选择复制')
  }
}
// 快捷键和自动聚焦支持
const mainInput = ref<HTMLInputElement | null>(null)
useAutoFocus(mainInput)

const router = useRouter()

const resetAll = () => {
  cronExpression.value = '*/5 * * * *'
  secondsEnabled.value = false
  parseAndFillForm('*/5 * * * *')
  parseExpression()
}

const { isMac, shortcuts, showShortcutHelp } = useShortcuts([
  {
    key: 'ctrl+enter',
    description: '解析并预测时间',
    action: parseExpression
  },
  {
    key: 'ctrl+d',
    description: '重置为默认表达式',
    action: resetAll
  },
  {
    key: 'alt+c',
    description: '重置为默认表达式',
    action: resetAll
  },
  {
    key: 'ctrl+shift+c',
    description: '复制 Cron 表达式',
    action: copyExpression
  }
])
</script>

<template>
  <div class="max-w-[98%] xl:max-w-[95%] mx-auto space-y-3 px-3 py-4">
    <ToolPageHeader
      title="Cron 表达式助手"
      description="可视化配置与解析 Cron 表达式，支持中英文语义转换、未来执行时间预测及反向解析，零服务器上传，纯浏览器端处理。"
    />

    <ToolFeedback :error-message="errorMessage" :success-message="successMessage" />

    <!-- 顶部快捷模板 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-2 px-3">
      <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Sparkles class="w-3.5 h-3.5 text-emerald-500" />
          快捷应用模板
        </div>
        <button 
          @click="showShortcutHelp = true"
          class="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200/50 shadow-sm"
        >
          <Keyboard class="w-3.5 h-3.5" />
          <span>快捷键</span>
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tpl in templates"
          :key="tpl.name"
          @click="applyTemplate(tpl)"
          class="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-gray-200 hover:border-emerald-200 transition-all"
        >
          {{ tpl.name }}
        </button>
      </div>
    </div>

    <!-- 主布局网格 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      <!-- 左半部分：可视化配置区 -->
      <div class="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            可视化配置生成器
          </span>
          <!-- 是否包含秒开关 -->
          <label class="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-gray-600">
            <input
              type="checkbox"
              v-model="secondsEnabled"
              class="w-3 h-3 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
            />
            秒级配置 (6位表达式)
          </label>
        </div>

        <!-- 内部 Tab 切换 -->
        <div class="flex border-b border-gray-200 overflow-x-auto">
          <button
            v-if="secondsEnabled"
            @click="activeTab = 'second'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'second' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            秒 (0-59)
          </button>
          <button
            @click="activeTab = 'minute'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'minute' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            分 (0-59)
          </button>
          <button
            @click="activeTab = 'hour'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'hour' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            时 (0-23)
          </button>
          <button
            @click="activeTab = 'day'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'day' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            日 (1-31)
          </button>
          <button
            @click="activeTab = 'month'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'month' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            月 (1-12)
          </button>
          <button
            @click="activeTab = 'week'"
            :class="['flex-1 px-3 py-2 text-xs font-medium border-b-2 text-center whitespace-nowrap transition-colors', activeTab === 'week' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50']"
          >
            周 (1-7)
          </button>
        </div>

        <!-- 配置表单区 -->
        <div class="p-4 flex-1 space-y-4">
          <div class="space-y-4">
            
            <!-- 1. 任意值 -->
            <label class="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="all"
                v-model="currentTabConfig.state.type"
                class="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-gray-700">任意值 (通配符)</span>
                <span class="text-[10px] text-gray-400">允许执行在此 {{ currentTabConfig.label }} 的每一个时间点，即表示 <code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-emerald-600 font-bold">*</code></span>
              </div>
            </label>

            <!-- 2. 不指定 (仅对日和周有效) -->
            <label
              v-if="activeTab === 'day' || activeTab === 'week'"
              class="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                value="no-specific"
                v-model="currentTabConfig.state.type"
                class="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div class="flex flex-col">
                <span class="text-xs font-semibold text-gray-700">不指定 (问号符)</span>
                <span class="text-[10px] text-gray-400">在此 {{ currentTabConfig.label }} 不指定特定限制，用于日与周之间的防冲突，即表示 <code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-emerald-600 font-bold">?</code></span>
              </div>
            </label>

            <!-- 3. 周期执行 -->
            <div class="p-2.5 rounded-lg border border-gray-100 space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="cycle"
                  v-model="currentTabConfig.state.type"
                  class="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span class="text-xs font-semibold text-gray-700">间隔/循环 (周期)</span>
              </label>
              <div
                v-if="currentTabConfig.state.type === 'cycle'"
                class="flex items-center gap-2 text-xs text-gray-600 pl-7 flex-wrap"
              >
                <span>从第</span>
                <input
                  type="number"
                  v-model.number="currentTabConfig.state.cycleStart"
                  :min="currentTabConfig.min"
                  :max="currentTabConfig.max"
                  class="w-14 px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center text-xs"
                />
                <span>{{ currentTabConfig.label }}开始，每隔</span>
                <input
                  type="number"
                  v-model.number="currentTabConfig.state.cycleInterval"
                  min="1"
                  :max="currentTabConfig.max"
                  class="w-14 px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center text-xs"
                />
                <span>{{ currentTabConfig.label }}执行一次</span>
              </div>
            </div>

            <!-- 4. 区间执行 -->
            <div class="p-2.5 rounded-lg border border-gray-100 space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="range"
                  v-model="currentTabConfig.state.type"
                  class="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span class="text-xs font-semibold text-gray-700">范围 (区间)</span>
              </label>
              <div
                v-if="currentTabConfig.state.type === 'range'"
                class="flex items-center gap-2 text-xs text-gray-600 pl-7 flex-wrap"
              >
                <span>从第</span>
                <input
                  type="number"
                  v-model.number="currentTabConfig.state.rangeStart"
                  :min="currentTabConfig.min"
                  :max="currentTabConfig.max"
                  class="w-14 px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center text-xs"
                />
                <span>{{ currentTabConfig.label }} 到第</span>
                <input
                  type="number"
                  v-model.number="currentTabConfig.state.rangeEnd"
                  :min="currentTabConfig.min"
                  :max="currentTabConfig.max"
                  class="w-14 px-1.5 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center text-xs"
                />
                <span>{{ currentTabConfig.label }} 之间的每一个时间点执行</span>
              </div>
            </div>

            <!-- 5. 指定具体值 -->
            <div class="p-2.5 rounded-lg border border-gray-100 space-y-2">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="specific"
                    v-model="currentTabConfig.state.type"
                    class="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-gray-700">指定具体 {{ currentTabConfig.label }}</span>
                </label>
                <div v-if="currentTabConfig.state.type === 'specific'" class="flex items-center gap-2">
                  <button
                    @click="toggleAllSpecific(true)"
                    class="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    全选
                  </button>
                  <span class="text-gray-300 text-[10px]">|</span>
                  <button
                    @click="toggleAllSpecific(false)"
                    class="text-[10px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    全不选
                  </button>
                </div>
              </div>

              <!-- 指定值网格视图 -->
              <div
                v-if="currentTabConfig.state.type === 'specific'"
                class="pl-7 pt-1"
              >
                <!-- 秒/分 60网格 -->
                <div
                  v-if="activeTab === 'second' || activeTab === 'minute'"
                  class="grid grid-cols-6 sm:grid-cols-10 gap-1"
                >
                  <label
                    v-for="v in 60"
                    :key="v - 1"
                    class="flex items-center justify-center p-1 border border-gray-100 rounded hover:bg-emerald-50 cursor-pointer text-xs font-mono transition-colors"
                    :class="currentTabConfig.state.specific.includes(v - 1) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50/50 text-gray-600'"
                  >
                    <input
                      type="checkbox"
                      :value="v - 1"
                      v-model="currentTabConfig.state.specific"
                      class="hidden"
                    />
                    {{ String(v - 1).padStart(2, '0') }}
                  </label>
                </div>

                <!-- 小时 24网格 -->
                <div
                  v-else-if="activeTab === 'hour'"
                  class="grid grid-cols-6 sm:grid-cols-8 gap-1.5"
                >
                  <label
                    v-for="v in 24"
                    :key="v - 1"
                    class="flex items-center justify-center p-1.5 border border-gray-100 rounded hover:bg-emerald-50 cursor-pointer text-xs font-mono transition-colors"
                    :class="currentTabConfig.state.specific.includes(v - 1) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50/50 text-gray-600'"
                  >
                    <input
                      type="checkbox"
                      :value="v - 1"
                      v-model="currentTabConfig.state.specific"
                      class="hidden"
                    />
                    {{ String(v - 1).padStart(2, '0') }}
                  </label>
                </div>

                <!-- 日 31网格 -->
                <div
                  v-else-if="activeTab === 'day'"
                  class="grid grid-cols-6 sm:grid-cols-7 gap-1.5"
                >
                  <label
                    v-for="v in 31"
                    :key="v"
                    class="flex items-center justify-center p-1.5 border border-gray-100 rounded hover:bg-emerald-50 cursor-pointer text-xs font-mono transition-colors"
                    :class="currentTabConfig.state.specific.includes(v) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50/50 text-gray-600'"
                  >
                    <input
                      type="checkbox"
                      :value="v"
                      v-model="currentTabConfig.state.specific"
                      class="hidden"
                    />
                    {{ String(v).padStart(2, '0') }}
                  </label>
                </div>

                <!-- 月 12网格 -->
                <div
                  v-else-if="activeTab === 'month'"
                  class="grid grid-cols-4 sm:grid-cols-6 gap-1.5"
                >
                  <label
                    v-for="v in 12"
                    :key="v"
                    class="flex items-center justify-center p-1.5 border border-gray-100 rounded hover:bg-emerald-50 cursor-pointer text-xs font-medium transition-colors"
                    :class="currentTabConfig.state.specific.includes(v) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50/50 text-gray-600'"
                  >
                    <input
                      type="checkbox"
                      :value="v"
                      v-model="currentTabConfig.state.specific"
                      class="hidden"
                    />
                    {{ v }} 月
                  </label>
                </div>

                <!-- 周 7网格 -->
                <div
                  v-else-if="activeTab === 'week'"
                  class="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
                >
                  <label
                    v-for="v in 7"
                    :key="v"
                    class="flex items-center justify-center p-1.5 border border-gray-100 rounded hover:bg-emerald-50 cursor-pointer text-xs font-medium transition-colors"
                    :class="currentTabConfig.state.specific.includes(v) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50/50 text-gray-600'"
                  >
                    <input
                      type="checkbox"
                      :value="v"
                      v-model="currentTabConfig.state.specific"
                      class="hidden"
                    />
                    {{ getWeekName(v).split(' ')[0] }}
                  </label>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- 右半部分：表达式、语义翻译与未来执行时间 -->
      <div class="lg:col-span-5 space-y-4">
        
        <!-- 1. 表达式输入与一键复制 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-700">当前 Cron 表达式</span>
            <span class="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {{ secondsEnabled ? '6 位表达式' : '5 位标准表达式' }}
            </span>
          </div>
          <div class="relative flex items-stretch">
            <input
              ref="mainInput"
              type="text"
              v-model="cronExpression"
              placeholder="请输入或在这里修改 Cron 表达式..."
              class="w-full px-3 py-1.5 font-mono text-sm bg-gray-50 border border-gray-300 rounded-l-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              spellcheck="false"
            />
            <button
              @click="copyExpression"
              class="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-lg font-medium text-xs flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Check v-if="copied" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>复制</span>
              <kbd class="hidden md:inline-flex items-center px-1 bg-white/20 text-white rounded text-[9px] font-mono leading-none select-none">
                {{ isMac ? '⌘⇧C' : 'Ctrl+Shift+C' }}
              </kbd>
            </button>
          </div>
        </div>

        <!-- 2. 中文语义翻译 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <HelpCircle class="w-3.5 h-3.5 text-gray-400" />
              规则中文语义解析
            </span>
          </div>
          <div class="p-4">
            <div
              v-if="hasError"
              class="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs"
            >
              <AlertCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p class="font-semibold mb-0.5">表达式有误</p>
                <p class="text-rose-600/90 font-mono">{{ translationText }}</p>
              </div>
            </div>
            <div v-else class="space-y-2">
              <div class="text-sm font-medium text-gray-500">此表达式对应的运行规则：</div>
              <div class="text-base text-gray-800 font-semibold bg-emerald-50/20 p-4 rounded-lg border border-emerald-50 font-sans leading-relaxed">
                {{ translationText || '暂无解析规则' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 未来 5 次运行时间预测 -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Play class="w-4 h-4 text-gray-400" />
              未来 5 次运行时间预测
            </span>
          </div>
          <div class="p-4">
            <div v-if="hasError" class="text-xs text-gray-400 text-center py-3">
              暂无有效的未来执行序列预测
            </div>
            <div v-else-if="futureExecutionTimes.length === 0" class="text-xs text-gray-400 text-center py-3">
              未检测到未来的执行序列
            </div>
            <ul v-else class="divide-y divide-gray-100">
              <li
                v-for="(time, idx) in futureExecutionTimes"
                :key="idx"
                class="py-2 flex items-center justify-between text-xs"
              >
                <div class="flex items-center gap-2">
                  <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    {{ idx + 1 }}
                  </span>
                  <span class="font-mono text-gray-700 font-medium">{{ time }}</span>
                </div>
                <div class="flex items-center gap-1 text-[10px] text-gray-400">
                  <span>运行</span>
                  <ArrowRight class="w-3 h-3" />
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>

    <!-- 快捷键说明模态框 -->
    <ToolShortcutHelp 
      :show="showShortcutHelp" 
      :shortcuts="shortcuts" 
      @close="showShortcutHelp = false" 
    />
  </div>
</template>

<style scoped>
/* 滚动条微调 */
::-webkit-scrollbar {
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>

