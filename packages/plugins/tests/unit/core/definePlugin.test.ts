import { describe, it, expect } from 'vitest'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PluginContext } from '../../src/core/types.js'

describe('definePlugin', () => {
  it('applies all defaults when only setup is provided', () => {
    const plugin = definePlugin({ setup: () => {} })

    expect(plugin.name).toBe('unnamed')
    expect(plugin.enforce).toBe('default')
    expect(plugin.order).toBe(0)
    expect(plugin.parallel).toBe(false)
    expect(plugin.await).toBe(true)
  })

  it('preserves explicit values', () => {
    const plugin = definePlugin({ name: 'auth', enforce: 'pre', order: 10, setup: () => {} })

    expect(plugin.name).toBe('auth')
    expect(plugin.enforce).toBe('pre')
    expect(plugin.order).toBe(10)
    expect(plugin.parallel).toBe(false)
    expect(plugin.await).toBe(true)
  })

  it('preserves async setup function (same reference)', () => {
    const setup = async (ctx: PluginContext) => {
      await new Promise((r) => setTimeout(r, 1))
    }

    const plugin = definePlugin({ setup })
    expect(plugin.setup).toBe(setup) // same reference
  })

  it('preserves parallel and await flags', () => {
    const plugin = definePlugin({ parallel: true, await: false, setup: () => {} })

    expect(plugin.parallel).toBe(true)
    expect(plugin.await).toBe(false)
  })

  it('setup function receives PluginContext with { isServer: boolean }', () => {
    let captured: unknown = null

    const plugin = definePlugin({
      setup: (ctx) => {
        captured = ctx
      },
    })

    plugin.setup({ isServer: true })
    expect(captured).toEqual({ isServer: true })

    plugin.setup({ isServer: false })
    expect(captured).toEqual({ isServer: false })
  })

  it('produces distinct objects — no shared mutable state', () => {
    const a = definePlugin({ setup: () => {} })
    const b = definePlugin({ setup: () => {} })

    // Distinct object references — each call returns a fresh object
    expect(a).not.toBe(b)
    // Primitive fields are equal (same defaults)
    expect(a.name).toBe(b.name)
    expect(a.enforce).toBe(b.enforce)
    expect(a.order).toBe(b.order)
    expect(a.parallel).toBe(b.parallel)
    expect(a.await).toBe(b.await)
    // Setup functions are different closures — different references
    expect(a.setup).not.toBe(b.setup)
  })

  it('is pure: same config (same setup reference) produces equal output', () => {
    const setup = () => {}
    const config = { name: 'test', enforce: 'post' as const, order: 5, setup }

    const a = definePlugin(config)
    const b = definePlugin(config)

    // Same input should produce deeply equal output
    expect(a).toEqual(b)
    // But still distinct objects (no shared mutable state)
    expect(a).not.toBe(b)
  })
})
