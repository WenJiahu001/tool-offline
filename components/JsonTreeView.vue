<script setup lang="ts">
import { ref, provide } from 'vue'
import { FolderOpen, FolderClosed } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    data: any
  }>(),
  {}
)

// 全局状态定义
const expandAllTrigger = ref(0)
const collapseAllTrigger = ref(0)
const defaultExpandDepth = ref(2)

// 注入给递归的子节点
provide('json-tree-expand-all', expandAllTrigger)
provide('json-tree-collapse-all', collapseAllTrigger)
provide('json-tree-default-expand-depth', defaultExpandDepth)

// 操作方法
const expandAll = () => {
  expandAllTrigger.value++
}

const collapseAll = () => {
  collapseAllTrigger.value++
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg">
    <!-- 树形图内置工具栏 -->
    <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 bg-gray-50/50 select-none">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-gray-500">操作：</span>
        <button
          @click="expandAll"
          class="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200/50 transition-colors"
          type="button"
        >
          <FolderOpen class="w-3 h-3" />
          <span>展开全部</span>
        </button>
        <button
          @click="collapseAll"
          class="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded border border-gray-200/50 transition-colors"
          type="button"
        >
          <FolderClosed class="w-3 h-3" />
          <span>折叠全部</span>
        </button>
      </div>
      <div class="text-xs text-gray-400">
        双击或单击键名可折叠单个节点
      </div>
    </div>

    <!-- 树节点展示区 -->
    <div class="flex-1 overflow-auto p-3 bg-gray-50/30">
      <JsonTreeViewNode
        :val="data"
        :depth="0"
        :is-last="true"
      />
    </div>
  </div>
</template>
