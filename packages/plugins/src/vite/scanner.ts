import { readdirSync, existsSync } from 'node:fs'
import { extname, basename } from 'node:path'
import type { PluginFileMode, PluginFileInfo } from './types'

/**
 * Scan a directory for TypeScript/JavaScript plugin files.
 * Detects .server.ts / .client.ts suffixes to determine loading mode.
 * Files without a mode suffix are treated as universal.
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

      pluginFiles.push({ filename: file, mode, baseName })
    }

    return pluginFiles.sort((a, b) => a.filename.localeCompare(b.filename))
  } catch {
    return []
  }
}
