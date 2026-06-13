import type { VikePlugin } from '../core/types.js'

/**
 * Sort plugins by enforce group, then order, then name (alphabetical).
 * enforce group priority: pre (0) → default (1) → post (2)
 */
export function sortPlugins(plugins: VikePlugin[]): VikePlugin[] {
  const order: Record<string, number> = { pre: 0, default: 1, post: 2 }
  return [...plugins].sort((a, b) => {
    if (a.enforce !== b.enforce) return order[a.enforce] - order[b.enforce]
    if (a.order !== b.order) return a.order - b.order
    return a.name.localeCompare(b.name)
  })
}
