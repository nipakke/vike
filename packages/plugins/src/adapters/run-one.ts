import type { PageContext } from 'vike/types'
import type { VikePlugin } from '../core/index.js'

/**
 * Execute a single plugin hook and capture its return value.
 *
 * The plugin's `setup` already has `provide` extraction baked in
 * (see definePlugin), so whatever it returns is stored directly.
 */
export async function runOne(
  plugin: VikePlugin,
  pageContext: PageContext
): Promise<void> {
  const value = await plugin.setup(pageContext)

  if (value !== undefined) {
    const ctx = pageContext as PageContext & { $plugins?: Record<string, unknown> }
    ctx.$plugins ??= {}
    ctx.$plugins[plugin.name] = value
  }
}
