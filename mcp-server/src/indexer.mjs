// Builds and caches a compact index of the target project so the MCP tools
// can answer questions in tiny payloads instead of forcing the agent to
// re-read whole files.

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, dirname, extname } from 'node:path'

const CODE_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.css', '.html', '.md'])
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vite', '.cache', 'coverage', '.idea', '.vscode', 'mcp-server'])

// Walk a directory recursively, returning a list of {relPath, abs, size, isDir}
export const walk = async (root) => {
  const out = []
  const visit = async (dir) => {
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (IGNORE_DIRS.has(e.name)) continue
      const abs = join(dir, e.name)
      const rel = relative(root, abs).replace(/\\/g, '/')
      if (e.isDirectory()) {
        out.push({ relPath: rel, abs, isDir: true })
        await visit(abs)
      } else if (e.isFile()) {
        let size = 0
        try { size = (await stat(abs)).size } catch {}
        out.push({ relPath: rel, abs, isDir: false, size })
      }
    }
  }
  await visit(root)
  return out
}

// Build a compact ASCII tree (depth-limited) for the project. Keeps payload
// small by truncating large directories.
export const buildTree = (entries, { maxDepth = 6, maxPerDir = 40 } = {}) => {
  const children = new Map() // dirRel -> [name,isDir][]
  const ensure = (key) => { if (!children.has(key)) children.set(key, []); return children.get(key) }
  for (const e of entries) {
    if (e.relPath === '') continue
    const parent = dirname(e.relPath).replace(/\\/g, '/')
    const parentKey = parent === '.' ? '' : parent
    ensure(parentKey).push({ name: e.relPath.split('/').pop(), isDir: e.isDir, rel: e.relPath })
  }
  const lines = []
  const render = (dirKey, prefix, depth) => {
    const items = (children.get(dirKey) || []).slice().sort((a, b) =>
      (b.isDir - a.isDir) || a.name.localeCompare(b.name)
    )
    const shown = items.slice(0, maxPerDir)
    const hidden = items.length - shown.length
    for (let i = 0; i < shown.length; i++) {
      const item = shown[i]
      const last = i === shown.length - 1 && hidden === 0
      const branch = last ? '└─ ' : '├─ '
      lines.push(prefix + branch + item.name + (item.isDir ? '/' : ''))
      if (item.isDir && depth < maxDepth) {
        render(item.rel, prefix + (last ? '   ' : '│  '), depth + 1)
      }
    }
    if (hidden > 0) lines.push(prefix + `└─ … (+${hidden} more)`)
  }
  render('', '', 1)
  return lines.join('\n')
}

// Quick-and-dirty outline extractor: imports, exports, top-level function /
// const / class names, plus line count. Regex-based — keeps the indexer
// dependency-free and fast.
const EXPORT_RE = /^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?\s+([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|const\s+([A-Za-z_$][\w$]*)|let\s+([A-Za-z_$][\w$]*)|var\s+([A-Za-z_$][\w$]*))/gm
const EXPORT_BRACE_RE = /^export\s*\{([^}]+)\}/gm
const IMPORT_RE = /^import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gm
const FN_RE = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm
const CONST_RE = /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm

export const outlineFile = async (abs) => {
  let text = ''
  try { text = await readFile(abs, 'utf8') } catch { return null }
  const lineCount = text.split('\n').length
  const exports = new Set()
  const imports = new Set()
  const topLevel = new Set()

  let m
  while ((m = EXPORT_RE.exec(text))) {
    const name = m[1] || m[2] || m[3] || m[4] || m[5]
    if (name) exports.add(name)
  }
  while ((m = EXPORT_BRACE_RE.exec(text))) {
    m[1].split(',').map(s => s.trim().split(/\s+as\s+/i)[0]).filter(Boolean).forEach(n => exports.add(n))
  }
  if (/^export\s+default/m.test(text)) exports.add('default')
  while ((m = IMPORT_RE.exec(text))) imports.add(m[1])
  while ((m = FN_RE.exec(text))) topLevel.add(m[1])
  while ((m = CONST_RE.exec(text))) topLevel.add(m[1])

  return {
    lineCount,
    bytes: Buffer.byteLength(text, 'utf8'),
    imports: [...imports],
    exports: [...exports],
    topLevel: [...topLevel].slice(0, 50),
  }
}

// Build the full project index.
export const buildIndex = async (root) => {
  const entries = await walk(root)
  const files = entries.filter(e => !e.isDir)
  const dirs = entries.filter(e => e.isDir)

  const outlines = {}

  // Process files in parallel batches for speed
  const BATCH = 50
  const codeFiles = files.filter(f => {
    const ext = extname(f.relPath).toLowerCase()
    return CODE_EXT.has(ext) && f.size <= 1_500_000
  })

  for (let i = 0; i < codeFiles.length; i += BATCH) {
    const batch = codeFiles.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(async (f) => {
      const ext = extname(f.relPath).toLowerCase()
      if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs' || ext === '.ts' || ext === '.tsx') {
        const o = await outlineFile(f.abs)
        return o ? { rel: f.relPath, outline: o } : null
      } else {
        try {
          const t = await readFile(f.abs, 'utf8')
          return { rel: f.relPath, outline: { lineCount: t.split('\n').length, bytes: f.size } }
        } catch { return null }
      }
    }))
    for (const r of results) {
      if (r) outlines[r.rel] = r.outline
    }
  }

  return {
    root,
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    dirCount: dirs.length,
    tree: buildTree(entries),
    outlines,
  }
}

// Incremental update: reindex only specific files, merging into an existing index.
export const updateIndex = async (existingIndex, changedPaths, root) => {
  const outlines = { ...existingIndex.outlines }

  const results = await Promise.all(changedPaths.map(async (relPath) => {
    const abs = join(root, relPath)
    const ext = extname(relPath).toLowerCase()
    if (!CODE_EXT.has(ext)) return { rel: relPath, outline: null }
    let s
    try { s = await stat(abs) } catch { return { rel: relPath, outline: null } } // deleted
    if (!s.isFile() || s.size > 1_500_000) return { rel: relPath, outline: null }
    if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs' || ext === '.ts' || ext === '.tsx') {
      const o = await outlineFile(abs)
      return { rel: relPath, outline: o }
    } else {
      try {
        const t = await readFile(abs, 'utf8')
        return { rel: relPath, outline: { lineCount: t.split('\n').length, bytes: s.size } }
      } catch { return { rel: relPath, outline: null } }
    }
  }))

  for (const r of results) {
    if (r.outline) {
      outlines[r.rel] = r.outline
    } else {
      delete outlines[r.rel] // file deleted or unreadable
    }
  }

  return {
    ...existingIndex,
    generatedAt: new Date().toISOString(),
    outlines,
  }
}

export const saveIndex = async (index, path) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(index), 'utf8')
}

export const loadIndex = async (path) => {
  try {
    const t = await readFile(path, 'utf8')
    return JSON.parse(t)
  } catch {
    return null
  }
}
