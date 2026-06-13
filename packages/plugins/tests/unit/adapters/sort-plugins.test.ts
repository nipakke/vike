import { describe, it, expect } from 'vitest'
import { sortPlugins } from '../../src/adapters/sort-plugins.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { Enforcement, VikePlugin } from '../../src/core/types.js'

describe('sortPlugins', () => {
  it('sorts pre before default before post', () => {
    // Arrange — plugins in random order with different enforce groups
    const plugins: VikePlugin[] = [
      definePlugin({ name: 'post-1', enforce: 'post', setup: () => {} }),
      definePlugin({ name: 'pre-1', enforce: 'pre', setup: () => {} }),
      definePlugin({ name: 'default-1', enforce: 'default', setup: () => {} }),
    ]

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — enforce group priority: pre(0) → default(1) → post(2)
    expect(sorted[0].name).toBe('pre-1')
    expect(sorted[1].name).toBe('default-1')
    expect(sorted[2].name).toBe('post-1')
  })

  it('sorts by order field within the same enforce group', () => {
    // Arrange — all in same enforce group, different order values
    const plugins: VikePlugin[] = [
      definePlugin({ name: 'c', order: 30, setup: () => {} }),
      definePlugin({ name: 'a', order: 10, setup: () => {} }),
      definePlugin({ name: 'b', order: 20, setup: () => {} }),
    ]

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — ascending by order
    expect(sorted[0].name).toBe('a')
    expect(sorted[1].name).toBe('b')
    expect(sorted[2].name).toBe('c')
  })

  it('uses alphabetical tiebreaker when order is equal', () => {
    // Arrange — same enforce, same order, different names
    const plugins: VikePlugin[] = [
      definePlugin({ name: 'zeta', order: 0, setup: () => {} }),
      definePlugin({ name: 'alpha', order: 0, setup: () => {} }),
      definePlugin({ name: 'beta', order: 0, setup: () => {} }),
    ]

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — alphabetical by name when order is equal
    expect(sorted[0].name).toBe('alpha')
    expect(sorted[1].name).toBe('beta')
    expect(sorted[2].name).toBe('zeta')
  })

  it('returns a new array — does not mutate the original', () => {
    // Arrange
    const plugins: VikePlugin[] = [
      definePlugin({ name: 'b', order: 2, setup: () => {} }),
      definePlugin({ name: 'a', order: 1, setup: () => {} }),
    ]
    const original = [...plugins]

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — new array reference
    expect(sorted).not.toBe(plugins)
    // Original order is preserved
    expect(plugins).toEqual(original)
    // Sorted order differs from original
    expect(sorted[0].name).toBe('a')
    expect(sorted[1].name).toBe('b')
  })

  it('handles empty array input', () => {
    // Arrange
    const plugins: VikePlugin[] = []

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — returns empty array, no error
    expect(sorted).toEqual([])
    expect(sorted).not.toBe(plugins) // new array even for empty
  })

  it('handles single plugin', () => {
    // Arrange
    const plugin = definePlugin({ name: 'only', setup: () => {} })
    const plugins: VikePlugin[] = [plugin]

    // Act
    const sorted = sortPlugins(plugins)

    // Assert — single-element array, new reference
    expect(sorted).toHaveLength(1)
    expect(sorted[0]).toBe(plugin)
    expect(sorted).not.toBe(plugins)
  })
})
