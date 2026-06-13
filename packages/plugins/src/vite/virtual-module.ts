import { resolve } from 'node:path'
import type { PluginFileInfo } from './types'

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
const ${varName} = (await import('${absPath}')).default
if (!${varName}.name || ${varName}.name === 'unnamed') ${varName}.name = '${file.baseName}'
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
export const rawPlugins = [${varNames.join(', ')}]
`
}
