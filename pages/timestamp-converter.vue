<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Clock, Play, Pause, Copy, Check, RefreshCw, Plus, Minus } from 'lucide-vue-next'

// SEO 元数据
useSeoMeta({
  title: '时间戳转换工具 - LocalTools',
  description: '纯本地运行的 Unix 时间戳转换工具。支持 10 位（秒）和 13 位（毫秒）时间戳与北京时间、UTC 时间互转，包含实时时钟、时区切换及时间偏移计算。',
  keywords: '时间戳转换, Unix 时间戳, 时间戳转日期, 日期转时间戳, 毫秒时间戳, 本地工具'
})

// 工具反馈
const { errorMessage, successMessage, clearMessages, showError, showSuccess } = useToolFeedback()

// --- 状态定义 ---
const isLive = ref(true)
const localTimeZone = ref('')
const liveTime = ref(new Date())

// 实时时间戳
const liveTimestampSec = ref(0)
const liveTimestampMs = ref(0)

// 定时器
let timer: ReturnType<typeof setInterval> | null = null

// 复制成功提示状态
const copiedState = ref<Record<string, boolean>>({})

// 1. 时间戳转日期时间状态
const inputTimestamp = ref('')
const tsTargetUnit = ref<'sec' | 'ms'>('sec')
const outputLocalDate = ref('')
const outputUtcDate = ref('')
const outputRelativeTime = ref('')

// 2. 日期时间转时间戳状态
const inputDateTimeLocal = ref('')
const inputDateTimeText = ref('')
const outputTimestampSec = ref('')
const outputTimestampMs = ref('')

// 3. 时间偏移计算状态
const baseTimeType = ref<'now' | 'custom'>('now')
const customBaseTime = ref('')
const offsetValue = ref<number>(1)
const offsetUnit = ref<'sec' | 'min' | 'hour' | 'day'>('hour')
const offsetAction = ref<'add' | 'sub'>('add')
const offsetOutputTime = ref('')
const offsetOutputSec = ref('')
const offsetOutputMs = ref('')

// --- 辅助函数 ---
function formatDate(date: Date, showMs = false): string {
  if (isNaN(date.getTime())) return '无效日期'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  if (showMs) {
    const ms = String(date.getMilliseconds()).padStart(3, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}.${ms}`
  }
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function formatUtcDate(date: Date, showMs = false): string {
  if (isNaN(date.getTime())) return '无效日期'
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const h = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  if (showMs) {
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}.${ms} UTC`
  }
  return `${y}-${m}-${d} ${h}:${min}:${s} UTC`
}

function getRelativeTime(timeMs: number): string {
  if (isNaN(timeMs)) return ''
  const now = Date.now()
  const diff = timeMs - now
  const absDiff = Math.abs(diff)

  if (absDiff < 1000) return '刚刚'

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const suffix = diff > 0 ? '后' : '前'

  if (days > 0) return `${days} 天${suffix}`
  if (hours > 0) return `${hours} 小时${suffix}`
  if (minutes > 0) return `${minutes} 分钟${suffix}`
  return `${seconds} 秒${suffix}`
}

// 复制辅助函数
const handleCopy = async (text: string, key: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedState.value[key] = true
    showSuccess('复制成功')
    setTimeout(() => {
      copiedState.value[key] = false
    }, 2000)
  } catch {
    showError('复制失败')
  }
}

// --- 实时更新时钟 ---
const updateLiveTime = () => {
  const now = new Date()
  liveTime.value = now
  liveTimestampSec.value = Math.floor(now.getTime() / 1000)
  liveTimestampMs.value = now.getTime()
}

const toggleLive = () => {
  isLive.value = !isLive.value
  if (isLive.value) {
    updateLiveTime()
    timer = setInterval(updateLiveTime, 50)
  } else {
    if (timer) clearInterval(timer)
  }
}

// --- 时间戳转日期时间逻辑 ---
const handleTimestampConvert = () => {
  clearMessages()
  const rawVal = inputTimestamp.value.trim()
  if (!rawVal) {
    outputLocalDate.value = ''
    outputUtcDate.value = ''
    outputRelativeTime.value = ''
    return
  }

  // 移除非数字字符
  const cleanVal = rawVal.replace(/\D/g, '')
  if (cleanVal !== rawVal) {
    inputTimestamp.value = cleanVal
  }

  const num = parseInt(cleanVal, 10)
  if (isNaN(num)) {
    showError('请输入有效的时间戳数字')
    return
  }

  // 智能推断：如果大于 50000000000 判定为毫秒级别，否则为秒级别
  let targetMs = num
  if (cleanVal.length <= 11) {
    // 假设是秒级
    tsTargetUnit.value = 'sec'
    targetMs = num * 1000
  } else {
    // 假设是毫秒级
    tsTargetUnit.value = 'ms'
  }

  const date = new Date(targetMs)
  if (isNaN(date.getTime())) {
    showError('无法解析该时间戳')
    return
  }

  outputLocalDate.value = formatDate(date, tsTargetUnit.value === 'ms')
  outputUtcDate.value = formatUtcDate(date, tsTargetUnit.value === 'ms')
  outputRelativeTime.value = getRelativeTime(targetMs)
}

// 修改单位时手动触发转换
watch(tsTargetUnit, () => {
  const rawVal = inputTimestamp.value.trim()
  if (!rawVal) return
  const num = parseInt(rawVal, 10)
  if (isNaN(num)) return

  let targetMs = num
  if (tsTargetUnit.value === 'sec') {
    targetMs = num * 1000
  }
  const date = new Date(targetMs)
  outputLocalDate.value = formatDate(date, tsTargetUnit.value === 'ms')
  outputUtcDate.value = formatUtcDate(date, tsTargetUnit.value === 'ms')
  outputRelativeTime.value = getRelativeTime(targetMs)
})

// --- 日期时间转时间戳逻辑 ---
const handleDateTimeConvert = (fromType: 'picker' | 'text') => {
  clearMessages()
  let targetDate: Date | null = null

  if (fromType === 'picker') {
    if (!inputDateTimeLocal.value) {
      outputTimestampSec.value = ''
      outputTimestampMs.value = ''
      return
    }
    targetDate = new Date(inputDateTimeLocal.value)
  } else {
    const textVal = inputDateTimeText.value.trim()
    if (!textVal) {
      outputTimestampSec.value = ''
      outputTimestampMs.value = ''
      return
    }
    targetDate = new Date(textVal)
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    if (fromType === 'text') {
      showError('无法解析输入的时间字符串，请检查格式，如: YYYY-MM-DD HH:mm:ss')
    }
    outputTimestampSec.value = ''
    outputTimestampMs.value = ''
    return
  }

  // 同步另一个输入框的内容，以便同步显示
  if (fromType === 'picker') {
    inputDateTimeText.value = formatDate(targetDate)
  } else {
    // datetime-local 格式要求: YYYY-MM-DDTHH:mm
    try {
      const year = targetDate.getFullYear()
      const month = String(targetDate.getMonth() + 1).padStart(2, '0')
      const day = String(targetDate.getDate()).padStart(2, '0')
      const hours = String(targetDate.getHours()).padStart(2, '0')
      const minutes = String(targetDate.getMinutes()).padStart(2, '0')
      const seconds = String(targetDate.getSeconds()).padStart(2, '0')
      inputDateTimeLocal.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    } catch {
      // 容错
    }
  }

  outputTimestampSec.value = Math.floor(targetDate.getTime() / 1000).toString()
  outputTimestampMs.value = targetDate.getTime().toString()
}

// 快捷选项转换
const setPresetTime = (presetType: 'today-start' | 'tomorrow-start' | 'yesterday-start' | 'week-start' | 'month-start' | 'year-start') => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)

  if (presetType === 'yesterday-start') {
    d.setDate(d.getDate() - 1)
  } else if (presetType === 'tomorrow-start') {
    d.setDate(d.getDate() + 1)
  } else if (presetType === 'week-start') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 获取周一
    d.setDate(diff)
  } else if (presetType === 'month-start') {
    d.setDate(1)
  } else if (presetType === 'year-start') {
    d.setMonth(0, 1)
  }

  inputDateTimeText.value = formatDate(d)
  handleDateTimeConvert('text')
  showSuccess('已载入快捷预设')
}

// --- 时间偏移计算逻辑 ---
const handleOffsetCalculate = () => {
  let baseDate = new Date()

  if (baseTimeType.value === 'custom') {
    const customVal = customBaseTime.value.trim()
    if (!customVal) {
      showError('请先输入基准时间')
      return
    }
    const d = new Date(customVal)
    if (isNaN(d.getTime())) {
      showError('输入的基准时间格式不正确，解析失败')
      return
    }
    baseDate = d
  }

  const offsetNum = Number(offsetValue.value)
  if (isNaN(offsetNum)) {
    showError('请输入有效的偏移数值')
    return
  }

  const multiplier = offsetAction.value === 'add' ? 1 : -1
  const changeMs = offsetNum * multiplier * (
    offsetUnit.value === 'sec' ? 1000 :
    offsetUnit.value === 'min' ? 60000 :
    offsetUnit.value === 'hour' ? 3600000 :
    86400000 // day
  )

  const resultDate = new Date(baseDate.getTime() + changeMs)
  offsetOutputTime.value = formatDate(resultDate, true)
  offsetOutputSec.value = Math.floor(resultDate.getTime() / 1000).toString()
  offsetOutputMs.value = resultDate.getTime().toString()
}

// 基准时间类型切换时更新
watch([baseTimeType, customBaseTime, offsetValue, offsetUnit, offsetAction], () => {
  handleOffsetCalculate()
})

// 定期轮询（如果是当前时间基准）以保持偏移看板更新
let offsetTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  // 获取浏览器本地时区
  try {
    localTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || '亚洲/上海'
  } catch {
    localTimeZone.value = 'UTC+8'
  }

  // 开启实时时钟
  updateLiveTime()
  timer = setInterval(updateLiveTime, 50)

  // 开启时间偏移基准时间轮询
  offsetTimer = setInterval(() => {
    if (baseTimeType.value === 'now') {
      handleOffsetCalculate()
    }
  }, 1000)

  // 初始化转换框为当前时间
  const now = new Date()
  inputTimestamp.value = Math.floor(now.getTime() / 1000).toString()
  handleTimestampConvert()

  inputDateTimeLocal.value = now.toISOString().slice(0, 16) // 初始化为 datetime-local 支持的格式
  handleDateTimeConvert('picker')
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (offsetTimer) clearInterval(offsetTimer)
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
    <!-- 头部组件 -->
    <ToolPageHeader
      title="时间戳转换"
      description="Unix 时间戳与本地时间、UTC 时间双向转换。纯本地运算，不将任何时间数据上传至网络，保护您的调试隐私。"
    />

    <!-- 信息提示组件 -->
    <ToolFeedback :error-message="errorMessage" :success-message="successMessage" />

    <!-- 栅格布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- 实时时间卡片 (左侧 1/3) -->
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-700/50 min-h-[350px]">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-cyan-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full" :class="isLive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
              {{ isLive ? '实时刷新中' : '刷新已暂停' }}
            </span>
            <span class="text-xs text-slate-400 font-mono">{{ localTimeZone }}</span>
          </div>

          <!-- 炫酷实时时钟 -->
          <div class="my-6">
            <div class="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">当前本地时间</div>
            <div class="text-3xl font-extrabold tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {{ formatDate(liveTime, true) }}
            </div>
            <div class="text-slate-400 text-xs font-mono mt-1">
              {{ formatUtcDate(liveTime, true) }}
            </div>
          </div>

          <!-- 实时时间戳显示 -->
          <div class="space-y-4 pt-4 border-t border-slate-700/50">
            <!-- 10位 -->
            <div class="flex items-center justify-between group">
              <div>
                <span class="text-xs text-slate-400 block">10 位时间戳 (秒)</span>
                <span class="text-xl font-bold font-mono text-cyan-300">{{ liveTimestampSec }}</span>
              </div>
              <button
                @click="handleCopy(liveTimestampSec.toString(), 'liveSec')"
                class="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="复制秒级时间戳"
              >
                <Check v-if="copiedState['liveSec']" class="h-4 w-4 text-emerald-400" />
                <Copy v-else class="h-4 w-4" />
              </button>
            </div>
            <!-- 13位 -->
            <div class="flex items-center justify-between group">
              <div>
                <span class="text-xs text-slate-400 block">13 位时间戳 (毫秒)</span>
                <span class="text-xl font-bold font-mono text-cyan-300">{{ liveTimestampMs }}</span>
              </div>
              <button
                @click="handleCopy(liveTimestampMs.toString(), 'liveMs')"
                class="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="复制毫秒级时间戳"
              >
                <Check v-if="copiedState['liveMs']" class="h-4 w-4 text-emerald-400" />
                <Copy v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 播放控制 -->
        <button
          @click="toggleLive"
          class="w-full mt-6 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all border"
          :class="isLive 
            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-transparent shadow-lg'"
        >
          <component :is="isLive ? Pause : Play" class="h-4 w-4" />
          {{ isLive ? '暂停时钟刷新' : '恢复实时刷新' }}
        </button>
      </div>

      <!-- 双向转换与计算区域 (右侧 2/3) -->
      <div class="lg:col-span-2 space-y-6">

        <!-- 模块一：时间戳 ➡️ 日期时间 -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 class="font-bold text-gray-900 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              时间戳 ➡️ 北京/UTC 时间
            </h3>
            <!-- 单位切换 -->
            <div class="inline-flex rounded-lg bg-gray-100 p-0.5">
              <button
                @click="tsTargetUnit = 'sec'"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                :class="tsTargetUnit === 'sec' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
              >
                秒 (10位)
              </button>
              <button
                @click="tsTargetUnit = 'ms'"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-colors"
                :class="tsTargetUnit === 'ms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'"
              >
                毫秒 (13位)
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="inputTimestamp"
                type="text"
                placeholder="请输入 Unix 时间戳..."
                @input="handleTimestampConvert"
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-base outline-none"
              />
              <button
                v-if="inputTimestamp"
                @click="inputTimestamp = ''; handleTimestampConvert()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                清空
              </button>
            </div>
            <button
              @click="handleTimestampConvert"
              class="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5"
            >
              <RefreshCw class="h-4 w-4" />
              转换
            </button>
          </div>

          <!-- 转换输出 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div class="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 flex flex-col justify-between">
              <div class="text-xs text-gray-400 mb-1">本地时间 (Local Time)</div>
              <div class="font-mono text-base font-bold text-gray-800 break-all select-all min-h-[24px]">
                {{ outputLocalDate || '-' }}
              </div>
              <div class="mt-2 flex justify-between items-center text-xs">
                <span class="text-gray-400 italic">{{ outputRelativeTime || '-' }}</span>
                <button
                  v-if="outputLocalDate"
                  @click="handleCopy(outputLocalDate, 'outLocal')"
                  class="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <component :is="copiedState['outLocal'] ? Check : Copy" class="h-3 w-3" />
                  复制
                </button>
              </div>
            </div>

            <div class="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 flex flex-col justify-between">
              <div class="text-xs text-gray-400 mb-1">UTC 标准时间 (GMT)</div>
              <div class="font-mono text-base font-bold text-gray-800 break-all select-all min-h-[24px]">
                {{ outputUtcDate || '-' }}
              </div>
              <div class="mt-2 flex justify-end text-xs">
                <button
                  v-if="outputUtcDate"
                  @click="handleCopy(outputUtcDate, 'outUtc')"
                  class="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <component :is="copiedState['outUtc'] ? Check : Copy" class="h-3 w-3" />
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 模块二：日期时间 ➡️ 时间戳 -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 class="font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            北京时间 ➡️ 时间戳
          </h3>

          <!-- 快捷预设按钮 -->
          <div class="flex flex-wrap gap-2">
            <button @click="setPresetTime('today-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">今天零点</button>
            <button @click="setPresetTime('yesterday-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">昨天零点</button>
            <button @click="setPresetTime('tomorrow-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">明天零点</button>
            <button @click="setPresetTime('week-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">本周首日</button>
            <button @click="setPresetTime('month-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">本月首日</button>
            <button @click="setPresetTime('year-start')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold rounded-lg transition-colors">今年首日</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 控件选择 -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">通过日期选择器选择</label>
              <input
                v-model="inputDateTimeLocal"
                type="datetime-local"
                step="1"
                @change="handleDateTimeConvert('picker')"
                class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono outline-none text-sm"
              />
            </div>
            <!-- 文字输入 -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">或者手动输入时间字符</label>
              <div class="relative">
                <input
                  v-model="inputDateTimeText"
                  type="text"
                  placeholder="如: YYYY-MM-DD HH:mm:ss"
                  @input="handleDateTimeConvert('text')"
                  class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono outline-none text-sm"
                />
                <button
                  v-if="inputDateTimeText"
                  @click="inputDateTimeText = ''; handleDateTimeConvert('text')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          <!-- 转换输出 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div class="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/30 flex items-center justify-between">
              <div>
                <span class="text-xs text-indigo-400 block font-semibold">10 位时间戳 (秒)</span>
                <span class="text-lg font-bold font-mono text-indigo-800 break-all select-all">{{ outputTimestampSec || '-' }}</span>
              </div>
              <button
                v-if="outputTimestampSec"
                @click="handleCopy(outputTimestampSec, 'outSec')"
                class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
              >
                <component :is="copiedState['outSec'] ? Check : Copy" class="h-4 w-4" />
              </button>
            </div>

            <div class="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/30 flex items-center justify-between">
              <div>
                <span class="text-xs text-indigo-400 block font-semibold">13 位时间戳 (毫秒)</span>
                <span class="text-lg font-bold font-mono text-indigo-800 break-all select-all">{{ outputTimestampMs || '-' }}</span>
              </div>
              <button
                v-if="outputTimestampMs"
                @click="handleCopy(outputTimestampMs, 'outMs')"
                class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
              >
                <component :is="copiedState['outMs'] ? Check : Copy" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 模块三：时间偏移量计算 -->
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 class="font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
            时间快捷偏移计算
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- 基准时间 -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-500 mb-1">选择基准时间</label>
              <div class="flex gap-2">
                <select
                  v-model="baseTimeType"
                  class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="now">当前时间 (实时)</option>
                  <option value="custom">自定义时间</option>
                </select>
                <input
                  v-if="baseTimeType === 'custom'"
                  v-model="customBaseTime"
                  type="text"
                  placeholder="如: YYYY-MM-DD HH:mm:ss"
                  class="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono outline-none text-sm"
                />
                <span v-else class="flex-1 px-4 py-2 bg-gray-100 border border-gray-100 rounded-xl font-mono text-sm text-gray-500 flex items-center">
                  {{ formatDate(liveTime) }}
                </span>
              </div>
            </div>

            <!-- 偏移操作 -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 mb-1">进行偏移操作</label>
              <div class="flex gap-2">
                <select
                  v-model="offsetAction"
                  class="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="add">往后加 (+)</option>
                  <option value="sub">往前减 (-)</option>
                </select>
                <input
                  v-model.number="offsetValue"
                  type="number"
                  min="0"
                  class="w-16 px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none font-mono text-sm text-center"
                />
                <select
                  v-model="offsetUnit"
                  class="px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:bg-white focus:border-emerald-500"
                >
                  <option value="sec">秒</option>
                  <option value="min">分</option>
                  <option value="hour">小时</option>
                  <option value="day">天</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 计算输出 -->
          <div class="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/30 space-y-3">
            <div class="flex justify-between items-center pb-2 border-b border-emerald-100/10">
              <span class="text-xs text-emerald-600 font-semibold">计算结果：</span>
              <span class="text-xs text-gray-400 font-mono italic">
                基准时间 {{ offsetAction === 'add' ? '增加' : '减少' }} {{ offsetValue }} {{ offsetUnit === 'sec' ? '秒' : offsetUnit === 'min' ? '分钟' : offsetUnit === 'hour' ? '小时' : '天' }}
              </span>
            </div>
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span class="text-xs text-emerald-400 block font-semibold">结果时间</span>
                <span class="text-base font-bold font-mono text-emerald-900 select-all">{{ offsetOutputTime || '-' }}</span>
              </div>
              
              <div class="flex gap-4">
                <div>
                  <span class="text-xs text-emerald-400 block font-semibold">10 位时间戳</span>
                  <span class="text-base font-bold font-mono text-emerald-900 select-all">{{ offsetOutputSec || '-' }}</span>
                </div>
                <div>
                  <span class="text-xs text-emerald-400 block font-semibold">13 位时间戳</span>
                  <span class="text-base font-bold font-mono text-emerald-900 select-all">{{ offsetOutputMs || '-' }}</span>
                </div>
              </div>

              <div class="flex gap-1.5 self-end md:self-center">
                <button
                  v-if="offsetOutputTime"
                  @click="handleCopy(offsetOutputTime, 'offTime')"
                  class="px-2.5 py-1.5 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                  title="复制结果时间"
                >
                  <component :is="copiedState['offTime'] ? Check : Copy" class="h-3 w-3" />
                </button>
                <button
                  v-if="offsetOutputSec"
                  @click="handleCopy(offsetOutputSec, 'offSec')"
                  class="px-2.5 py-1.5 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                  title="复制10位时间戳"
                >
                  10位
                </button>
                <button
                  v-if="offsetOutputMs"
                  @click="handleCopy(offsetOutputMs, 'offMs')"
                  class="px-2.5 py-1.5 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                  title="复制13位时间戳"
                >
                  13位
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* 移除 Chrome、Safari、Edge、Opera 的 Number 输入框微调按钮 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 针对 Firefox 的兼容设置 */
input[type=number] {
  -moz-appearance: textfield;
}
</style>
