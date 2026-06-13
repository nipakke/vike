export { definePlugin } from '../core/definePlugin.js'
export type { VikePlugin, VikePluginOptions, PluginContext, Enforcement } from '../core/types.js'

import type { PluginContext, VikePlugin } from '../core/types.js'
import type { PageContext } from 'vike/types'

/**
 * Sort plugins by enforce group, then order, then name (alphabetical).
 * enforce group priority: pre (0) → default (1) → post (2)
 */
function sortPlugins(plugins: VikePlugin[]): VikePlugin[] {
  const order: Record<string, number> = { pre: 0, default: 1, post: 2 }
  return [...plugins].sort((a, b) => {
    if (a.enforce !== b.enforce) return order[a.enforce] - order[b.enforce]
    if (a.order !== b.order) return a.order - b.order
    return a.name.localeCompare(b.name)
  })
}

/**
 * Execute a single plugin hook.
 * Respects the `await` flag: when `await: false`, the result promise
 * is fire-and-forget (not awaited).
 */
async function runOne(plugin: VikePlugin, isServer: boolean): Promise<void> {
  const ctx: PluginContext = { isServer }
  const result = plugin.setup(ctx)
  if (plugin.await !== false) {
    await result
  }
  // if await: false, fire and forget — don't await
}

/**
 * Execute all plugins in sorted order per-request.
 *
 * Plugins are sorted by enforce group (pre → default → post),
 * then by order (ascending), then by name (alphabetical).
 *
 * Within a sequential position, plugins with `parallel: true` are
 * batched and executed via Promise.all — all must finish before
 * the next sequential plugin runs.
 *
 * @param plugins - Array of VikePlugin definitions to execute
 * @param pageContext - Vike page context for the current request
 */
export async function runPlugins(
  plugins: VikePlugin[],
  pageContext: PageContext
): Promise<void> {
  const isServer = !pageContext.isClientSide
  const sorted = sortPlugins(plugins)

  let i = 0
  while (i < sorted.length) {
    const plugin = sorted[i]

    if (plugin.parallel) {
      // Collect all consecutive parallel plugins at this position
      const batch: VikePlugin[] = []
      while (i < sorted.length && sorted[i].parallel) {
        batch.push(sorted[i])
        i++
      }
      const promises = batch.map((p) => runOne(p, isServer))
      await Promise.all(promises)
    } else {
      await runOne(plugin, isServer)
      i++
    }
  }
}
