#!/usr/bin/env node
// Believer-of-Almighty local MCP server.
//
// Goal: cut Claude / Copilot token usage by exposing tiny, targeted tools
// instead of forcing the agent to re-list directories and re-read whole files
// on every turn.
//
// Tools provided:
//   project_overview  — hand-curated facts (routes, data layer, APIs, gotchas)
//   project_tree      — compact ASCII tree (depth-limited)
//   list_files        — files matching a glob-ish pattern
//   file_outline      — imports/exports/top-level symbols + line count
//   read_lines        — read only a line range from a file
//   search_code       — regex grep with capped matches + line context
//   find_symbol       — locate definition/usages of a name across the project
//   reindex           — rebuild the project index on demand
//
// Configure PROJECT_ROOT in env (defaults to a sibling Believer-of-Almighty
// folder next to this server).

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { readFile, stat } from 'node:fs/promises'
import { watch } from 'node:fs'
import { resolve, join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildIndex, saveIndex, loadIndex, outlineFile, updateIndex } from './indexer.mjs'
import { PROJECT_OVERVIEW } from './overview.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SERVER_ROOT = resolve(__dirname, '..')
const INDEX_PATH = join(SERVER_ROOT, '.cache', 'index.json')

// Default: the server lives inside the project as `<project>/mcp-server/`,
// so the parent of SERVER_ROOT is the project root.
const PROJECT_ROOT = resolve(
  process.env.PROJECT_ROOT ||
  join(SERVER_ROOT, '..')
)

// ---- Index (lazy, cached on disk) ----
let indexPromise = null
const getIndex = async ({ force = false } = {}) => {
  if (!force && indexPromise) return indexPromise
  indexPromise = (async () => {
    if (!force) {
      const cached = await loadIndex(INDEX_PATH)
      if (cached && cached.root === PROJECT_ROOT) return cached
    }
    const fresh = await buildIndex(PROJECT_ROOT)
    await saveIndex(fresh, INDEX_PATH)
    return fresh
  })()
  return indexPromise
}

// ---- Helpers ----
const safeResolve = (relPath) => {
  const abs = resolve(PROJECT_ROOT, relPath)
  const rel = relative(PROJECT_ROOT, abs)
  if (rel.startsWith('..') || resolve(PROJECT_ROOT, rel) !== abs) {
    throw new Error(`Path escapes project root: ${relPath}`)
  }
  return abs
}

const globToRegex = (glob) => {
  // very small glob: **, *, ?
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++ }
      else re += '[^/]*'
    } else if (c === '?') re += '.'
    else if ('.+^$|()[]{}\\'.includes(c)) re += '\\' + c
    else re += c
  }
  return new RegExp('^' + re + '$', 'i')
}

const text = (s) => ({ content: [{ type: 'text', text: s }] })

// ---- Tool implementations ----
const tools = {
  project_overview: {
    description: 'Returns a hand-curated, high-density JSON overview of the project (routes, data layer, external APIs, pipeline notes, build commands, known gotchas). Always call this FIRST before exploring — it usually answers structural questions in ~2 KB and prevents redundant file reads.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => text(JSON.stringify(PROJECT_OVERVIEW, null, 2)),
  },

  project_tree: {
    description: 'Compact ASCII tree of the project (node_modules / dist / .git ignored). Optional `subdir` to scope, `maxDepth` (default 6). Use this instead of repeated directory listings.',
    inputSchema: {
      type: 'object',
      properties: {
        subdir: { type: 'string', description: 'Optional sub-path to scope the tree' },
        maxDepth: { type: 'number', description: 'Max depth (default 6)' },
      },
    },
    handler: async ({ subdir, maxDepth }) => {
      const idx = await getIndex()
      let tree = idx.tree
      if (subdir) {
        const prefix = subdir.replace(/\\/g, '/').replace(/\/$/, '') + '/'
        const lines = tree.split('\n').filter(l => l.includes(prefix) || l.endsWith(subdir + '/'))
        tree = lines.join('\n') || `(no entries under ${subdir})`
      }
      if (typeof maxDepth === 'number' && maxDepth < 6) {
        tree = tree.split('\n').filter(l => {
          const indent = (l.match(/^(\s|│|├|└|─)*/)?.[0].length || 0) / 3
          return indent <= maxDepth
        }).join('\n')
      }
      return text(`# Project tree (root: ${PROJECT_ROOT})\n${tree}`)
    },
  },

  list_files: {
    description: 'List indexed files matching a simple glob (** = any path, * = any name segment). Examples: "src/**/*.jsx", "**/*.css". Returns relPath + lineCount + bytes.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern, defaults to **/*' },
        limit: { type: 'number', description: 'Max results (default 200)' },
      },
    },
    handler: async ({ pattern = '**/*', limit = 200 }) => {
      const idx = await getIndex()
      const re = globToRegex(pattern)
      const out = []
      for (const [rel, info] of Object.entries(idx.outlines)) {
        if (!re.test(rel)) continue
        out.push({ path: rel, lines: info.lineCount, bytes: info.bytes })
        if (out.length >= limit) break
      }
      return text(JSON.stringify({ count: out.length, files: out }, null, 2))
    },
  },

  file_outline: {
    description: 'Returns line count, imports, exports, and top-level symbol names for a single file — no body. Use this before deciding whether/where to read_lines. Saves dramatic amounts of tokens vs reading the whole file.',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: { path: { type: 'string', description: 'Project-relative file path' } },
    },
    handler: async ({ path }) => {
      const abs = safeResolve(path)
      const o = await outlineFile(abs)
      if (!o) return text(`(file not found or unreadable: ${path})`)
      return text(JSON.stringify({ path, ...o }, null, 2))
    },
  },

  read_lines: {
    description: 'Read a specific line range from a file (1-based, inclusive). Always prefer this over reading whole files. Default range is 1..200.',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: {
        path: { type: 'string' },
        start: { type: 'number', description: '1-based start line (default 1)' },
        end: { type: 'number', description: '1-based end line (default start+200)' },
      },
    },
    handler: async ({ path, start = 1, end }) => {
      const abs = safeResolve(path)
      const t = await readFile(abs, 'utf8')
      const lines = t.split('\n')
      const s = Math.max(1, start | 0)
      const e = Math.min(lines.length, (end | 0) || (s + 199))
      const slice = lines.slice(s - 1, e)
      const numbered = slice.map((l, i) => `${String(s + i).padStart(4)}  ${l}`).join('\n')
      return text(`# ${path}  lines ${s}-${e} of ${lines.length}\n${numbered}`)
    },
  },

  search_code: {
    description: 'Fast regex search across indexed source files. Returns up to `limit` matches with 1 line of context each. Use this instead of unconstrained grep_search.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'JavaScript regex pattern' },
        flags: { type: 'string', description: 'Regex flags (default "i")' },
        pattern: { type: 'string', description: 'Optional glob filter (default **/*)' },
        limit: { type: 'number', description: 'Max matches (default 40)' },
      },
    },
    handler: async ({ query, flags = 'i', pattern = '**/*', limit = 40 }) => {
      const idx = await getIndex()
      const fileRe = globToRegex(pattern)
      let re
      try { re = new RegExp(query, flags.includes('g') ? flags : flags + 'g') }
      catch (e) { return text(`Invalid regex: ${e.message}`) }
      const hits = []
      for (const rel of Object.keys(idx.outlines)) {
        if (!fileRe.test(rel)) continue
        let body
        try { body = await readFile(safeResolve(rel), 'utf8') } catch { continue }
        const lines = body.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            hits.push(`${rel}:${i + 1}  ${lines[i].trim().slice(0, 200)}`)
            if (hits.length >= limit) break
          }
          re.lastIndex = 0
        }
        if (hits.length >= limit) break
      }
      return text(`# matches: ${hits.length}\n` + hits.join('\n'))
    },
  },

  find_symbol: {
    description: 'Locate a symbol (function, component, const, export) across the project. First checks pre-built outlines for exports/top-level definitions, then falls back to a word-boundary code search. Much cheaper than full grep.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Exact symbol name' },
        limit: { type: 'number', description: 'Max usage hits (default 25)' },
      },
    },
    handler: async ({ name, limit = 25 }) => {
      const idx = await getIndex()
      const definedIn = []
      for (const [rel, info] of Object.entries(idx.outlines)) {
        if (info.exports?.includes(name) || info.topLevel?.includes(name)) {
          definedIn.push(rel)
        }
      }
      const reStr = `\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&')}\\b`
      const re = new RegExp(reStr, 'g')
      const usages = []
      for (const rel of Object.keys(idx.outlines)) {
        let body
        try { body = await readFile(safeResolve(rel), 'utf8') } catch { continue }
        const lines = body.split('\n')
        for (let i = 0; i < lines.length; i++) {
          re.lastIndex = 0
          if (re.test(lines[i])) {
            usages.push(`${rel}:${i + 1}  ${lines[i].trim().slice(0, 160)}`)
            if (usages.length >= limit) break
          }
        }
        if (usages.length >= limit) break
      }
      return text(JSON.stringify({ name, definedIn, usages }, null, 2))
    },
  },

  reindex: {
    description: 'Force-rebuild the project index. Call after large file changes if outlines feel stale.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const fresh = await getIndex({ force: true })
      return text(`Reindexed: ${fresh.fileCount} files, ${fresh.dirCount} directories.`)
    },
  },
}

// ---- MCP wiring ----
const server = new Server(
  { name: 'believer-context', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, t]) => ({
    name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params
  const tool = tools[name]
  if (!tool) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
  }
  try {
    return await tool.handler(args)
  } catch (e) {
    return { content: [{ type: 'text', text: `Error in ${name}: ${e?.message || e}` }], isError: true }
  }
})

// ---- Auto-reindex on file changes ----
const IGNORE_WATCH = /(^|[\\/])(node_modules|\.git|dist|build|\.next|\.vite|\.cache|coverage|\.idea|\.vscode|mcp-server[\\/](node_modules|\.cache))([\\/]|$)/i

const startWatcher = () => {
  let pending = null
  const changedFiles = new Set()

  const schedule = () => {
    if (pending) clearTimeout(pending)
    pending = setTimeout(async () => {
      pending = null
      const files = [...changedFiles]
      changedFiles.clear()

      try {
        const current = await getIndex()
        if (files.length > 0 && files.length <= 20) {
          // Incremental: only reindex changed files (fast)
          const updated = await updateIndex(current, files, PROJECT_ROOT)
          await saveIndex(updated, INDEX_PATH)
          indexPromise = Promise.resolve(updated)
          console.error(`[believer-mcp] incremental reindex: ${files.length} file(s) updated`)
        } else {
          // Full reindex if too many files changed at once
          const fresh = await getIndex({ force: true })
          console.error(`[believer-mcp] full reindex: ${fresh.fileCount} files, ${fresh.dirCount} dirs`)
        }
      } catch (e) {
        console.error('[believer-mcp] reindex failed:', e?.message || e)
      }
    }, 500) // 500ms debounce (was 1500ms)
  }

  try {
    watch(PROJECT_ROOT, { recursive: true }, (_evt, filename) => {
      if (!filename) return
      if (IGNORE_WATCH.test(filename)) return
      changedFiles.add(filename.replace(/\\/g, '/'))
      schedule()
    })
    console.error(`[believer-mcp] watching ${PROJECT_ROOT} for changes`)
  } catch (e) {
    console.error('[believer-mcp] watcher unavailable:', e?.message || e)
  }
}

const main = async () => {
  // Warm the index in the background — first tool call will already have it.
  getIndex().catch(() => {})
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr is safe for logs (stdout is reserved for MCP frames)
  console.error(`[believer-mcp] connected. PROJECT_ROOT=${PROJECT_ROOT}`)
  startWatcher()
}

main().catch((e) => {
  console.error('[believer-mcp] fatal:', e)
  process.exit(1)
})
