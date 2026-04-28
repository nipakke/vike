import type { PluginStore } from "../src/core/types.js"

export const createStore = (payload = {}): PluginStore => ({
  payload,
  results: {}
})

export const ssrRoundTrip = async (plugin: any) => {
  const serverStore = createStore()
  await plugin.run(serverStore, { isServer: true })

  const clientStore = createStore(serverStore.payload)
  await plugin.run(clientStore, { isServer: false })

  return { serverStore, clientStore }
}
