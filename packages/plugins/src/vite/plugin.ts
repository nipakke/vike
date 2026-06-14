import type { Plugin, ViteDevServer } from 'vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { VikePluginsOptions } from './types'
import { scanDirectory } from './scanner'
import { generateVirtualModule } from './virtual-module'
import { writeTypeFile } from './dts'

export type { VikePluginsOptions } from './types'

const VIRTUAL_ID = 'virtual:vike-plugins'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

/**
 * Vite plugin that auto-discovers VikePlugin files.
 *
 * Generates:
 * 1. `virtual:vike-plugins` — a module exporting a `rawPlugins` record
 *    keyed by plugin name, filtered per build target via Vite's load() hook.
 * 2. `{dtsDir}/vike-plugins.d.ts` — type declarations written to disk
 *    so TypeScript picks them up automatically (default: `.vike/`).
 */
export function vikePlugins(opts?: VikePluginsOptions): Plugin {
  const dir = opts?.dir ?? 'plugins/'
  const dtsDir = opts?.dtsDir ?? '.vike'
  const disableWarning = opts?.disableExperimentalWarning ?? false
  let projectRoot = ''
  let warned = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const pluginsDir = () => resolve(projectRoot, dir)

  function regenerateTypes(): void {
    if (!projectRoot) return
    const pd = pluginsDir()
    const files = scanDirectory(pd)
    writeTypeFile(projectRoot, files, pd, dtsDir)
  }

  return {
    name: 'vike-plugins',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = config.root
      regenerateTypes()
    },

    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
      return null
    },

    load(id: string) {
      if (id !== RESOLVED_VIRTUAL_ID) return null
      try {
        const pd = pluginsDir()
        const files = scanDirectory(pd)
        return generateVirtualModule(files, pd)
      } catch (err) {
        console.error('[vike-plugins] Failed to generate virtual module:', err)
        return 'export const rawPlugins = {}'
      }
    },

    configureServer(server: ViteDevServer) {
      projectRoot = server.config.root
      const pd = pluginsDir()
      const parentDir = resolve(pd, '..')

      server.watcher.add(parentDir)

      let pdExists = existsSync(pd)

      const onPluginChange = (): void => {
        try {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
          }
          regenerateTypes()
          server.ws.send({ type: 'full-reload' })
        } catch (err) {
          console.error('[vike-plugins] Error during plugin regeneration:', err)
        }
      }

      const debouncedOnPluginChange = (): void => {
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          onPluginChange()
        }, 300)
      }

      const handleParentChange = (eventPath: string): void => {
        if (resolve(eventPath) !== pd) return
        pdExists = existsSync(pd)
        if (pdExists) {
          server.watcher.add(pd)
        }
        debouncedOnPluginChange()
      }

      server.watcher.on('addDir', handleParentChange)
      server.watcher.on('unlinkDir', handleParentChange)

      const isPluginFile = (path: string): boolean =>
        pdExists && path.startsWith(pd) && /\.(ts|js|mts|mjs)$/.test(path)

      const handleChange = (path: string): void => {
        if (!isPluginFile(path)) return
        debouncedOnPluginChange()
      }

      server.watcher.on('add', handleChange)
      server.watcher.on('unlink', handleChange)
      server.watcher.on('change', handleChange)

      if (pdExists) {
        server.watcher.add(pd)
      }
    },

    buildStart() {
      if (!disableWarning && !warned) {
        warned = true
        const message = [
          '',
          '\x1b[33m⚠ Experimental package: @nipakke/vike-plugins\x1b[0m',
          '  This package is experimental and its API may change.',
          '  Set `disableExperimentalWarning: true` in vikePlugins() options to suppress this warning.',
          '',
        ].join('\n')
        this.warn(message)
      }
      regenerateTypes()
    },
  }
}
