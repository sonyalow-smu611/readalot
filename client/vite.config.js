// Scaffolded with AI assistance (Phase 1) — see AI_USAGE.md
// Vite — dev server and production bundler. @vitejs/plugin-vue (Vite's official
// Vue plugin) compiles .vue single-file components.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
