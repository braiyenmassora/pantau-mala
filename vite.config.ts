/// <reference types="vitest/config" />
import path from 'path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { createClientGateway } from './server/client-gateway.mjs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, rootDir, ''), ...process.env }
  const gateway = createClientGateway(env)
  return {

  plugins: [react(), tailwindcss(), {
    name: 'server-client-access',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (env.FE_ACCESS_MODE !== 'client') return next()
        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') headers.set(key, value)
        }
        const response = await gateway(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers }))
        if (!response) return next()
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: false },
      '/auth': { target: 'http://127.0.0.1:8080', changeOrigin: false },
    },
  },
  resolve: { alias: { '@': path.resolve(rootDir, './src') } },
  build: {
    // MapLibre chunk is large by design; initial JS stays under the 200 KB gzip gate.
    chunkSizeWarningLimit: 1200,
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
}
})
