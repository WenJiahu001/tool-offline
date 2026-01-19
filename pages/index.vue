<script setup>
useSeoMeta({
  title: 'LocalTools - 免费且安全的在线图片处理与PDF工具箱',
  description: '您的随身本地工具箱，提供图片压缩、PDF合并、图片转PDF等实用功能。纯浏览器运行，数据无需上传服务器，安全、快速、免费。',
  keywords: '在线工具, 本地工具, 图片压缩, PDF合并, 图片转PDF, 免费工具, 数据安全'
})
</script>

<template>
  <div class="p-8 sm:p-12">
    <div class="max-w-6xl mx-auto">
      <!-- 头部区域 -->
      <div class="text-center mb-16">

        <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          本地工具箱
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          无需上传至服务器，直接在您的浏览器中快速处理文件。高效、安全、免费。
        </p>
      </div>
      
      <!-- 工具网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- 图片压缩工具 -->
        <NuxtLink 
          to="/image-compress" 
          class="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">图片压缩</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            高效压缩 PNG/JPG 图片，智能平衡画质与体积，支持批量处理。
          </p>
          <div class="mt-auto pt-6 flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            立即开始 <span class="ml-1">&rarr;</span>
          </div>
        </NuxtLink>
        
        <!-- PDF 合并 -->
        <NuxtLink 
          to="/pdf-tools" 
          class="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">PDF 合并</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            将多个 PDF 文档合并为一个文件，自由调整页面顺序。
          </p>
          <div class="mt-auto pt-6 flex items-center text-purple-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            立即开始 <span class="ml-1">&rarr;</span>
          </div>
        </NuxtLink>

        <!-- 图片合并 PDF -->
        <NuxtLink 
          to="/image-to-pdf" 
          class="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">图片合并 PDF</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            将批量图片拼接并转换为高质量 PDF 文档，即用即走。
          </p>
          <div class="mt-auto pt-6 flex items-center text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            立即开始 <span class="ml-1">&rarr;</span>
          </div>
        </NuxtLink>
        
        <!-- 图片裁剪工具 -->
        <NuxtLink 
          to="/image-crop" 
          class="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-start overflow-hidden active:scale-95"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
          <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">图片裁剪</h2>
          <p class="text-gray-500 text-sm leading-relaxed">
            支持常用证件照尺寸裁剪、自定义像素裁剪，操作简单。
          </p>
          <div class="mt-auto pt-6 flex items-center text-orange-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            立即开始 <span class="ml-1">&rarr;</span>
          </div>
        </NuxtLink>
      </div>

      <!-- 底部版权 -->
      <div class="text-center mt-20 text-gray-400 text-sm">
        &copy; 2026 LocalTools. All rights reserved.
      </div>
    </div>
  </div>
</template>