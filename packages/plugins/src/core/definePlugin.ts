import { buildSerializer } from './serializer/serializer.js'
import type { Plugin, PluginDefinition, PluginRunOptions, PluginStore } from './types.js'
import { createUseState } from './useState.js'



export const defineUniversalPlugin = <A>(
  key: string,
  def: PluginDefinition<A>
): Plugin<A> => {
  const serializer = buildSerializer(def.serializers ?? [])
  // let didRun = false;

  function setPluginResult(store: PluginStore, results: A) {
    //TODO: should not happen twice so if there is a key its either
    //collision or ran more then once
    store.results ??= {}
    store.results[key] = results
  }

  //hydrate on client
  async function hydrate(store: PluginStore, options: PluginRunOptions): Promise<A> {
    const { isServer } = options

    //TODO: Better error and make supressError option
    if (isServer) {
      throw new Error("Probably wrong usage, isServer should by false")
    }

    const rawPayload = store.payload?.[key]

    console.log("RAW PAYLOAD:", store)

    const payload = rawPayload ? serializer.deserialize<Record<string, unknown>>(rawPayload) : undefined

    //add the payload to the useState
    const { useState } = createUseState(key, payload, {})

    const result = await def.fn({ isServer, useState })

    setPluginResult(store, result)

    return result;
  }

  async function dehydrate(store: PluginStore, options: PluginRunOptions): Promise<A> {
    const { isServer } = options

    //TODO: Better error and make supressError option
    if (!isServer) {
      //its basically a check that this is run on the client or not
      throw new Error("Probably wrong usage, isServer should by true")
    }

    //dehydrate on server
    const state: Record<string, unknown> = {}
    const { useState } = createUseState(key, {}, state)

    const result = await def.fn({ isServer, useState })

    store.payload ??= {}
    store.payload[key] = serializer.serialize(state)


    setPluginResult(store, result)

    return result
  }

  return {
    key,
    def,
    createStore(): PluginStore {
      return { payload: {}, results: {} }
    },
    get: (store) => {
      console.log("GETTING FROM:", store)

      return store.results[key] as A
    },
    run: async (store, options) => {
      if (options.isServer) {
        return dehydrate(store, options)
      }
      return hydrate(store, options)
    }
  }
}
