// https://nuxt.com/docs/api/configuration/nuxt-config
const isProd = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt', '@vite-pwa/nuxt'],

    pwa: {
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        manifest: {
            name: 'LocalTools 本地工具箱',
            short_name: 'LocalTools',
            description: '纯本地运行的在线工具集，数据不上传服务器，安全高效。',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            icons: [
                {
                    src: '/icons/192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any'
                },
                {
                    src: '/icons/512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable'
                }
            ],
            launch_handler: {
                client_mode: 'focus-existing'
            }
        },
        workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,png,svg,ico}']
        },
        devOptions: {
            enabled: true,
            type: 'module',
            suppressWarnings: true
        }
    },

    app: {
        head: {
            title: 'LocalTools - 本地图片压缩与PDF工具',
            link: [
                { rel: 'icon', type: 'image/png', href: '/icons/192x192.png' },
                { rel: 'manifest', href: '/manifest.json' }
            ],
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: '纯本地运行的在线工具集，提供图片压缩、PDF合并、图片转PDF等功能，数据不上传服务器，安全高效。' }
            ],
            script: isProd ? [
                {
                    innerHTML: "if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/' }) }) }",
                    type: 'text/javascript'
                }
            ] : []
        }
    },

    compatibilityDate: '2025-01-09',
    devtools: { enabled: true }
})

