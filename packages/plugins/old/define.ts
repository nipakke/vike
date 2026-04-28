import type { PageContext } from "vike/types";

type Promisable<T> = T | PromiseLike<T>


export type ProvideResult = Record<string, unknown> | void

export type VikePlugin<T extends ProvideResult = void> = {
  setup: (ctx: PageContext) => Promisable<T>
}

export interface Plugin<Injections extends Record<string, unknown> = Record<string, unknown>> {
  (ctx: PageContext): Promise<void> | Promise<{ provide?: Injections }> | void | { provide?: Injections }
  /* [NuxtPluginIndicator]?: true
  meta?: ResolvedPluginMeta */
}

export function defineVikePlugin<T extends Record<string, unknown>>(
  plugin: Plugin<T>
): Plugin<T> {
  if (typeof plugin === 'function') { return plugin }

  //TODO: Object plugin
  //https://github.com/nuxt/nuxt/blob/56690dc25b951996577822ea7afeaccd05eded6c/packages/nuxt/src/app/nuxt.ts#L515
  return plugin
}