/* global Bun */
import { resolve, sep } from 'node:path'
import { createClientGateway } from './client-gateway.mjs'
if (process.env.FE_ACCESS_MODE !== 'client') throw new Error('Production server requires FE_ACCESS_MODE=client')
const gateway = createClientGateway(process.env)
const root = resolve(import.meta.dir, '../dist')
if (!(await Bun.file(resolve(root, 'index.html')).exists())) throw new Error('Build frontend before starting server')
const port = Number(process.env.PORT || 5173)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
Bun.serve({
  hostname: process.env.HOST || '127.0.0.1', port,
  async fetch(request) {
    const api = await gateway(request)
    if (api) return api
    if (!['GET','HEAD'].includes(request.method)) return new Response(null, { status: 405 })
    let path
    try { path = decodeURIComponent(new URL(request.url).pathname) } catch { return new Response(null, { status: 400 }) }
    if (path.includes('\\') || path.split('/').some((part) => part.startsWith('.'))) return new Response(null, { status: 404 })
    const filename = resolve(root, '.' + path)
    if (filename !== root && !filename.startsWith(root + sep)) return new Response(null, { status: 404 })
    let file = Bun.file(filename)
    if (!(await file.exists()) || path === '/') {
      if (path !== '/' && path.includes('.')) return new Response(null, { status: 404 })
      file = Bun.file(resolve(root, 'index.html'))
    }
    return new Response(request.method === 'HEAD' ? null : file, { headers: {
      'Content-Type': file.type,
      'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.cartocdn.com; font-src 'self' data:; connect-src 'self' https://*.cartocdn.com https://unpkg.com; worker-src 'self' blob: https://unpkg.com",
    } })
  },
  error() { return new Response('Service unavailable', { status: 503 }) },
})
console.log(`pantau-mala frontend ready on port ${port}`)
