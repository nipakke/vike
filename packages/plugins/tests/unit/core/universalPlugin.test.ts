import { describe, it, expect, vi } from "vite-plus/test"
import { ref, isRef } from 'vue'
import { defineUniversalPlugin } from '../../../src/core/definePlugin'
import { ssrRoundTrip, createStore } from '../../helpers'
import { vueCodecRegistry } from "../../../src/adapters/vue"


it('plugin', async () => {
  type User = { name: string }
  const getSession = vi.fn(async () => ({ name: 'jane' }))

  const plugin = defineUniversalPlugin('auth', {
    serializers: [],
    fn: async (ctx) => {
      await new Promise((r) => setTimeout(r, 100))

      return {
        somereturn: true
      }
      /* const user = ctx.useState(() => ref<User | null>(null))
      if (!user.value) user.value = await getSession()
      return { user } */
    }
  })

  const store = createStore(undefined)  // no payload
  await plugin.run(store, { isServer: false })
  await plugin.run(store, { isServer: true })

  /* expect(getSession).toHaveBeenCalledTimes(1) */
})



describe.skip('definePlugin', () => {
  it('does not re-fetch when payload exists', async () => {
    type User = { name: string }
    const getSession = vi.fn(async () => ({ name: 'john' }))

    const plugin = defineUniversalPlugin('auth', {
      serializers: [vueCodecRegistry],
      fn: async (ctx) => {
        const user = ctx.useState(() => ref<User | null>(null))
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
    type User = { name: string }
    const getSession = vi.fn(async () => ({ name: 'jane' }))

    const plugin = defineUniversalPlugin('auth', {
      serializers: [vueCodecRegistry],
      fn: async (ctx) => {
        const user = ctx.useState(() => ref<User | null>(null))
        if (!user.value) user.value = await getSession()
        return { user }
      }
    })

    const store = createStore()  // no payload
    await plugin.run(store, { isServer: false })

    expect(getSession).toHaveBeenCalledTimes(1)
  })

  it('non-useState values are not in the payload', async () => {
    const plugin = defineUniversalPlugin('auth', {
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
    const plugin = defineUniversalPlugin('auth', {
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
