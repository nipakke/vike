import { resolve } from 'node:path'
import type { PluginFileInfo } from './types'

/**
 * Build a map from suggestedName → list of filenames that produce it.
 * Returns only entries with collisions (length > 1), or null if no duplicates.
 *
 * Pure function — no side effects, no mutation of input.
 */
function detectDuplicateNames(
  active: PluginFileInfo[],
): Map<string, string[]> | null {
  const nameMap = new Map<string, string[]>()

  for (const file of active) {
    const name = file.suggestedName
    const list = nameMap.get(name)
    if (list) {
      list.push(file.filename)
    } else {
      nameMap.set(name, [file.filename])
    }
  }

  const duplicates = new Map<string, string[]>()
  for (const [name, files] of nameMap) {
    if (files.length > 1) {
      duplicates.set(name, files)
    }
  }

  return duplicates.size > 0 ? duplicates : null
}

/**
 * Format a human-readable error message from a duplicate-name map.
 *
 * Pure function — output depends only on input.
 */
function formatDuplicateError(duplicates: Map<string, string[]>): string {
  const lines: string[] = ['Duplicate plugin names detected after normalization:']

  for (const [name, files] of duplicates) {
    lines.push(`  - "${name}" from files: [${files.join(', ')}]`)
  }

  lines.push(
    'All plugin file names are normalized (lowercase, special chars replaced) for comparison.',
  )

  return lines.join('\n')
}

/**
 * Generate the virtual module source.
 *
 * Vite's `load` hook receives `{ ssr: boolean }` — we use this to
 * generate a DIFFERENT module for server vs client builds:
 *
 *   - SSR build:   only server + universal plugins
 *   - Client build: only client + universal plugins
 *
 * The opposite-environment plugins are never imported — they're
 * completely absent from the module source, so they can't end up in
 * the wrong bundle. No tree-shaking reliance.
 */
export function generateVirtualModule(
  pluginFiles: PluginFileInfo[],
  pluginsDir: string,
  isSSR: boolean,
): string {
  const active = pluginFiles.filter((f) => {
    if (f.mode === 'universal') return true
    if (f.mode === 'server') return isSSR
    if (f.mode === 'client') return !isSSR
    return false
  })

  // Detect duplicate plugin names before codegen — throw at build-time
  const duplicates = detectDuplicateNames(active)
  if (duplicates) {
    throw new Error(formatDuplicateError(duplicates))
  }

  const envLabel = isSSR ? 'SSR' : 'client'
  const includeServer = isSSR ? 'INCLUDED' : 'EXCLUDED'
  const includeClient = !isSSR ? 'INCLUDED' : 'EXCLUDED'

  if (active.length === 0) {
    return `\
// ============================================================
// virtual:vike-plugins — ${envLabel} build
// ============================================================
//
// Only plugins for the ${envLabel} environment are listed below.
// Opposite-environment plugins are completely absent.
//   *.server.ts  → ${includeServer}
//   *.client.ts  → ${includeClient}
//   *.ts         → always included
//
// ============================================================

export const rawPlugins = []
`
  }

  const varNames: string[] = []
  const importBlocks: string[] = []

  for (let i = 0; i < active.length; i++) {
    const file = active[i]
    const absPath = resolve(pluginsDir, file.filename)
    const varName = `plugin_${i}`

    varNames.push(varName)
    importBlocks.push(`\
// ${file.filename} (${file.mode})
let ${varName}
try {
  const mod_${i} = await import('${absPath}')
  ${varName} = mod_${i}.default
  if (!${varName} || typeof ${varName} !== 'object' || typeof ${varName}.setup !== 'function') {
    console.warn(\`[vike-plugins] File "${file.filename}" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
    ${varName} = null
  } else {
    if (!${varName}.name || ${varName}.name === 'unnamed') ${varName}.name = '${file.suggestedName}'
  }
} catch (err) {
  console.warn(\`[vike-plugins] Failed to load plugin "${file.filename}":\`, err instanceof Error ? err.message : err)
  ${varName} = null
}
`)
  }

  return `\
// ============================================================
// virtual:vike-plugins — ${envLabel} build
// ============================================================
//
// Only plugins for the ${envLabel} environment are listed below.
// Opposite-environment plugins are completely absent.
//   *.server.ts  → ${includeServer}
//   *.client.ts  → ${includeClient}
//   *.ts         → always included
//
// ============================================================

${importBlocks.join('\n')}
export const rawPlugins = [${varNames.join(', ')}].filter(Boolean)
`
}
