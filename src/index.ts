#!/usr/bin/env node
import https from 'https'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

const API_URL = 'https://refinebacklog.com/api/refine'
const VERSION = '1.0.2'

interface RefinedItem {
  title: string
  problemStatement: string
  acceptanceCriteria: string[]
  estimate: string
  priority: string
  rationale: string
  tags: string[]
  userStory?: string
}

interface ApiResponse {
  items: RefinedItem[]
  _meta?: {
    tier: string
    itemsProcessed: number
    tokens?: number
  }
}

/**
 * Auto-detect project context from well-known files in the current working directory.
 * Tries files in priority order, combining up to 700 chars total.
 * Returns the context string and logs what was found.
 */
function detectProjectContext(): string | undefined {
  const cwd = process.cwd()
  const MAX_CHARS = 700

  const sources: Array<{ file: string; extractor: (content: string) => string }> = [
    { file: 'AGENTS.md',                       extractor: (c) => c.slice(0, 300) },
    { file: 'CLAUDE.md',                       extractor: (c) => c.slice(0, 300) },
    { file: 'CODEX.md',                        extractor: (c) => c.slice(0, 300) },
    { file: 'GEMINI.md',                       extractor: (c) => c.slice(0, 300) },
    { file: '.github/copilot-instructions.md', extractor: (c) => c.slice(0, 300) },
    { file: '.windsurfrules',                  extractor: (c) => c.slice(0, 300) },
    { file: 'llms.txt',                        extractor: (c) => c.slice(0, 300) },
    {
      file: 'README.md',
      extractor: (c) => c.slice(0, 300),
    },
    {
      file: 'package.json',
      extractor: (c) => {
        try {
          const pkg = JSON.parse(c)
          const parts: string[] = []
          if (pkg.name) parts.push(`name: ${pkg.name}`)
          if (pkg.description) parts.push(`description: ${pkg.description}`)
          const deps = [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.devDependencies || {}),
          ].slice(0, 8)
          if (deps.length) parts.push(`deps: ${deps.join(', ')}`)
          return parts.join(' | ')
        } catch {
          return ''
        }
      },
    },
    { file: 'prisma/schema.prisma', extractor: (c) => c.slice(0, 300) },
  ]

  const collected: string[] = []
  const usedSources: string[] = []
  let totalChars = 0

  for (const { file, extractor } of sources) {
    if (totalChars >= MAX_CHARS) break
    const fullPath = path.join(cwd, file)
    if (!fs.existsSync(fullPath)) continue
    try {
      const content = fs.readFileSync(fullPath, 'utf8').trim()
      if (!content) continue
      const extracted = extractor(content).trim()
      if (!extracted) continue
      const remaining = MAX_CHARS - totalChars
      const chunk = extracted.slice(0, remaining)
      collected.push(chunk)
      usedSources.push(file)
      totalChars += chunk.length
    } catch {
      // ignore unreadable files
    }
  }

  if (collected.length === 0) return undefined

  const combined = collected.join(' | ')
  console.error(`Auto-detected project context from: ${usedSources.join(', ')} (${combined.length} chars)`)
  return combined
}

function showHelp() {
  console.log(`
refine-backlog-cli v${VERSION}
Transform messy backlog items into structured, actionable work items.

USAGE
  npx refine-backlog-cli [items...] [options]
  cat backlog.txt | npx refine-backlog-cli [options]

EXAMPLES
  npx refine-backlog-cli "Fix login bug"
  npx refine-backlog-cli "Fix login" "Add dark mode" "Improve perf"
  npx refine-backlog-cli --file backlog.txt --gherkin
  cat items.txt | npx refine-backlog-cli --user-stories --format json

OPTIONS
  --file, -f <path>       Read items from file (one per line)
  --user-stories          Format titles as "As a [user], I want [goal]..."
  --gherkin               Format acceptance criteria as Given/When/Then
  --format <fmt>          Output format: markdown (default) or json
  --context, -c <text>    Project context (overrides auto-detection)
  --no-auto-context       Disable auto-detection of project context
  --key, -k <key>         License key for Pro/Team tier (more items/request)
  --version, -v           Show version
  --help, -h              Show this help

AUTO-DETECTION
  When run from a project directory, the CLI automatically reads context
  from files like AGENTS.md, CLAUDE.md, README.md, package.json, and
  prisma/schema.prisma to give the AI more relevant context. Pass
  --no-auto-context to disable, or --context to override with your own.

TIERS
  Free    Up to 5 items/request — no key needed
  Pro     Up to 25 items/request — $9/mo at refinebacklog.com/pricing
  Team    Up to 50 items/request — $29/mo at refinebacklog.com/pricing
`)
}

function callApi(items: string[], opts: {
  context?: string
  useUserStories?: boolean
  useGherkin?: boolean
  licenseKey?: string
}): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      items,
      ...(opts.context && { context: opts.context }),
      ...(opts.useUserStories && { useUserStories: true }),
      ...(opts.useGherkin && { useGherkin: true }),
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
      'User-Agent': `refine-backlog-cli/${VERSION}`,
    }

    if (opts.licenseKey) {
      headers['x-license-key'] = opts.licenseKey
    }

    const url = new URL(API_URL)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 429) {
          reject(new Error('Rate limit hit. Upgrade at refinebacklog.com/pricing or pass --key'))
          return
        }
        if (res.statusCode === 402) {
          reject(new Error('Too many items for free tier. Upgrade at refinebacklog.com/pricing'))
          return
        }
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`API error ${res.statusCode}: ${data}`))
          return
        }
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function formatMarkdown(items: RefinedItem[]): string {
  return items.map(item => {
    const lines: string[] = []
    lines.push(`## ${item.title}`)
    if (item.userStory) {
      lines.push(`\n> ${item.userStory}`)
    }
    lines.push(`\n**Problem:** ${item.problemStatement}`)
    lines.push(`\n**Estimate:** ${item.estimate} | **Priority:** ${item.priority}`)
    if (item.rationale) {
      lines.push(`**Rationale:** ${item.rationale}`)
    }
    if (item.acceptanceCriteria?.length) {
      lines.push(`\n**Acceptance Criteria:**`)
      item.acceptanceCriteria.forEach(ac => lines.push(`- ${ac}`))
    }
    if (item.tags?.length) {
      lines.push(`\n**Tags:** ${item.tags.join(', ')}`)
    }
    return lines.join('\n')
  }).join('\n\n---\n\n')
}

async function readStdin(): Promise<string[]> {
  if (process.stdin.isTTY) return []
  const rl = readline.createInterface({ input: process.stdin })
  const lines: string[] = []
  for await (const line of rl) {
    const trimmed = line.trim()
    if (trimmed) lines.push(trimmed)
  }
  return lines
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`refine-backlog-cli v${VERSION}`)
    process.exit(0)
  }

  const items: string[] = []
  let format = 'markdown'
  let context: string | undefined
  let licenseKey: string | undefined
  let useUserStories = false
  let useGherkin = false
  let filePath: string | undefined
  let noAutoContext = false
  let contextExplicitlyProvided = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--format') { format = args[++i] || 'markdown' }
    else if (arg === '--context' || arg === '-c') {
      context = args[++i]
      contextExplicitlyProvided = true
    }
    else if (arg === '--no-auto-context') { noAutoContext = true }
    else if (arg === '--key' || arg === '-k') { licenseKey = args[++i] }
    else if (arg === '--file' || arg === '-f') { filePath = args[++i] }
    else if (arg === '--user-stories') { useUserStories = true }
    else if (arg === '--gherkin') { useGherkin = true }
    else if (!arg.startsWith('-')) { items.push(arg) }
  }

  // Read from file
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`)
      process.exit(1)
    }
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)
    items.push(...lines)
  }

  // Read from stdin
  const stdinItems = await readStdin()
  items.push(...stdinItems)

  if (items.length === 0) {
    console.error('Error: No items provided. Pass items as arguments, use --file, or pipe via stdin.\n')
    showHelp()
    process.exit(1)
  }

  // Auto-detect project context if not explicitly provided
  if (!contextExplicitlyProvided && !noAutoContext) {
    const detected = detectProjectContext()
    if (detected) {
      context = detected
    }
  }

  try {
    const result = await callApi(items, { context, useUserStories, useGherkin, licenseKey })

    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(formatMarkdown(result.items || result as unknown as RefinedItem[]))
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`)
    process.exit(1)
  }
}

main()
