# LocalTools 本地工具箱

LocalTools 是一个基于 Nuxt 3 + Tailwind CSS 构建的纯前端本地工具箱，提供图片、PDF、JSON、URL、Markdown、二维码等常用处理能力。所有文件处理都在浏览器端完成，不会上传到服务器，适合处理对隐私和安全有要求的日常文件。

## 特性

- 纯前端运行：文件在浏览器本地处理，无需后端服务
- 隐私友好：图片、PDF、文本等内容不会上传服务器
- 即开即用：支持本地开发、静态生成和部署
- 中文界面：工具入口、操作说明和反馈信息面向中文用户
- 工具集中：覆盖图片处理、PDF 处理、开发辅助和日常实用场景

## 工具列表

| 分类 | 工具 | 功能 |
| --- | --- | --- |
| 图片工具 | 图片压缩 | 批量压缩 PNG/JPG 图片，支持质量、尺寸等参数调整 |
| 图片工具 | 图片裁剪 | 支持证件照预设和自定义像素裁剪 |
| 图片工具 | 图片隐私清除 | 查看并清除 EXIF 信息，如 GPS、设备型号、拍摄时间等 |
| 图片工具 | 图片格式转换 | PNG、JPG、WebP 互转，支持批量处理和质量调节 |
| PDF 工具 | 图片合并 PDF | 将多张图片排序后导出为 PDF |
| PDF 工具 | PDF 合并 | 合并多个 PDF 文件并调整顺序 |
| 开发工具 | JSON 工具 | JSON 格式化、压缩、转义、智能纠错和差异对比 |
| 开发工具 | URL 编解码 | URL 编码、解码和查询参数解析 |
| 开发工具 | Markdown 编辑器 | 实时预览、代码高亮，支持导入导出 Markdown/HTML |
| 实用工具 | 二维码生成器 | 根据文字或链接生成二维码，并支持样式调整 |

## 技术栈

- [Nuxt 3](https://nuxt.com/)：Vue 应用框架
- [Vue 3](https://vuejs.org/)：Composition API
- [Tailwind CSS](https://tailwindcss.com/)：原子化样式
- [pdf-lib](https://pdf-lib.js.org/)：PDF 创建与合并
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)：图片压缩
- [vue-cropper](https://github.com/xyxiao001/vue-cropper)：图片裁剪
- [exifr](https://github.com/MikeKovarik/exifr)：EXIF 解析
- [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/)：Markdown 渲染和代码高亮
- [qrcode](https://github.com/soldair/node-qrcode)：二维码生成
- [lucide-vue-next](https://lucide.dev/)：图标

## 本地运行

请使用 npm 安装和运行项目。

```bash
npm install
npm run dev
```

启动后访问终端提示的本地地址，通常是：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run generate # 生成静态站点
npm run preview  # 预览构建产物
npm run typecheck # TypeScript 类型检查
npm test         # 运行基础测试
```

## 项目结构

```text
.
├── components/        # 通用组件
├── composables/       # 组合式函数与工具列表
├── layouts/           # 页面布局
├── pages/             # Nuxt 文件路由页面
├── tests/             # 基础测试脚本
├── utils/             # 文件、JSON、Markdown 等工具函数
├── app.vue            # 应用入口
├── nuxt.config.ts     # Nuxt 配置
└── package.json       # 项目脚本与依赖
```

## 隐私说明

LocalTools 的核心设计目标是让文件处理尽可能留在本地浏览器中完成。图片压缩、图片裁剪、EXIF 读取与清除、PDF 合并、图片转 PDF、JSON 处理、URL 编解码、Markdown 预览和二维码生成等操作均不依赖文件上传接口。

如果你自行修改项目并引入远程 API、统计脚本或第三方上传服务，请在发布前重新审查隐私说明。
