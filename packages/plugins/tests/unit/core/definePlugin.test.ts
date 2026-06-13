import { describe, it, expect } from 'vitest'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PageContext } from 'vike/types'

describe('definePlugin', () => {
  it('applies all defaults when only setup is provided', () => {
    const plugin = definePlugin({ setup: () => {} })

    expect(plugin.name).toBe('unnamed')
    expect(plugin.enforce).toBe('default')
    expect(plugin.order).toBe(0)
    expect(plugin.parallel).toBe(false)
  })

  it('preserves explicit values', () => {
    const plugin = definePlugin({ name: 'auth', enforce: 'pre', order: 10, setup: () => {} })

    expect(plugin.name).toBe('auth')
    expect(plugin.enforce).toBe('pre')
    expect(plugin.order).toBe(10)
    expect(plugin.parallel).toBe(false)
  })

  it('wraps setup to extract provide automatically', async () => {
    const setup = async (ctx: PageContext) => {
      await new Promise((r) => setTimeout(r, 1))
    }

    const plugin = definePlugin({ setup })
    // The original setup is wrapped — not same reference
    expect(plugin.setup).not.toBe(setup)
    // But the wrapper still calls through (tested by provide tests below)
  })

  it('preserves parallel flag', () => {
    const plugin = definePlugin({ parallel: true, setup: () => {} })

    expect(plugin.parallel).toBe(true)
  })

  it('setup function receives the full PageContext', () => {
    let captured: unknown = null

    const plugin = definePlugin({
      setup: (ctx) => {
        captured = ctx
      },
    })

    const pageContext = { isClientSide: true, urlOriginal: '/test', routeParams: {} } as PageContext
    plugin.setup(pageContext)
    expect(captured).toBe(pageContext)
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
    // Setup functions are different closures — different references
    expect(a.setup).not.toBe(b.setup)
  })

  it('is pure: same config produces structurally equal output', () => {
    const setup = () => {}
    const config = { name: 'test', enforce: 'post' as const, order: 5, setup }

    const a = definePlugin(config)
    const b = definePlugin(config)

    // Distinct objects
    expect(a).not.toBe(b)
    // Primitive fields match
    expect(a.name).toBe(b.name)
    expect(a.enforce).toBe(b.enforce)
    expect(a.order).toBe(b.order)
    expect(a.parallel).toBe(b.parallel)
    // Setup is wrapped — distinct functions
    expect(a.setup).not.toBe(b.setup)
  })

  // ── Provide return value tests ──

  it('preserves setup function that returns a provide value', async () => {
    const plugin = definePlugin({
      setup: () => ({ provide: { userId: 1, role: 'admin' } }),
    })

    // The wrapper extracts .provide automatically
    const pageContext = { isClientSide: true } as PageContext
    const result = await plugin.setup(pageContext)

    expect(result).toEqual({ userId: 1, role: 'admin' })
    expect((plugin as Record<string, unknown>).provide).toBeUndefined()
  })

  it('setup returning void: returns undefined', async () => {
    const plugin = definePlugin({ setup: () => {} })

    const pageContext = { isClientSide: false } as PageContext
    const result = await plugin.setup(pageContext)

    expect(result).toBeUndefined()
  })

  it('async setup returning provide: extracts provide value', async () => {
    const plugin = definePlugin({
      setup: async () => {
        await Promise.resolve()
        return { provide: { loaded: true } }
      },
    })

    const pageContext = { isClientSide: true } as PageContext
    const result = await plugin.setup(pageContext)

    expect(result).toEqual({ loaded: true })
  })
})
