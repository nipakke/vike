import type { PluginEntry } from '../core/index.js'
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
 */
export async function runPlugins(
  entries: PluginEntry[],
  pageContext: PageContext
): Promise<void> {
  const sorted = sortPlugins(entries)

  let i = 0
  while (i < sorted.length) {
    const entry = sorted[i]

    if (entry.plugin.parallel) {
      // Collect all consecutive parallel plugins at this position
      const batch: PluginEntry[] = []
      while (i < sorted.length && sorted[i].plugin.parallel) {
        batch.push(sorted[i])
        i++
      }
      const promises = batch.map((e) => runOne(e, pageContext))
      await Promise.all(promises)
    } else {
      await runOne(entry, pageContext)
      i++
    }
  }
}
