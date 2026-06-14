import type { VikePlugin } from '../core/index.js'
import type { PageContext } from 'vike/types'
import { sortPlugins } from './sort-plugins.js'
import { runOne } from './run-one.js'

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
      const promises = batch.map((p) => runOne(p, pageContext))
      await Promise.all(promises)
    } else {
      await runOne(plugin, pageContext)
      i++
    }
  }
}
