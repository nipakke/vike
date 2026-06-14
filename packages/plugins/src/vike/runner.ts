import type { PageContext } from 'vike/types'
import { runPlugins } from "./run-plugins.js"

/**
 * Static onCreatePageContext hook. Dynamically imports the virtual module
 * and executes all discovered plugins via runPlugins(), populating
 * pageContext.$plugins.
 */
export async function onCreatePageContext(pageContext: PageContext): Promise<void> {
  const mod = await import('virtual:vike-plugins')

  const plugins = mod.rawPlugins ?? []
  if (plugins.length > 0) {
    await runPlugins(plugins, pageContext)
  }
}
