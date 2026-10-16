import { access, readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClientGateway } from './client-gateway.mjs'

if (process.env.FE_ACCESS_MODE !== 'client') {
  throw new Error('Production server requires FE_ACCESS_MODE=client')
}

const gateway = createClientGateway(process.env)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
try {
  await access(resolve(root, 'index.html'))
} catch {
  throw new Error('Build frontend before starting server')
}

const port = Number(process.env.PORT || 5173)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT')
const host = process.env.HOST || '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
}

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.cartocdn.com https://*.google-analytics.com https://www.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://*.cartocdn.com https://unpkg.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com; worker-src 'self' blob: https://unpkg.com",
}

async function sendFile(res, filename, method, cacheControl) {
  const body = method === 'HEAD' ? null : await readFile(filename)
  const type = MIME[extname(filename)] || 'application/octet-stream'
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': cacheControl,
    ...SECURITY,
  })
  res.end(body)
}

createServer(async (req, res) => {
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value)
      else if (Array.isArray(value)) headers.set(key, value.join(', '))
    }
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers,
    })
    const api = await gateway(request)
    if (api) {
      res.statusCode = api.status
      api.headers.forEach((value, key) => res.setHeader(key, value))
      res.end(Buffer.from(await api.arrayBuffer()))
      return
    }

    if (!['GET', 'HEAD'].includes(req.method || '')) {
      res.writeHead(405)
      res.end()
      return
    }

    let path
    try {
      path = decodeURIComponent(new URL(request.url).pathname)
    } catch {
      res.writeHead(400)
      res.end()
      return
    }
    if (path.includes('\\') || path.split('/').some((part) => part.startsWith('.'))) {
      res.writeHead(404)
      res.end()
      return
    }

    let filename = resolve(root, '.' + path)
    if (filename !== root && !filename.startsWith(root + sep)) {
      res.writeHead(404)
      res.end()
      return
    }

    let ok = false
    try {
      const info = await stat(filename)
      ok = info.isFile()
    } catch {
      ok = false
    }

    if (!ok || path === '/') {
      if (path !== '/' && path.includes('.')) {
        res.writeHead(404)
        res.end()
        return
      }
      filename = resolve(root, 'index.html')
    }

    const cache = path.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
    await sendFile(res, filename, req.method || 'GET', cache)
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Service unavailable')
  }
}).listen(port, host, () => {
  console.log(`pantau-mala frontend ready on port ${port}`)
})
