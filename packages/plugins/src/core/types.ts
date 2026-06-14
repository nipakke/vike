import type { PageContext } from 'vike/types'

export type Enforcement = 'pre' | 'default' | 'post'

/**
 * @deprecated Use `PageContext` from `vike/types` instead.
 * The setup function now receives the full Vike PageContext directly.
 */
export type PluginContext = PageContext

/**
 * What the user writes: setup can return `{ provide: T }` or nothing.
 * The `provide` extraction is handled internally by definePlugin.
 */
export type VikePluginHook<T = void> = (
  ctx: PageContext
) => { provide: T } | void | Promise<{ provide: T } | void>

/** Options for definePlugin()'s second positional argument. */
export type VikePluginOptions<T = void> = {
  name?: string
  enforce?: Enforcement
  order?: number
  parallel?: boolean
}

/**
 * The resolved plugin object. `setup` here is the WRAPPED version —
 * it already extracts `.provide` and returns `T` directly.
 */
export type VikePluginSetup<T = void> = (ctx: PageContext) => T | Promise<T>

export type VikePlugin<T = void> = {
  name: string
  enforce: Enforcement
  order: number
  parallel: boolean
  /** Already provide-extracted — returns T, not { provide: T } */
  setup: VikePluginSetup<T>
  /** Phantom type marker */
  provide?: T
}

/** A named plugin entry from the virtual module registry. */
export interface PluginEntry<T = void> {
  name: string
  plugin: VikePlugin<T>
}

/** Extract the provide type T from a VikePlugin<T> */
export type PluginProvide<T> = T extends VikePlugin<infer R> ? R : never
