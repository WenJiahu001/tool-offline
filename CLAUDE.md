# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**LocalTools** — 纯前端本地工具箱，基于 Nuxt 3 + Tailwind CSS 构建。所有文件处理均在浏览器端完成，不上传服务器。界面语言为中文。

## 常用命令

```bash
npm run dev        # 启动开发服务器 (nuxt dev)
npm run build      # 构建 (nuxt build)
npm run generate   # 生成静态站点 (nuxt generate)
npm run preview    # 预览构建产物 (nuxt preview)
```

无测试框架、无 linter 配置。

## 架构

- **框架**: Nuxt 3 (^3.11.0)，SPA 模式，无 SSR
- **样式**: Tailwind CSS（通过 `@nuxtjs/tailwindcss` 模块），无自定义 tailwind.config，全部使用原子类
- **路由**: Nuxt 文件路由，`pages/` 下每个 `.vue` 文件对应一个路由
- **状态**: 无全局状态管理（无 Pinia/Vuex），每个页面独立使用 Vue 3 Composition API (`ref`/`reactive`)
- **唯一共享组件**: `components/AppNavbar.vue`（全局导航栏）

## 关键依赖

| 库 | 用途 |
|---|---|
| `browser-image-compression` | 浏览器端图片压缩 |
| `vue-cropper` | 图片裁剪（需 `<ClientOnly>` 包裹） |
| `exifr` | EXIF 元数据解析 |
| `pdf-lib` | PDF 创建与合并 |
| `qrcode` | 二维码生成 |
| `lucide-vue-next` | 图标库 |

## 页面与功能

| 页面文件 | 路由 | 功能 |
|---|---|---|
| `index.vue` | `/` | 首页工具网格入口 |
| `image-compress.vue` | `/image-compress` | 图片压缩（批量、自定义参数） |
| `image-crop.vue` | `/image-crop` | 图片裁剪（含证件照预设） |
| `image-privacy.vue` | `/image-privacy` | EXIF 隐私信息查看与清除 |
| `image-to-pdf.vue` | `/image-to-pdf` | 图片转 PDF（支持排序） |
| `pdf-tools.vue` | `/pdf-tools` | PDF 文件合并 |
| `qrcode-generator.vue` | `/qrcode-generator` | 二维码生成器 |
| `json-tools.vue` | `/json-tools` | JSON 格式化/压缩/转义/对比 |

## 代码模式

- **数据流**: 用户上传文件 → 浏览器本地处理 → 预览结果 → 触发下载
- **文件上传**: 每个页面均实现拖拽 + 点击上传，拖拽逻辑 (`handleDragOver`/`handleDragLeave`/`handleDrop`) 在多页面重复
- **文件大小格式化**: `formatFileSize()` 函数在多个页面重复定义
- **下载方式**: 动态创建 `<a>` 标签触发
- **SEO**: 每个页面使用 `useSeoMeta()` 设置中文 title/description/keywords
- **TypeScript**: 仅 `image-crop.vue` 使用了 `<script setup lang="ts">`，其余页面为 JavaScript
