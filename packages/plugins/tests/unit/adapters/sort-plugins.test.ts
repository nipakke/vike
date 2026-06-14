import { describe, it, expect } from 'vitest'
import { sortPlugins } from '../../src/vike/sort-plugins.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PluginEntry, VikePlugin } from '../../src/core/types.js'

function entry(name: string, plugin: VikePlugin): PluginEntry {
  return { name, plugin }
}

describe('sortPlugins', () => {
  it('sorts pre before default before post', () => {
    const entries: PluginEntry[] = [
      entry('post-1', definePlugin(() => {}, { name: 'post-1', enforce: 'post' })),
      entry('pre-1', definePlugin(() => {}, { name: 'pre-1', enforce: 'pre' })),
      entry('default-1', definePlugin(() => {}, { name: 'default-1', enforce: 'default' })),
    ]

    const sorted = sortPlugins(entries)

    expect(sorted[0].name).toBe('pre-1')
    expect(sorted[1].name).toBe('default-1')
    expect(sorted[2].name).toBe('post-1')
  })

  it('sorts by order field within the same enforce group', () => {
    const entries: PluginEntry[] = [
      entry('c', definePlugin(() => {}, { name: 'c', order: 30 })),
      entry('a', definePlugin(() => {}, { name: 'a', order: 10 })),
      entry('b', definePlugin(() => {}, { name: 'b', order: 20 })),
    ]

    const sorted = sortPlugins(entries)

    expect(sorted[0].name).toBe('a')
    expect(sorted[1].name).toBe('b')
    expect(sorted[2].name).toBe('c')
  })

  it('uses alphabetical tiebreaker when order is equal', () => {
    const entries: PluginEntry[] = [
      entry('zeta', definePlugin(() => {}, { name: 'zeta', order: 0 })),
      entry('alpha', definePlugin(() => {}, { name: 'alpha', order: 0 })),
      entry('beta', definePlugin(() => {}, { name: 'beta', order: 0 })),
    ]

    const sorted = sortPlugins(entries)

    expect(sorted[0].name).toBe('alpha')
    expect(sorted[1].name).toBe('beta')
    expect(sorted[2].name).toBe('zeta')
  })

  it('returns a new array — does not mutate the original', () => {
    const entries: PluginEntry[] = [
      entry('b', definePlugin(() => {}, { name: 'b', order: 2 })),
      entry('a', definePlugin(() => {}, { name: 'a', order: 1 })),
    ]
    const original = [...entries]

    const sorted = sortPlugins(entries)

    expect(sorted).not.toBe(entries)
    expect(entries).toEqual(original)
    expect(sorted[0].name).toBe('a')
    expect(sorted[1].name).toBe('b')
  })

  it('handles empty array input', () => {
    const entries: PluginEntry[] = []

    const sorted = sortPlugins(entries)

    expect(sorted).toEqual([])
    expect(sorted).not.toBe(entries)
  })

  it('handles single plugin', () => {
    const plugin = definePlugin(() => {}, { name: 'only' })
    const entries: PluginEntry[] = [entry('only', plugin)]

    const sorted = sortPlugins(entries)

    expect(sorted).toHaveLength(1)
    expect(sorted[0].plugin).toBe(plugin)
    expect(sorted).not.toBe(entries)
  })
})
