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
 * 1. `virtual:vike-plugins` — the plugin registry, filtered per build
 *    target via Vite's load() hook `ssr` option.
 * 2. `{dtsDir}/vike-plugins.d.ts` — type declarations written to disk
 *    so TypeScript picks them up automatically (default: `.vike/`).
 */
export function vikePlugins(opts?: VikePluginsOptions): Plugin {
  const dir = opts?.dir ?? 'plugins/'
  const dtsDir = opts?.dtsDir ?? '.vike'
  const disableWarning = opts?.disableExperimentalWarning ?? false
  let resolvedPluginsDir = ''
  let projectRoot = ''
  let warned = false

  function getPluginsDir(): string {
    if (!resolvedPluginsDir) {
      resolvedPluginsDir = resolve(projectRoot || process.cwd(), dir)
    }
    return resolvedPluginsDir
  }

  function regenerateTypes(): void {
    if (!projectRoot) return
    const pd = getPluginsDir()
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

    load(id: string, options?: { ssr?: boolean }) {
      if (id === RESOLVED_VIRTUAL_ID) {
        const pd = getPluginsDir()
        const files = scanDirectory(pd)
        return generateVirtualModule(files, pd, options?.ssr ?? false)
      }
      return null
    },

    configureServer(server: ViteDevServer) {
      projectRoot = server.config.root
      const pd = getPluginsDir()

      if (!existsSync(pd)) return

      server.watcher.add(pd)

      const isPluginFile = (path: string): boolean =>
        path.startsWith(pd) && /\.(ts|js|mts|mjs)$/.test(path)

      const handleChange = (path: string): void => {
        if (!isPluginFile(path)) return

        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
        }
        server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
        regenerateTypes()

        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('add', handleChange)
      server.watcher.on('unlink', handleChange)
      server.watcher.on('change', handleChange)
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
