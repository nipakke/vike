import type { PluginContext } from "./context"
import type { CodecRegistry } from "./serializer"


export type Plugin<A> = {
  // the adapter calls this to get the result out of the store
  get: (store: PluginStore) => A
  createStore: () => PluginStore;
  // the adapter calls this to run the plugin
  run: (store: PluginStore, options: PluginRunOptions) => Promise<A>
  key: string
  def: PluginDefinition<A>
}


export type PluginRunOptions = {
  isServer: boolean
}

export type PluginStore = {
  // raw serialized payload from server, keyed by plugin key
  payload: Record<string, string>
  // plugin results, keyed by plugin key
  results: Record<string, unknown>
}

export type PluginFn<A> = (ctx: PluginContext) => A | Promise<A>

export type PluginDefinition<A> = {
  serializers?: CodecRegistry[]
  fn: (ctx: PluginContext) => A | Promise<A>
}
