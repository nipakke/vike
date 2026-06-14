import type { PluginEntry } from '../core/types.js'

/**
 * Sort plugin entries by enforce group, then order, then name (alphabetical).
 * enforce group priority: pre (0) → default (1) → post (2)
 */
export function sortPlugins(entries: PluginEntry[]): PluginEntry[] {
  const order: Record<string, number> = { pre: 0, default: 1, post: 2 }
  return [...entries].sort((a, b) => {
    const pa = a.plugin
    const pb = b.plugin
    if (pa.enforce !== pb.enforce) return order[pa.enforce] - order[pb.enforce]
    if (pa.order !== pb.order) return pa.order - pb.order
    return a.name.localeCompare(b.name)
  })
}
