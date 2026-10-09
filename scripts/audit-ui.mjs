#!/usr/bin/env node
/**
 * UI consistency gate for forever-young.
 * Scans app components (not shadcn/mapcn vendor under src/components/ui/).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SCAN_ROOTS = [join(ROOT, 'src')]
const IGNORE_DIRS = new Set(['ui', 'node_modules'])
const IGNORE_FILES = new Set(['tokens.css'])

const HEX_ALLOW = new Set([
  join(ROOT, 'src/lib/risk-category.ts'),
  join(ROOT, 'src/styles/tokens.css'),
])

const BANNED_TW_COLORS =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:blue|sky|indigo|cyan|slate|gray|zinc|neutral|stone|purple|violet|fuchsia|pink|rose)-\d{2,3}\b/

/** Half-steps only (1.5 etc). gap-1 (=4px) is allowed for small labels / trailing icons. */
const HALF_STEP_SPACING =
  /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-[xy]|inset|top|right|bottom|left|scroll-m|scroll-p)-(?:\d+\.)?(?:0\.5|1\.5|2\.5|3\.5)\b/

const BAD_ROUNDED =
  /\brounded-(?!ctl\b|card\b|panel\b|full\b|none\b|[trblse]-(?:ctl|card|panel|full)\b)[a-z0-9\[\]\/.-]+\b/

const BAD_SHADOW =
  /\bshadow-(?!sm\b|md\b|lg\b|map\b|none\b)[a-z0-9\[\]\/.-]+\b/

const TEXT_ARBITRARY = /\btext-\[[^\]]*px[^\]]*\]/

const HEX_OR_RGB =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/

const WHITE_CLASS = /\b(?:bg|text|border)-white\b/
const UPPERCASE_CLASS = /\buppercase\b/
const BANNED_VISIBLE = /\b(?:hotspot|confidence|Anda|saya)\b/i

/** Allowed arbitrary px for h-/w-/size-[Npx] (density + sparks + hairlines). */
const ALLOWED_PX = new Set([
  1, 2, 3, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 68,
  128, 240, 360, 400, 416, 432,
])

const ARBITRARY_SIZE = /\b(?:h|w|size|min-h|max-h|min-w|max-w)-\[(\d+)px\]/g

/** Lucide size-* on the same attribute: only 14/16/18/20 (or TW 3.5/4/4.5/5). */
const LUCIDE_ICON_SIZE =
  /\b(?:className)=["'`][^"'`]*\bsize-(?:\[(\d+)px\]|(3\.5|4\.5|4|5))\b/

const failures = []

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(tsx|ts|css)$/.test(name) && !IGNORE_FILES.has(name)) out.push(full)
  }
  return out
}

function rel(path) {
  return relative(ROOT, path)
}

function add(file, line, rule, snippet) {
  failures.push({ file: rel(file), line, rule, snippet: snippet.trim().slice(0, 120) })
}

function visibleStrings(source) {
  const found = []
  const attr =
    /\b(?:aria-label|title|placeholder)=\{?\s*(['"`])([\s\S]*?)\1\s*\}?/g
  let m
  while ((m = attr.exec(source))) {
    found.push({ index: m.index, text: m[2] })
  }
  const jsxText = />([^<>{]+)</g
  while ((m = jsxText.exec(source))) {
    const t = m[1].trim()
    if (t) found.push({ index: m.index, text: t })
  }
  return found
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length
}

function scanFile(file) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')
  const underComponents = file.includes('/src/components/')
  const underUi = file.includes('/src/components/ui/')
  const isAppTsx = file.endsWith('/src/App.tsx')
  const scanClasses = (underComponents && !underUi) || isAppTsx
  const allowHex = HEX_ALLOW.has(file)

  if (scanClasses) {
    lines.forEach((line, i) => {
      const n = i + 1
      if (!allowHex && HEX_OR_RGB.test(line)) add(file, n, 'hex/rgb/hsl literal', line)
      if (WHITE_CLASS.test(line)) add(file, n, 'bg/text/border-white', line)
      if (UPPERCASE_CLASS.test(line)) add(file, n, 'uppercase class', line)
      if (BANNED_TW_COLORS.test(line)) add(file, n, 'default Tailwind palette color', line)
      if (HALF_STEP_SPACING.test(line)) add(file, n, 'spacing not multiple of 4', line)
      if (BAD_ROUNDED.test(line)) add(file, n, 'rounded outside ctl/card/panel/full', line)
      if (BAD_SHADOW.test(line)) add(file, n, 'shadow outside sm/md/lg/map', line)
      if (TEXT_ARBITRARY.test(line)) add(file, n, 'arbitrary text-[..px]', line)

      ARBITRARY_SIZE.lastIndex = 0
      let m
      while ((m = ARBITRARY_SIZE.exec(line))) {
        const px = Number(m[1])
        if (!ALLOWED_PX.has(px)) add(file, n, 'arbitrary h/w/size px not allowed', line)
      }

      const lucide = LUCIDE_ICON_SIZE.exec(line)
      LUCIDE_ICON_SIZE.lastIndex = 0
      if (lucide && line.includes('strokeWidth')) {
        if (lucide[1]) {
          const px = Number(lucide[1])
          if (![14, 16, 18, 20].includes(px)) {
            add(file, n, 'lucide size outside 14/16/18/20', line)
          }
        }
      }
    })
  }

  if (file.endsWith('.tsx') && !underUi) {
    for (const { index, text } of visibleStrings(source)) {
      if (BANNED_VISIBLE.test(text)) {
        add(file, lineAt(source, index), 'banned visible word', text)
      }
    }
  }
}

const files = SCAN_ROOTS.flatMap((r) => walk(r))
for (const file of files) scanFile(file)

if (failures.length) {
  console.error(`audit-ui: ${failures.length} finding(s)\n`)
  for (const f of failures) {
    console.error(`${f.file}:${f.line}  [${f.rule}]  ${f.snippet}`)
  }
  process.exit(1)
}

console.log(`audit-ui: ok (${files.length} files)`)
