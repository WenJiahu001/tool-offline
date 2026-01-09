import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ImageCompress from '../views/ImageCompress.vue'
import PdfTools from '../views/PdfTools.vue'
import ImageToPdf from '../views/ImageToPdf.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/image-compress',
    name: 'ImageCompress',
    component: ImageCompress
  },
  {
    path: '/pdf-tools',
    name: 'PdfTools',
    component: PdfTools
  },
  {
    path: '/image-to-pdf',
    name: 'ImageToPdf',
    component: ImageToPdf
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router