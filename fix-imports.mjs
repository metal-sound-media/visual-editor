import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, relative, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const srcDir = resolve(__dirname, 'src')

// ── 1. Create styles.js from styles.css ──────────────────────────────────────
const cssContent = readFileSync(join(srcDir, 'styles.css'), 'utf8')
const escaped = cssContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
writeFileSync(join(srcDir, 'styles.js'), `export const cssText = \`${escaped}\`\n`)
console.log('Created src/styles.js')

// ── 2. Walk src/ and collect all .js files ───────────────────────────────────
function walk(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walk(full))
    } else if (entry.endsWith('.js') && entry !== 'styles.js') {
      results.push(full)
    }
  }
  return results
}

// ── 3. Fix imports in each file ───────────────────────────────────────────────
for (const file of walk(srcDir)) {
  const fileDir = dirname(file)
  let content = readFileSync(file, 'utf8')
  let changed = false

  // a) Remove type-only imports (import type { ... } from '...')
  const noTypeImports = content.replace(/^import type \{[^}]*\}[^\n]*\n/gm, '')
  if (noTypeImports !== content) { content = noTypeImports; changed = true }

  // b) Fix the Vite-specific CSS inline import
  const cssImport = "import cssText from 'src/styles.css?inline'"
  if (content.includes(cssImport)) {
    content = content.replace(cssImport, "import { cssText } from './styles.js'")
    changed = true
  }

  // c) Replace 'src/X' imports/exports → relative paths with .js
  const fixedSrc = content.replace(/from '(src\/[^']+)'/g, (_, importPath) => {
    const stripped = importPath.slice(4) // remove 'src/'
    const absTarget = join(srcDir, stripped)
    let rel = relative(fileDir, absTarget)
    if (!rel.startsWith('.')) rel = './' + rel
    if (!rel.endsWith('.js')) rel += '.js'
    return `from '${rel}'`
  })
  if (fixedSrc !== content) { content = fixedSrc; changed = true }

  // d) Add .js extension to relative imports/exports that are missing it
  const fixedRel = content.replace(/from '(\.\.?\/[^']+)'/g, (match, importPath) => {
    if (importPath.endsWith('.js') || importPath.endsWith('.css')) return match
    return `from '${importPath}.js'`
  })
  if (fixedRel !== content) { content = fixedRel; changed = true }

  if (changed) {
    writeFileSync(file, content)
    console.log('Fixed:', file.replace(__dirname + '/', ''))
  }
}

console.log('Done.')
