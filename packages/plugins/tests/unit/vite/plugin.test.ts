import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  scanDirectory,
  generateVirtualModule,
  generateTypeDeclaration,
} from '../../src/vite/plugin.js'
import type { PluginFileInfo } from '../../src/vite/plugin.js'

// ── scanDirectory tests ──

describe('scanDirectory', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'vike-plugin-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('detects .server.ts files correctly', () => {
    // Arrange
    writeFileSync(join(tempDir, 'auth.server.ts'), '')
    writeFileSync(join(tempDir, 'middleware.server.js'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toHaveLength(2)
    const auth = result.find((f) => f.filename === 'auth.server.ts')!
    expect(auth.mode).toBe('server')
    expect(auth.baseName).toBe('auth')

    const mw = result.find((f) => f.filename === 'middleware.server.js')!
    expect(mw.mode).toBe('server')
    expect(mw.baseName).toBe('middleware')
  })

  it('detects .client.ts files correctly', () => {
    // Arrange
    writeFileSync(join(tempDir, 'analytics.client.ts'), '')
    writeFileSync(join(tempDir, 'tracker.client.mjs'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toHaveLength(2)
    const analytics = result.find((f) => f.filename === 'analytics.client.ts')!
    expect(analytics.mode).toBe('client')
    expect(analytics.baseName).toBe('analytics')

    const tracker = result.find((f) => f.filename === 'tracker.client.mjs')!
    expect(tracker.mode).toBe('client')
    expect(tracker.baseName).toBe('tracker')
  })

  it('detects unsuffixed files as universal', () => {
    // Arrange
    writeFileSync(join(tempDir, 'helpers.ts'), '')
    writeFileSync(join(tempDir, 'utils.js'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toHaveLength(2)
    const helpers = result.find((f) => f.filename === 'helpers.ts')!
    expect(helpers.mode).toBe('universal')
    expect(helpers.baseName).toBe('helpers')

    const utils = result.find((f) => f.filename === 'utils.js')!
    expect(utils.mode).toBe('universal')
    expect(utils.baseName).toBe('utils')
  })

  it('skips hidden files (starting with .)', () => {
    // Arrange
    writeFileSync(join(tempDir, '.hidden.server.ts'), '')
    writeFileSync(join(tempDir, 'visible.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only visible file, not the hidden one
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('visible.ts')
  })

  it('skips files starting with __', () => {
    // Arrange
    writeFileSync(join(tempDir, '__private.ts'), '')
    writeFileSync(join(tempDir, 'public.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only public, not __private
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('public.ts')
  })

  it('skips non-TS/JS files', () => {
    // Arrange
    writeFileSync(join(tempDir, 'readme.md'), '')
    writeFileSync(join(tempDir, 'plugin.ts'), '')
    writeFileSync(join(tempDir, 'data.json'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only the .ts file
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('plugin.ts')
  })

  it('returns empty array for non-existent directory', () => {
    // Arrange — directory that doesn't exist
    const nonExistentDir = join(tempDir, 'does-not-exist')

    // Act
    const result = scanDirectory(nonExistentDir)

    // Assert
    expect(result).toEqual([])
  })

  it('sorts results alphabetically by filename', () => {
    // Arrange
    writeFileSync(join(tempDir, 'zebra.ts'), '')
    writeFileSync(join(tempDir, 'alpha.ts'), '')
    writeFileSync(join(tempDir, 'beta.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result[0].filename).toBe('alpha.ts')
    expect(result[1].filename).toBe('beta.ts')
    expect(result[2].filename).toBe('zebra.ts')
  })
})

// ── generateVirtualModule tests ──

describe('generateVirtualModule', () => {
  const pluginsDir = '/project/plugins'

  it('includes server-only file when isSSR is true', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.server.ts', mode: 'server', baseName: 'auth' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, true)

    // Server plugin present in SSR build — dynamic import
    expect(output).toContain('auth.server.ts')
    expect(output).toContain("await import('/project/plugins/auth.server.ts')")
    expect(output).toContain('export const rawPlugins = [plugin_0]')
  })

  it('excludes server-only file when isSSR is false', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.server.ts', mode: 'server', baseName: 'auth' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, false)

    // Server plugin entirely absent from client build
    expect(output).not.toContain('auth.server.ts')
    expect(output).toContain('export const rawPlugins = []')
  })

  it('includes client-only file when isSSR is false', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'analytics.client.ts', mode: 'client', baseName: 'analytics' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, false)

    // Client plugin present in client build
    expect(output).toContain('analytics.client.ts')
    expect(output).toContain("await import('/project/plugins/analytics.client.ts')")
    expect(output).toContain('export const rawPlugins = [plugin_0]')
  })

  it('excludes client-only file when isSSR is true', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'analytics.client.ts', mode: 'client', baseName: 'analytics' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, true)

    // Client plugin entirely absent from SSR build
    expect(output).not.toContain('analytics.client.ts')
    expect(output).toContain('export const rawPlugins = []')
  })

  it('universal file is always included regardless of isSSR', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'helpers.ts', mode: 'universal', baseName: 'helpers' },
    ]

    const ssrOutput = generateVirtualModule(pluginFiles, pluginsDir, true)
    const clientOutput = generateVirtualModule(pluginFiles, pluginsDir, false)

    // Both builds contain the universal plugin
    expect(ssrOutput).toContain('helpers.ts')
    expect(ssrOutput).toContain('SSR build')
    expect(clientOutput).toContain('helpers.ts')
    expect(clientOutput).toContain('client build')
    // No conditionals in either
    expect(ssrOutput).not.toContain('import.meta.env.SSR')
    expect(clientOutput).not.toContain('import.meta.env.SSR')
  })

  it('SSR build includes server + universal, excludes client', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.server.ts', mode: 'server', baseName: 'auth' },
      { filename: 'tracker.client.ts', mode: 'client', baseName: 'tracker' },
      { filename: 'utils.ts', mode: 'universal', baseName: 'utils' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, true)

    expect(output).toContain('auth.server.ts')
    expect(output).not.toContain('tracker.client.ts')
    expect(output).toContain('utils.ts')
    expect(output).toContain('export const rawPlugins = [plugin_0, plugin_1]')
  })

  it('client build includes client + universal, excludes server', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.server.ts', mode: 'server', baseName: 'auth' },
      { filename: 'tracker.client.ts', mode: 'client', baseName: 'tracker' },
      { filename: 'utils.ts', mode: 'universal', baseName: 'utils' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, false)

    expect(output).not.toContain('auth.server.ts')
    expect(output).toContain('tracker.client.ts')
    expect(output).toContain('utils.ts')
    expect(output).toContain('export const rawPlugins = [plugin_0, plugin_1]')
  })

  it('assigns baseName to unnamed plugins', () => {
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'my-plugin.ts', mode: 'universal', baseName: 'my-plugin' },
    ]

    const output = generateVirtualModule(pluginFiles, pluginsDir, false)

    expect(output).toContain(".name === 'unnamed'")
    expect(output).toContain(".name = 'my-plugin'")
  })
})

// ── generateTypeDeclaration tests ──

describe('generateTypeDeclaration', () => {
  const pluginsDir = '/project/plugins'

  it('output contains expected type augmentation structure', () => {
    // Arrange
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.ts', mode: 'universal', baseName: 'auth' },
    ]

    // Act
    const output = generateTypeDeclaration(pluginFiles, pluginsDir)

    // Assert — contains global augmentation structure
    expect(output).toContain('export {}')
    expect(output).toContain('declare global {')
    expect(output).toContain('namespace Vike {')
    expect(output).toContain('interface PageContext {')
    expect(output).toContain('$plugins: {')
    // Contains the PluginProvide type helper extraction
    expect(output).toContain('PluginProvide<typeof')
    expect(output).toContain('auth.ts')
    expect(output).toContain("import('")
    // Does NOT depend on vike/types import
    expect(output).not.toContain("from 'vike/types'")
  })

  it('exports PluginProvides and PluginProvideLookup helper types', () => {
    // Arrange
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'db.ts', mode: 'universal', baseName: 'db' },
    ]

    // Act
    const output = generateTypeDeclaration(pluginFiles, pluginsDir)

    // Assert — exported helper types present
    expect(output).toContain('export type PluginProvides')
    expect(output).toContain('export type PluginProvideLookup<K extends keyof PluginProvides>')
  })

  it('generates property keys for each plugin file', () => {
    // Arrange
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'auth.ts', mode: 'universal', baseName: 'auth' },
      { filename: 'db.ts', mode: 'universal', baseName: 'db' },
    ]

    // Act
    const output = generateTypeDeclaration(pluginFiles, pluginsDir)

    // Assert — both base names appear as property keys
    expect(output).toContain('auth:')
    expect(output).toContain('db:')
  })

  it('quotes property keys for non-identifier names', () => {
    // Arrange
    const pluginFiles: PluginFileInfo[] = [
      { filename: 'my-plugin.ts', mode: 'universal', baseName: 'my-plugin' },
    ]

    // Act
    const output = generateTypeDeclaration(pluginFiles, pluginsDir)

    // Assert — hyphenated name is quoted
    expect(output).toContain("'my-plugin':")
  })

  it('produces placeholder message for empty plugins', () => {
    // Arrange
    const pluginFiles: PluginFileInfo[] = []

    // Act
    const output = generateTypeDeclaration(pluginFiles, pluginsDir)

    // Assert — contains "No plugins discovered" placeholder
    expect(output).toContain('No plugins discovered')
  })
})
