import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 預設根路徑 '/'，可由 VITE_BASE_PATH 動態指定。
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    vue(),
    // PWA 外殼快取靜態產物並支援離線導覽。採 prompt 避免操作中途自動重新整理。
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'POS 點餐系統',
        short_name: 'POS',
        description: '單店單機使用的手搖飲點餐收銀系統',
        theme_color: '#ef4444',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
