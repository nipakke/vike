export type UseState = <T>(key: string, factory: () => T) => T

type ID = `${string}:${string}`

export const createUseState = (
  pluginKey: string,
  payload: Record<string, unknown> | undefined,
  state: Record<string, unknown>
) => {
  console.log("PAYLOAD IN USESTATE FACT:", payload)
  payload ||= {}
  const makeId = (key: string): ID => `${pluginKey}:${key}`

  // Track registered factories per key
  const registeredFactories = new Map<string, () => unknown>()

  //used for testing
  const setPayloadKey = (key: string, data: unknown) => {
    payload[makeId(key)] = data;
  }

  const setStateKey = (key: string, data: unknown) => {
    state[makeId(key)] = data;
  }


  const useState: UseState = <T>(key: string, factory: () => T): T => {
    const id = `${pluginKey}:${key}`

    // Detect same key, different factory
    if (registeredFactories.has(id)) {
      const existingFactory = registeredFactories.get(id)!
      if (existingFactory !== factory) {
        throw new Error(
          `useState key conflict: "${key}" (plugin: "${pluginKey}") was registered with a different factory function. ` +
          `Ensure the same stable function reference is used, or that each key is unique.`
        )
      }
    } else {
      registeredFactories.set(id, factory)
    }

    if (payload[id] !== undefined) {
      return payload[id] as T
    }

    const value = factory()
    state[id] = value
    return value
  }


  return { useState, setPayloadKey, makeId, payload, state, setStateKey }
}