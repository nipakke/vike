import type { PluginEntry } from '../core/types.js'
import type { PageContext } from 'vike/types'
import type { VikePlugin } from '../core/types.js'
import { runPlugins } from './run-plugins.js'

/**
 * Static onCreatePageContext hook. Dynamically imports the virtual module
 * and executes all discovered plugins via runPlugins(), populating
 * pageContext.$plugins.
 */
export async function onCreatePageContext(pageContext: PageContext): Promise<void> {
  const mod = await import('virtual:vike-plugins')

  const rawPlugins: Record<string, VikePlugin | null> = mod.rawPlugins ?? {}

  const entries: PluginEntry[] = []
  for (const [name, plugin] of Object.entries(rawPlugins)) {
    if (plugin) {
      entries.push({ name, plugin })
    }
  }

  if (entries.length > 0) {
    await runPlugins(entries, pageContext)
  }
}
