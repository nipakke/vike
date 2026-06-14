import { readdirSync, existsSync } from 'node:fs'
import { extname, basename } from 'node:path'
import type { PluginFileMode, PluginFileInfo } from './types'
import { normalizePluginName } from '../core/plugin-name.js'

/**
 * Scan a directory for TypeScript/JavaScript plugin files.
 * Detects .server.ts / .client.ts suffixes to determine loading mode.
 * Files without a mode suffix are treated as universal.
 *
 * Each entry gets a `suggestedName` — a normalized version of the
 * file's baseName — used as fallback when a plugin lacks an explicit name.
 */
export function scanDirectory(dir: string): PluginFileInfo[] {
  if (!existsSync(dir)) return []

  try {
    const files = readdirSync(dir)
    const pluginFiles: PluginFileInfo[] = []

    for (const file of files) {
      if (file.startsWith('.') || file.startsWith('__')) continue
      if (!/\.(ts|js|mts|mjs)$/.test(file)) continue

      const ext = extname(file)
      const base = basename(file, ext)

      let mode: PluginFileMode = 'universal'
      let baseName = base

      if (base.endsWith('.server')) {
        mode = 'server'
        baseName = base.slice(0, -7)
      } else if (base.endsWith('.client')) {
        mode = 'client'
        baseName = base.slice(0, -7)
      }

      const suggestedName = normalizePluginName(baseName)
        .replace(/^_+|_+$/g, '') || 'unnamed'

      pluginFiles.push({ filename: file, mode, baseName, suggestedName })
    }

    return pluginFiles.sort((a, b) => a.filename.localeCompare(b.filename))
  } catch {
    return []
  }
}
