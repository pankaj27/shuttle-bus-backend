import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // CSS is already imported globally in main.js
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group Ant Design (Working and Tree-shaken)
            if (id.includes('ant-design-vue') || id.includes('@ant-design')) {
              return 'vendor-antd'
            }
            // Group Editor (Working and isolated)
            if (id.includes('@wangeditor')) {
              return 'vendor-editor'
            }
            // Everything else to vendor (Vue core, Maps, Charts, Icons, Utils)
            // This ensures all interdependent libraries share the same scope
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:3002', //http://localhost:8000
        changeOrigin: true,
        secure: false,
      },
      '/public': {
        target: 'http://localhost:3002', //http://localhost:8000
        changeOrigin: true,
      },
    },
  },
})
