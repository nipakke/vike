# SSR Plugin System — Implementation Plan v3

## Architecture

Three layers:

```
core        — pure logic, no framework, no vike, fully testable
adapters    — vike, nuxt, etc. just wire core into their context
serializers — shipped separately, user picks what they need
```

The core has zero knowledge of vike. It just operates on a plain `PluginStore` object — whoever calls it is responsible for providing and persisting that store.

---

## Core

### `PluginStore`

Just a plain object. The adapter owns it and decides where it lives (vike's pageContext, nuxt's useState, whatever).

```typescript
// src/core/types.ts

export type PluginStore = {
  // raw serialized payload from server, keyed by plugin key
  payload: Record<string, Record<string, unknown>>
  // plugin results, keyed by plugin key
  results: Record<string, unknown>
}

export type PluginRunOptions = {
  key: string
  store: PluginStore
  isServer: boolean
  serializers: Serializer[]
}
```

### `useState`

```typescript
// src/core/useState.ts

export type UseState = <T>(factory: () => T) => T

export const createUseState = (
  pluginKey: string,
  payload: Record<string, unknown> | undefined,
  state: Record<string, unknown>
): UseState => {
  let counter = 0

  return <T>(factory: () => T): T => {
    const id = `${pluginKey}:${counter++}`

    if (payload?.[id] !== undefined) {
      return payload[id] as T
    }

    const value = factory()
    state[id] = value
    return value
  }
}
```

### `PluginContext`

What `fn` receives. No framework types anywhere.

```typescript
// src/core/context.ts

export type PluginContext = {
  isServer: boolean
  useState: UseState
}
```

### `runPlugin`

The core runner. Takes a store, runs the plugin, writes results back.

```typescript
// src/core/runPlugin.ts
import { createUseState } from './useState'
import { serializeState, deserializePayload } from '../serializers/apply'
import type { PluginStore, PluginRunOptions } from './types'
import type { PluginContext } from './context'

export type PluginDef<A> = {
  serializers?: Serializer[]
  fn: (ctx: PluginContext) => A | Promise<A>
}

export const runPlugin = async <A>(
  def: PluginDef<A>,
  options: PluginRunOptions
): Promise<A> => {
  const { key, store, isServer, serializers } = options

  const rawPayload = store.payload?.[key]
  const payload = rawPayload
    ? deserializePayload(rawPayload, serializers)
    : undefined

  const state: Record<string, unknown> = {}
  const useState = createUseState(key, payload, state)

  const ctx: PluginContext = { isServer, useState }
  const result = await def.fn(ctx)

  if (isServer) {
    store.payload ??= {}
    store.payload[key] = serializeState(state, serializers)
  }

  store.results ??= {}
  store.results[key] = result

  return result
}
```

### `definePlugin`

Returns a plain function with a `run` method attached. No `usePageContext`, no framework calls — that's the adapter's job.

```typescript
// src/core/definePlugin.ts
import { runPlugin } from './runPlugin'
import type { PluginDef } from './runPlugin'
import type { PluginStore, PluginRunOptions } from './types'
import type { Serializer } from '../serializers/types'

export type Plugin<A> = {
  // the adapter calls this to get the result out of the store
  get: (store: PluginStore) => A
  // the adapter calls this to run the plugin
  run: (store: PluginStore, options: Omit<PluginRunOptions, 'key' | 'store' | 'serializers'>) => Promise<A>
  key: string
  def: PluginDef<A>
}

export const definePlugin = <A>(
  key: string,
  def: PluginDef<A>
): Plugin<A> => {
  return {
    key,
    def,
    get: (store) => store.results[key] as A,
    run: (store, options) =>
      runPlugin(def, {
        ...options,
        key,
        store,
        serializers: def.serializers ?? []
      })
  }
}
```

No `usePageContext`. No `hook`. Just `run` and `get` — the adapter decides when and how to call them.

---

## Vike Adapter

The adapter's only job is to:
1. pull the store out of vike's pageContext
2. call `plugin.run(store, { isServer })`
3. expose a `use()` function that calls `plugin.get(store)`

```typescript
// src/adapters/vike.ts
import { usePageContext } from 'vike-vue/usePageContext'  // or vike-react etc
import type { Plugin } from '../core/definePlugin'

export const createVikePlugin = <A>(plugin: Plugin<A>) => {
  // this is the default export — registered in vike.config onCreatePageContext
  const hook = async (pageCtx: any) => {
    const store = getOrCreateStore(pageCtx)
    await plugin.run(store, { isServer: pageCtx.isServer })
  }

  // this is what the user calls in components
  const use = (): A => {
    const pageCtx = usePageContext()
    const store = getOrCreateStore(pageCtx)
    return plugin.get(store)
  }

  return Object.assign(use, { hook })
}

const getOrCreateStore = (pageCtx: any) => {
  pageCtx._pluginStore ??= { payload: {}, results: {} }
  return pageCtx._pluginStore
}
```

### Usage

```typescript
// plugins/useAuth.ts
import { definePlugin } from 'your-package/core'
import { createVikePlugin } from 'your-package/vike'
import { vueSerializer } from 'your-package/vue'

const authPlugin = definePlugin('auth', {
  serializers: [vueSerializer],
  fn: async (ctx) => {
    const client = createAuthClient()
    const user = ctx.useState<User | null>(() => ref(null))

    if (!user.value) user.value = await client.getSession()

    return { client, user }
  }
})

// use() for components, hook for vike registration
export const useAuth = createVikePlugin(authPlugin)
```

```typescript
// vike.config.ts
export default {
  onCreatePageContext: [
    'import:../plugins/useAuth.ts:default',
    'import:../plugins/useCart.ts:default',
  ]
}
```

```typescript
// vike reads the default export's .hook and calls it
// so the default export shape vike expects is:
export default useAuth.hook
```

---

## Serializers

```typescript
// src/serializers/types.ts

export type Serializer<T = any, S = any> = {
  name: string  // stable name for type tagging
  is: (value: unknown) => value is T
  serialize: (value: T) => S
  deserialize: (value: S) => T
}
```

Type tagging so deserialize knows which serializer to use:

```typescript
// src/serializers/apply.ts
import type { Serializer } from './types'

type Tagged = { __s: string; v: unknown }

const isTagged = (v: unknown): v is Tagged =>
  typeof v === 'object' && v !== null && '__s' in v && 'v' in v

export const serializeValue = (serializers: Serializer[], value: unknown): unknown => {
  for (const s of serializers) {
    if (s.is(value)) return { __s: s.name, v: s.serialize(value) } satisfies Tagged
  }
  return value
}

export const deserializeValue = (serializers: Serializer[], raw: unknown): unknown => {
  if (isTagged(raw)) {
    const s = serializers.find(s => s.name === raw.__s)
    if (s) return s.deserialize(raw.v)
  }
  return raw
}

export const serializeState = (
  state: Record<string, unknown>,
  serializers: Serializer[]
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(state).map(([id, v]) => [id, serializeValue(serializers, v)])
  )

export const deserializePayload = (
  raw: Record<string, unknown>,
  serializers: Serializer[]
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(raw).map(([id, v]) => [id, deserializeValue(serializers, v)])
  )
```

```typescript
// src/serializers/vue.ts
import { isRef, ref } from 'vue'
import type { Serializer } from './types'

export const vueSerializer: Serializer = {
  name: 'Ref',
  is: isRef,
  serialize: (r) => r.value,
  deserialize: (v) => ref(v)
}
```

---

## Testing

Tests only ever touch the core. Zero vike imports.

### Helper

```typescript
// tests/helpers.ts
import type { PluginStore } from '../src/core/types'

export const createStore = (payload = {}): PluginStore => ({
  payload,
  results: {}
})

export const ssrRoundTrip = async (plugin: Plugin<any>) => {
  const serverStore = createStore()
  await plugin.run(serverStore, { isServer: true })

  const clientStore = createStore(serverStore.payload)
  await plugin.run(clientStore, { isServer: false })

  return { serverStore, clientStore }
}
```

### `useState` tests

```typescript
// tests/core/useState.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createUseState } from '../../src/core/useState'

describe('useState', () => {
  it('runs factory when no payload', () => {
    const state = {}
    const useState = createUseState('test', undefined, state)
    expect(useState(() => 42)).toBe(42)
  })

  it('skips factory when payload exists', () => {
    const factory = vi.fn(() => 42)
    const state = {}
    const useState = createUseState('test', { 'test:0': 99 }, state)
    expect(useState(factory)).toBe(99)
    expect(factory).not.toHaveBeenCalled()
  })

  it('increments id per call', () => {
    const state = {}
    const useState = createUseState('test', undefined, state)
    useState(() => 'a')
    useState(() => 'b')
    expect(Object.keys(state)).toEqual(['test:0', 'test:1'])
  })

  it('registers values for serialization', () => {
    const state = {}
    const useState = createUseState('test', undefined, state)
    useState(() => 'hello')
    expect(state['test:0']).toBe('hello')
  })
})
```

### Serializer tests

```typescript
// tests/serializers/vue.test.ts
import { describe, it, expect } from 'vitest'
import { ref, isRef } from 'vue'
import { vueSerializer } from '../../src/serializers/vue'

describe('vueSerializer', () => {
  it('detects refs', () => {
    expect(vueSerializer.is(ref(null))).toBe(true)
    expect(vueSerializer.is(42)).toBe(false)
  })

  it('serializes ref to raw value', () => {
    expect(vueSerializer.serialize(ref({ name: 'john' }))).toEqual({ name: 'john' })
  })

  it('deserializes to ref', () => {
    const result = vueSerializer.deserialize({ name: 'john' })
    expect(isRef(result)).toBe(true)
    expect(result.value).toEqual({ name: 'john' })
  })

  it('round trips', () => {
    const r = ref({ name: 'john' })
    expect(vueSerializer.deserialize(vueSerializer.serialize(r)).value).toEqual(r.value)
  })
})
```

### Full round trip tests

```typescript
// tests/core/definePlugin.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ref, isRef } from 'vue'
import { definePlugin } from '../../src/core/definePlugin'
import { vueSerializer } from '../../src/serializers/vue'
import { ssrRoundTrip, createStore } from '../helpers'

describe('definePlugin', () => {
  it('does not re-fetch when payload exists', async () => {
    const getSession = vi.fn(async () => ({ name: 'john' }))

    const plugin = definePlugin('auth', {
      serializers: [vueSerializer],
      fn: async (ctx) => {
        const user = ctx.useState(() => ref(null))
        if (!user.value) user.value = await getSession()
        return { user }
      }
    })

    const { clientStore } = await ssrRoundTrip(plugin)

    expect(getSession).toHaveBeenCalledTimes(1)
    expect(isRef(plugin.get(clientStore).user)).toBe(true)
    expect(plugin.get(clientStore).user.value).toEqual({ name: 'john' })
  })

  it('fetches on client when no payload', async () => {
    const getSession = vi.fn(async () => ({ name: 'jane' }))

    const plugin = definePlugin('auth', {
      serializers: [vueSerializer],
      fn: async (ctx) => {
        const user = ctx.useState(() => ref(null))
        if (!user.value) user.value = await getSession()
        return { user }
      }
    })

    const store = createStore()  // no payload
    await plugin.run(store, { isServer: false })

    expect(getSession).toHaveBeenCalledTimes(1)
  })

  it('non-useState values are not in the payload', async () => {
    const plugin = definePlugin('auth', {
      serializers: [],
      fn: async (ctx) => {
        const secret = 'not-sent'                    // plain value, not in useState
        const name = ctx.useState(() => 'john')      // in useState, will be sent
        return { secret, name }
      }
    })

    const store = createStore()
    await plugin.run(store, { isServer: true })

    expect(Object.keys(store.payload['auth'])).not.toContain('secret')
    expect(Object.keys(store.payload['auth'])).toContain('auth:0')
  })

  it('useState IDs are stable across runs', async () => {
    const plugin = definePlugin('auth', {
      serializers: [],
      fn: async (ctx) => {
        const a = ctx.useState(() => 1)
        const b = ctx.useState(() => 2)
        return { a, b }
      }
    })

    const { clientStore } = await ssrRoundTrip(plugin)
    expect(plugin.get(clientStore)).toEqual({ a: 1, b: 2 })
  })
})
```

---

## File Structure

```
src/
  core/
    definePlugin.ts   — framework agnostic
    runPlugin.ts
    useState.ts
    context.ts
    types.ts
  adapters/
    vike.ts           — your-package/vike
    // nuxt.ts        — your-package/nuxt (future)
  serializers/
    types.ts
    apply.ts
    vue.ts            — your-package/vue
    devalue.ts        — your-package/devalue

tests/
  helpers.ts          — zero framework imports
  core/
    useState.test.ts
    definePlugin.test.ts
  serializers/
    vue.test.ts
    devalue.test.ts
    apply.test.ts
```

---

## Build Order

1. **`useState`** — pure function, easiest to test, everything depends on it
2. **Serializer pipeline** — pure functions, no context needed
3. **`runPlugin` + `definePlugin`** — wire together with plain store object
4. **Tests for 1-3** — all pass with zero framework imports
5. **Vike adapter** — thin wrapper, barely needs testing since core is solid


## Dependencies

Serializers are separate entrypoints (`your-package/vue`, `your-package/tanstack`) so their dependencies are optional peers — only needed if the user actually imports that entrypoint.

Use `peerDependenciesMeta` to mark them optional:

```json
{
  "peerDependencies": {
    "vue": "^3.0.0",
    "@tanstack/store": "^0.1.0"
  },
  "peerDependenciesMeta": {
    "vue": { "optional": true },
    "@tanstack/store": { "optional": true }
  }
}
```

No runtime "is this installed?" checks needed — if the user imports `your-package/vue` they have vue, if they don't the import fails with a clear missing module error. The core package itself has zero optional dependencies.