import type { VikePlugin, VikePluginOptions } from './types.js'

export const definePlugin = (options: VikePluginOptions): VikePlugin => {
  return {
    name: options.name ?? 'unnamed',
    enforce: options.enforce ?? 'default',
    order: options.order ?? 0,
    parallel: options.parallel ?? false,
    await: options.await ?? true,
    setup: options.setup,
  }
}
