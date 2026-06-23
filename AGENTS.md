# AGENTS.md

本文件是本仓库唯一保留的 AI 编程协作规则文件。后续维护项目时，以这里的约定为准。

## 交互与工具约定

- 全程使用中文交流，包括任务说明、进度反馈、总结和代码相关解释。
- 使用 `npm`，不要使用 `pnpm` 或重新生成 `pnpm-lock.yaml`。
- 依赖锁文件使用 `package-lock.json`。
- 修改前先理解现有实现，优先沿用项目已有组件、composable、工具函数和 Tailwind 写法。

## 项目概述

**LocalTools** 是一个纯前端本地工具箱，基于 Nuxt 3 + Vue 3 + Tailwind CSS 构建。所有文件处理都在浏览器端完成，不上传服务器。界面语言为中文，重点是图片、PDF、JSON、URL、Markdown、二维码等常用本地处理能力。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run generate # 生成静态站点
npm run preview  # 预览构建产物
npm run typecheck # Nuxt 类型检查
npm test         # 运行基础测试
```

当前没有独立 linter 配置。测试使用 `tests/run-tests.ts`，通过 Node assert + jiti 运行，覆盖部分工具函数和工具元数据。

## 技术栈

- **框架**: Nuxt 3，SPA 模式，无 SSR。
- **语言**: Vue 3 Composition API + TypeScript，页面统一使用 `<script setup lang="ts">`。
- **样式**: Tailwind CSS，通过 `@nuxtjs/tailwindcss` 模块启用；没有自定义 `tailwind.config`，优先使用原子类。
- **路由**: Nuxt 文件路由，`pages/` 下每个 `.vue` 文件对应一个页面。
- **状态管理**: 无 Pinia/Vuex。页面内状态使用 `ref`、`reactive`、`computed` 等 Composition API。
- **服务端能力**: 不引入数据库或服务端上传处理。工具逻辑应尽量保持浏览器本地执行。

## 关键依赖

| 库 | 用途 |
| --- | --- |
| `browser-image-compression` | 浏览器端图片压缩 |
| `vue-cropper` | 图片裁剪，使用时需要放在 `<ClientOnly>` 中 |
| `exifr` | EXIF 元数据解析 |
| `pdf-lib` | PDF 创建与合并 |
| `qrcode` | 二维码生成 |
| `marked` | Markdown 解析渲染 |
| `highlight.js` | 代码语法高亮 |
| `lucide-vue-next` | 图标库 |

不要为纯前端功能引入 Node-only 依赖。此前的 `mysql2` 已移除，项目不需要数据库连接能力。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `pages/` | Nuxt 页面与路由入口 |
| `components/` | 通用 UI 组件 |
| `composables/` | 组合式函数、工具元数据和复用状态逻辑 |
| `utils/` | 文件、JSON、Markdown 等纯工具函数 |
| `layouts/default.vue` | 默认页面布局 |
| `tests/` | 基础测试脚本 |
| `nuxt.config.ts` | Nuxt 配置 |

## 共享模块

| 模块 | 导出 | 用途 |
| --- | --- | --- |
| `composables/useTools.ts` | `tools`、`useTools()` | 首页工具元数据、搜索和分类 |
| `composables/useFileUpload.ts` | `useFileUpload()` | 拖拽和点击上传逻辑 |
| `composables/useToolFeedback.ts` | `useToolFeedback()` | 成功/错误反馈状态 |
| `composables/useObjectUrlMap.ts` | `useObjectUrlMap()` | Object URL 创建、复用和释放 |
| `utils/file.ts` | `formatFileSize()` | 格式化文件大小 |
| `utils/file.ts` | `downloadFile()` | 触发浏览器下载 |
| `utils/file.ts` | `createImageUrl()` | 基于 File/Blob 创建 Object URL |
| `utils/json-tools.ts` | JSON 解析、修复、对比工具 | JSON 页面和测试使用 |
| `utils/markdown.ts` | Markdown 渲染工具 | Markdown 编辑器使用 |
| `utils/base64-tools.ts` | `stringToBase64()`、`base64ToString()`、`fileToBase64()` | 文本与文件的 Base64 互转 |
| `utils/jwt-tools.ts` | `base64UrlDecode()`、`parseJwt()` | JWT 解析与解码 |

Nuxt auto-import 会自动导入 composables 和 utils 中的导出，页面里无需为这些本地工具手写 import，除非现有上下文已经这么做或类型需要。

## 通用组件

| 组件 | 用途 |
| --- | --- |
| `components/AppNavbar.vue` | 全局导航栏 |
| `components/ToolPageHeader.vue` | 工具页面标题区 |
| `components/ToolUploadZone.vue` | 上传区域 |
| `components/ToolFeedback.vue` | 成功/错误反馈展示 |

新增页面或改造页面时，优先复用这些组件，保持各工具页面结构一致。

## 页面与功能

| 页面文件 | 路由 | 功能 |
| --- | --- | --- |
| `index.vue` | `/` | 首页工具网格入口，使用 `useTools()` 提供工具分类和搜索 |
| `image-compress.vue` | `/image-compress` | 图片压缩，支持批量和自定义参数 |
| `image-crop.vue` | `/image-crop` | 图片裁剪，含证件照预设 |
| `image-privacy.vue` | `/image-privacy` | EXIF 隐私信息查看与清除 |
| `image-to-pdf.vue` | `/image-to-pdf` | 图片转 PDF，支持排序 |
| `pdf-tools.vue` | `/pdf-tools` | PDF 文件合并 |
| `qrcode-generator.vue` | `/qrcode-generator` | 二维码生成器 |
| `json-tools.vue` | `/json-tools` | JSON 格式化、压缩、转义、纠错和对比 |
| `image-convert.vue` | `/image-convert` | 图片格式转换，支持 PNG/JPG/WebP |
| `markdown-editor.vue` | `/markdown-editor` | Markdown 编辑器，实时预览和代码高亮 |
| `url-encode.vue` | `/url-encode` | URL 编码、解码和查询参数解析 |
| `base64-converter.vue` | `/base64-converter` | Base64 编解码，支持文本和文件，中文字符无乱码 |
| `jwt-decoder.vue` | `/jwt-decoder` | JWT 解析器，本地解析高亮 Header、Payload，签名及过期计算 |
| `timestamp-converter.vue` | `/timestamp-converter` | 时间戳转换，Unix 时间戳与本地时间双向转换，支持毫秒和快捷偏移 |
| `cron.vue` | `/cron` | Cron 表达式助手，可视化配置生成表达式，中文翻译解析与未来 5 次运行时间预测 |


新增工具页时，需要同步更新 `composables/useTools.ts` 的工具元数据，并在需要时补充 `tests/run-tests.ts` 中的基础断言。

## 代码模式

- 数据流保持为：用户上传/输入 → 浏览器本地处理 → 预览结果 → 触发下载。
- 文件上传优先使用 `useFileUpload()` 和 `ToolUploadZone.vue`。
- 文件大小展示统一使用 `formatFileSize()`。
- 下载统一使用 `downloadFile()`。
- Object URL 需要释放；多个预览 URL 优先使用 `useObjectUrlMap()` 管理。
- 页面级反馈优先使用 `useToolFeedback()` 和 `ToolFeedback.vue`。
- 每个页面应使用 `useSeoMeta()` 设置中文 `title`、`description`、`keywords`。
- 视觉实现优先使用现有 Tailwind 风格和 `lucide-vue-next` 图标，不引入新的 UI 框架。

## 质量要求

- 改动依赖、工具元数据、JSON/文件处理等共享逻辑后，至少运行 `npm test`。
- 涉及类型、页面结构或 Nuxt 配置时，尽量运行 `npm run typecheck`，并在结果中说明是否存在已有类型问题。
- 不提交生成产物目录，例如 `.nuxt/`、`.output/`、`dist/`、`node_modules/`。
- 不要移除用户已有改动；如果工作区已有无关修改，保持原样。
