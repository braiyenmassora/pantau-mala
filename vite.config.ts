/// <reference types="vitest/config" />
import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(rootDir, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react'
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'query'
          }
          if (id.includes('maplibre-gl') || id.includes('/maplibre')) {
            return 'maplibre'
          }
          if (id.includes('components/ui/map')) {
            return 'map-shell'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
