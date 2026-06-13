import type { PageContext } from 'vike/types'
import type { VikePlugin, VikePluginOptions, VikePluginSetup } from './types.js'

/**
 * Define a Vike plugin.
 *
 * The `setup` function can return `{ provide: T }` — `definePlugin`
 * wraps it so the `provide` value is automatically extracted.
 * The returned `VikePlugin.setup` returns `T` directly.
 */
export function definePlugin<T = void>(
  options: VikePluginOptions<T>
): VikePlugin<T> {
  const rawSetup = options.setup

  const setup: VikePluginSetup<T> = async (ctx: PageContext): Promise<T> => {
    const result = await rawSetup(ctx)
    if (result && typeof result === 'object' && 'provide' in result) {
      return result.provide
    }
    // No provide — return undefined (valid for T = void)
    return undefined as T
  }

  return {
    name: options.name ?? 'unnamed',
    enforce: options.enforce ?? 'default',
    order: options.order ?? 0,
    parallel: options.parallel ?? false,
    setup,
  }
}
