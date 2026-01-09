// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss'],

    app: {
        head: {
            title: 'LocalTools - 本地图片压缩与PDF工具',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: '纯本地运行的在线工具集，提供图片压缩、PDF合并、图片转PDF等功能，数据不上传服务器，安全高效。' }
            ]
        }
    },

    compatibilityDate: '2025-01-09',
    devtools: { enabled: true }
})
