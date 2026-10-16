import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const directory = resolve(process.argv[2] || 'dist')
const workerPath = join(directory, 'sw.js')
const worker = readFileSync(workerPath, 'utf8').replace(
  /const BUILD_ID = '[^']*'/,
  "const BUILD_ID = '__PANTAU_BUILD__'",
)
if (!worker.includes("const BUILD_ID = '__PANTAU_BUILD__'")) {
  throw new Error('Service worker build placeholder missing')
}
const hash = createHash('sha256').update(worker)
function visit(relative = '') {
  const entries = readdirSync(join(directory, relative), { withFileTypes: true })
    .sort((first, second) => first.name < second.name ? -1 : first.name > second.name ? 1 : 0)
  for (const entry of entries) {
    const path = join(relative, entry.name)
    if (entry.isDirectory()) visit(path)
    else if (path !== 'sw.js') hash.update(path).update('\0').update(readFileSync(join(directory, path)))
  }
}
visit()
const build = hash.digest('hex').slice(0, 16)
writeFileSync(workerPath, worker.replaceAll('__PANTAU_BUILD__', build))
console.log(`service-worker: versioned ${build}`)
