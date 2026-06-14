import type { PageContext } from 'vike/types'
import type {
  VikePlugin,
  VikePluginHook,
  VikePluginOptions,
  VikePluginSetup,
} from './types.js'

/**
 * Define a Vike plugin.
 *
 * @param setup - The plugin setup function. Receives the full Vike PageContext
 *                and can return `{ provide: T }` or `void`. `definePlugin`
 *                wraps it so the `provide` value is automatically extracted.
 *                The returned `VikePlugin.setup` returns `T` directly.
 * @param opts   - Optional plugin metadata (name, enforce, order, parallel).
 *
 * @example
 *   definePlugin(
 *     (ctx) => ({ provide: { user: 'alice' } }),
 *     { name: 'auth', enforce: 'pre' }
 *   )
 */
export function definePlugin<T = void>(
  setup: VikePluginHook<T>,
  opts?: VikePluginOptions<T>
): VikePlugin<T> {
  const rawSetup = setup

  const wrappedSetup: VikePluginSetup<T> = async (
    ctx: PageContext
  ): Promise<T> => {
    const result = await rawSetup(ctx)
    if (result && typeof result === 'object' && 'provide' in result) {
      return result.provide
    }
    // No provide — return undefined (valid for T = void)
    return undefined as T
  }

  return {
    name: opts?.name ?? 'unnamed',
    enforce: opts?.enforce ?? 'default',
    order: opts?.order ?? 0,
    parallel: opts?.parallel ?? false,
    setup: wrappedSetup,
  }
}
