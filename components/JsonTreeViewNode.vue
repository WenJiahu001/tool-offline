<script setup lang="ts">
import { ref, inject, watch, computed } from 'vue'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    val: any
    keyName?: string | number
    depth?: number
    isLast?: boolean
  }>(),
  {
    depth: 0,
    isLast: true
  }
)

// 注入全局的触发器和默认展开深度
const defaultExpandDepth = inject('json-tree-default-expand-depth', ref(2))
const expandAllTrigger = inject('json-tree-expand-all', ref(0))
const collapseAllTrigger = inject('json-tree-collapse-all', ref(0))

// 判断值的类型
const valType = computed(() => {
  if (props.val === null) return 'null'
  if (Array.isArray(props.val)) return 'array'
  return typeof props.val
})

// 是否为对象或数组（可折叠节点）
const isCollapsible = computed(() => {
  return valType.value === 'object' || valType.value === 'array'
})

// 计算子节点个数
const childCount = computed(() => {
  if (valType.value === 'object') {
    return Object.keys(props.val).length
  }
  if (valType.value === 'array') {
    return props.val.length
  }
  return 0
})

// 节点折叠状态（默认按深度设定）
const isOpen = ref(props.depth < defaultExpandDepth.value)

// 监听全局一键折叠/展开
watch(expandAllTrigger, () => {
  if (isCollapsible.value) {
    isOpen.value = true
  }
})

watch(collapseAllTrigger, () => {
  if (isCollapsible.value) {
    isOpen.value = false
  }
})

const toggleOpen = () => {
  if (isCollapsible.value) {
    isOpen.value = !isOpen.value
  }
}

// 格式化基础值显示
const formattedValue = computed(() => {
  if (valType.value === 'null') return 'null'
  if (valType.value === 'string') return `"${props.val}"`
  if (valType.value === 'boolean') return props.val ? 'true' : 'false'
  return String(props.val)
})

// 获取键名显示（标准 JSON 键名带双引号）
const displayKey = computed(() => {
  if (props.keyName === undefined) return ''
  return typeof props.keyName === 'number' ? `${props.keyName}: ` : `"${props.keyName}": `
})
</script>

<template>
  <div class="font-mono text-sm leading-6 select-text">
    <!-- 可折叠节点（对象或数组） -->
    <div v-if="isCollapsible" class="group/node">
      <!-- 头部行 -->
      <div 
        @click="toggleOpen"
        class="flex items-start gap-1 cursor-pointer hover:bg-gray-100/70 px-1 py-0.5 rounded transition-colors"
      >
        <!-- 展开折叠图标 -->
        <span class="mt-1 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronDown v-if="isOpen" class="w-3.5 h-3.5" />
          <ChevronRight v-else class="w-3.5 h-3.5" />
        </span>

        <div class="flex-1 min-w-0">
          <!-- 键名 -->
          <span v-if="displayKey" class="text-amber-800 font-semibold">{{ displayKey }}</span>
          
          <!-- 括号类型 -->
          <span class="text-gray-500 font-medium">
            {{ valType === 'object' ? '{' : '[' }}
          </span>

          <!-- 折叠时的简略占位符 -->
          <span v-if="!isOpen" class="text-gray-400 text-xs italic bg-gray-100 px-1.5 py-0.5 rounded mx-1 select-none">
            {{ valType === 'object' ? '...' : `... ${childCount} items` }}
          </span>

          <span v-if="!isOpen" class="text-gray-500 font-medium">
            {{ valType === 'object' ? '}' : ']' }}{{ isLast ? '' : ',' }}
          </span>

          <!-- 折叠时的子项数目提示 -->
          <span v-if="!isOpen && valType === 'object'" class="text-gray-400 text-xs ml-2 select-none">
            // {{ childCount }} 个属性
          </span>
        </div>
      </div>

      <!-- 展开的子节点列表 -->
      <div 
        v-if="isOpen" 
        class="pl-4 ml-2.5 border-l border-gray-100 hover:border-amber-300/40 transition-colors"
      >
        <!-- 对象子节点列表 -->
        <template v-if="valType === 'object'">
          <JsonTreeViewNode
            v-for="(key, index) in Object.keys(val)"
            :key="key"
            :val="val[key]"
            :key-name="key"
            :depth="depth + 1"
            :is-last="index === Object.keys(val).length - 1"
          />
        </template>

        <!-- 数组子节点列表 -->
        <template v-if="valType === 'array'">
          <JsonTreeViewNode
            v-for="(item, index) in val"
            :key="index"
            :val="item"
            :depth="depth + 1"
            :is-last="index === val.length - 1"
          />
        </template>
      </div>

      <!-- 闭合行 -->
      <div v-if="isOpen" class="pl-[18px] py-0.5 select-none">
        <span class="text-gray-500 font-medium">
          {{ valType === 'object' ? '}' : ']' }}{{ isLast ? '' : ',' }}
        </span>
      </div>
    </div>

    <!-- 基础类型节点 -->
    <div v-else class="flex items-start gap-1 pl-[18px] py-0.5 hover:bg-gray-100/40 rounded transition-colors">
      <div class="flex-1 min-w-0">
        <!-- 键名 -->
        <span v-if="displayKey" class="text-amber-800 font-semibold">{{ displayKey }}</span>

        <!-- 对应类型的高亮值 -->
        <span 
          :class="[
            valType === 'string' ? 'text-green-600 font-medium break-all' :
            valType === 'number' ? 'text-blue-600 font-semibold' :
            valType === 'boolean' ? 'text-purple-600 font-semibold' :
            'text-gray-400 italic'
          ]"
        >
          {{ formattedValue }}
        </span>

        <!-- 逗号分隔符 -->
        <span class="text-gray-400">{{ isLast ? '' : ',' }}</span>
      </div>
    </div>
  </div>
</template>
