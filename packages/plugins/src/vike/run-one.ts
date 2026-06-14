import type { PageContext } from 'vike/types'
import type { PluginEntry } from '../core/index.js'

/**
 * Execute a single plugin hook and store its return value in $plugins.
 *
 * The plugin's `setup` already has `provide` extraction baked in
 * (see definePlugin), so whatever it returns is stored directly
 * under `$plugins[entry.name]`.
 */
export async function runOne(
  entry: PluginEntry,
  pageContext: PageContext
): Promise<void> {
  const value = await entry.plugin.setup(pageContext)

  if (value !== undefined) {
    const ctx = pageContext as PageContext & { $plugins?: Record<string, unknown> }
    ctx.$plugins ??= {}
    ctx.$plugins[entry.name] = value
  }
}
