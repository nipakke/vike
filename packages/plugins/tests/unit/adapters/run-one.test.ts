import { describe, it, expect } from 'vitest'
import { runOne } from '../../src/adapters/run-one.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PageContext } from 'vike/types'

describe('runOne', () => {
  it('stores `provide` value in pageContext.$plugins', async () => {
    const plugin = definePlugin({
      name: 'auth',
      setup: async () => ({ provide: { userId: 42 } }),
    })

    const pageContext = {} as PageContext
    await runOne(plugin, pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ auth: { userId: 42 } })
  })

  it('stores sync provide value', async () => {
    const plugin = definePlugin({
      name: 'data',
      setup: () => ({ provide: { items: [1, 2, 3] } }),
    })

    const pageContext = {} as PageContext
    await runOne(plugin, pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ data: { items: [1, 2, 3] } })
  })

  it('stores nothing when setup returns void', async () => {
    const plugin = definePlugin({
      name: 'logger',
      setup: () => { /* side effect only */ },
    })

    const pageContext = {} as PageContext
    await runOne(plugin, pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toBeUndefined()
  })

  it('stores nothing when setup returns undefined', async () => {
    const plugin = definePlugin({
      name: 'noop',
      setup: () => undefined,
    })

    const pageContext = {} as PageContext
    await runOne(plugin, pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toBeUndefined()
  })

  it('initializes $plugins when first plugin provides', async () => {
    const plugin1 = definePlugin({
      name: 'first',
      setup: () => ({ provide: { a: 1 } }),
    })
    const plugin2 = definePlugin({
      name: 'second',
      setup: () => ({ provide: { b: 2 } }),
    })

    const pageContext = {} as PageContext

    await runOne(plugin1, pageContext)
    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ first: { a: 1 } })

    await runOne(plugin2, pageContext)
    expect((pageContext as Record<string, unknown>).$plugins).toEqual({
      first: { a: 1 },
      second: { b: 2 },
    })
  })
})
