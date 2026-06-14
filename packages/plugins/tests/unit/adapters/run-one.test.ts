import { describe, it, expect } from 'vitest'
import { runOne } from '../../src/vike/run-one.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PluginEntry } from '../../src/core/types.js'
import type { PageContext } from 'vike/types'

function entry(name: string, plugin: ReturnType<typeof definePlugin>): PluginEntry {
  return { name, plugin }
}

describe('runOne', () => {
  it('stores `provide` value in pageContext.$plugins', async () => {
    const plugin = definePlugin(
      async () => ({ provide: { userId: 42 } }),
      { name: 'auth' }
    )

    const pageContext = {} as PageContext
    await runOne(entry('auth', plugin), pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ auth: { userId: 42 } })
  })

  it('stores sync provide value', async () => {
    const plugin = definePlugin(
      () => ({ provide: { items: [1, 2, 3] } }),
      { name: 'data' }
    )

    const pageContext = {} as PageContext
    await runOne(entry('data', plugin), pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ data: { items: [1, 2, 3] } })
  })

  it('stores nothing when setup returns void', async () => {
    const plugin = definePlugin(
      () => { /* side effect only */ },
      { name: 'logger' }
    )

    const pageContext = {} as PageContext
    await runOne(entry('logger', plugin), pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toBeUndefined()
  })

  it('stores nothing when setup returns undefined', async () => {
    const plugin = definePlugin(
      () => undefined,
      { name: 'noop' }
    )

    const pageContext = {} as PageContext
    await runOne(entry('noop', plugin), pageContext)

    expect((pageContext as Record<string, unknown>).$plugins).toBeUndefined()
  })

  it('initializes $plugins when first plugin provides', async () => {
    const plugin1 = definePlugin(
      () => ({ provide: { a: 1 } }),
      { name: 'first' }
    )
    const plugin2 = definePlugin(
      () => ({ provide: { b: 2 } }),
      { name: 'second' }
    )

    const pageContext = {} as PageContext

    await runOne(entry('first', plugin1), pageContext)
    expect((pageContext as Record<string, unknown>).$plugins).toEqual({ first: { a: 1 } })

    await runOne(entry('second', plugin2), pageContext)
    expect((pageContext as Record<string, unknown>).$plugins).toEqual({
      first: { a: 1 },
      second: { b: 2 },
    })
  })
})
