import { describe, it, expect } from 'vitest'
import { normalizePluginName } from '../../src/core/plugin-name.js'

describe('normalizePluginName', () => {
  // ── Positive: essential normalization behaviors ──

  it('trims whitespace', () => {
    // Arrange
    const input = '  my plugin  '

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"my_plugin"`)
  })

  it('lowercases', () => {
    // Arrange
    const input = 'MyPlugin'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"myplugin"`)
  })

  it('replaces special chars', () => {
    // Arrange
    const input = 'hello world!'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"hello_world"`)
  })

  it('handles hyphens (valid chars, preserved)', () => {
    // Arrange
    const input = 'my-plugin'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"my-plugin"`)
  })

  it('handles dots', () => {
    // Arrange
    const input = 'my.plugin'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"my_plugin"`)
  })

  it('handles @ and /', () => {
    // Arrange
    const input = '@scope/name'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"scope_name"`)
  })

  it('collapses multiple underscores', () => {
    // Arrange
    const input = 'a___b'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"a_b"`)
  })

  it('strips leading/trailing underscores', () => {
    // Arrange
    const input = '__test__'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"test"`)
  })

  it('already clean name (idempotent)', () => {
    // Arrange
    const input = 'auth'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"auth"`)
  })

  // ── Negative: edge cases and boundary behavior ──

  it('empty string returns empty string', () => {
    // Arrange
    const input = ''

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`""`)
  })

  it('all special chars returns empty string', () => {
    // Arrange
    const input = '!!!'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`""`)
  })

  it('mixed case and special chars', () => {
    // Arrange
    const input = '  My Plug-in@v2!!  '

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"my_plug-in_v2"`)
  })

  // ── Additional edge cases ──

  it('whitespace-only string returns empty', () => {
    // Arrange
    const input = '   '

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`""`)
  })

  it('leading and trailing special chars stripped after replacement', () => {
    // Arrange
    const input = '@@test@@'

    // Act
    const result = normalizePluginName(input)

    // Assert
    expect(result).toMatchInlineSnapshot(`"test"`)
  })
})
