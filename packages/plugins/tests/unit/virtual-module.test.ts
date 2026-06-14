import { describe, it, expect } from 'vitest'
import { generateVirtualModule } from '../../src/vite/virtual-module.js'
import type { PluginFileInfo } from '../../src/vite/types.js'

describe('generateVirtualModule', () => {
  const pluginsDir = '/project/plugins'

  // ── Positive: SSR build includes server-only files ──

  it('SSR build includes server-only files', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth.server.ts',
        mode: 'server',
        baseName: 'auth',
        suggestedName: 'auth',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, true)

    // Assert
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — SSR build
      // ============================================================
      //
      // Only plugins for the SSR environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → INCLUDED
      //   *.client.ts  → EXCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // auth.server.ts (server)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/auth.server.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "auth.server.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'auth'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "auth.server.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      export const rawPlugins = [plugin_0].filter(Boolean)
      "
    `)
  })

  // ── Negative: SSR build excludes client-only files ──

  it('SSR build excludes client-only files', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'analytics.client.ts',
        mode: 'client',
        baseName: 'analytics',
        suggestedName: 'analytics',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, true)

    // Assert — client plugin entirely absent from SSR build
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — SSR build
      // ============================================================
      //
      // Only plugins for the SSR environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → INCLUDED
      //   *.client.ts  → EXCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      export const rawPlugins = []
      "
    `)
  })

  // ── Positive: Client build includes client-only files ──

  it('Client build includes client-only files', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'analytics.client.ts',
        mode: 'client',
        baseName: 'analytics',
        suggestedName: 'analytics',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, false)

    // Assert
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — client build
      // ============================================================
      //
      // Only plugins for the client environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → EXCLUDED
      //   *.client.ts  → INCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // analytics.client.ts (client)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/analytics.client.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "analytics.client.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'analytics'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "analytics.client.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      export const rawPlugins = [plugin_0].filter(Boolean)
      "
    `)
  })

  // ── Negative: Client build excludes server-only files ──

  it('Client build excludes server-only files', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth.server.ts',
        mode: 'server',
        baseName: 'auth',
        suggestedName: 'auth',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, false)

    // Assert — server plugin entirely absent from client build
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — client build
      // ============================================================
      //
      // Only plugins for the client environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → EXCLUDED
      //   *.client.ts  → INCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      export const rawPlugins = []
      "
    `)
  })

  // ── Positive: Universal files included in both builds ──

  it('universal files are included in both SSR and client builds', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'db.ts',
        mode: 'universal',
        baseName: 'db',
        suggestedName: 'db',
      },
    ]

    // Act
    const ssrOutput = generateVirtualModule(files, pluginsDir, true)
    const clientOutput = generateVirtualModule(files, pluginsDir, false)

    // Assert — both builds contain the universal plugin
    expect(ssrOutput).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — SSR build
      // ============================================================
      //
      // Only plugins for the SSR environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → INCLUDED
      //   *.client.ts  → EXCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // db.ts (universal)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/db.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "db.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'db'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "db.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      export const rawPlugins = [plugin_0].filter(Boolean)
      "
    `)
    expect(clientOutput).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — client build
      // ============================================================
      //
      // Only plugins for the client environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → EXCLUDED
      //   *.client.ts  → INCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // db.ts (universal)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/db.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "db.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'db'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "db.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      export const rawPlugins = [plugin_0].filter(Boolean)
      "
    `)
  })

  // ── Full SSR build: mixed plugins ──

  it('full SSR build includes server + universal, excludes client', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth.server.ts',
        mode: 'server',
        baseName: 'auth',
        suggestedName: 'auth',
      },
      {
        filename: 'analytics.client.ts',
        mode: 'client',
        baseName: 'analytics',
        suggestedName: 'analytics',
      },
      {
        filename: 'db.ts',
        mode: 'universal',
        baseName: 'db',
        suggestedName: 'db',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, true)

    // Assert — server + universal present, client absent
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — SSR build
      // ============================================================
      //
      // Only plugins for the SSR environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → INCLUDED
      //   *.client.ts  → EXCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // auth.server.ts (server)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/auth.server.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "auth.server.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'auth'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "auth.server.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      // db.ts (universal)
      let plugin_1
      try {
        const mod_1 = await import('/project/plugins/db.ts')
        plugin_1 = mod_1.default
        if (!plugin_1 || typeof plugin_1 !== 'object' || typeof plugin_1.setup !== 'function') {
          console.warn(\`[vike-plugins] File "db.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_1 = null
        } else {
          if (!plugin_1.name || plugin_1.name === 'unnamed') plugin_1.name = 'db'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "db.ts":\`, err instanceof Error ? err.message : err)
        plugin_1 = null
      }

      export const rawPlugins = [plugin_0, plugin_1].filter(Boolean)
      "
    `)
  })

  // ── Full client build: mixed plugins ──

  it('full client build includes client + universal, excludes server', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth.server.ts',
        mode: 'server',
        baseName: 'auth',
        suggestedName: 'auth',
      },
      {
        filename: 'analytics.client.ts',
        mode: 'client',
        baseName: 'analytics',
        suggestedName: 'analytics',
      },
      {
        filename: 'db.ts',
        mode: 'universal',
        baseName: 'db',
        suggestedName: 'db',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, false)

    // Assert — client + universal present, server absent
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — client build
      // ============================================================
      //
      // Only plugins for the client environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → EXCLUDED
      //   *.client.ts  → INCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // analytics.client.ts (client)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/analytics.client.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "analytics.client.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'analytics'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "analytics.client.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      // db.ts (universal)
      let plugin_1
      try {
        const mod_1 = await import('/project/plugins/db.ts')
        plugin_1 = mod_1.default
        if (!plugin_1 || typeof plugin_1 !== 'object' || typeof plugin_1.setup !== 'function') {
          console.warn(\`[vike-plugins] File "db.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_1 = null
        } else {
          if (!plugin_1.name || plugin_1.name === 'unnamed') plugin_1.name = 'db'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "db.ts":\`, err instanceof Error ? err.message : err)
        plugin_1 = null
      }

      export const rawPlugins = [plugin_0, plugin_1].filter(Boolean)
      "
    `)
  })

  // ── Name inference in generated code ──

  it('assigns suggestedName to unnamed plugins', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'my-auth.ts',
        mode: 'universal',
        baseName: 'my-auth',
        suggestedName: 'my-auth',
      },
    ]

    // Act
    const output = generateVirtualModule(files, pluginsDir, false)

    // Assert — generated code includes name assignment
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — client build
      // ============================================================
      //
      // Only plugins for the client environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → EXCLUDED
      //   *.client.ts  → INCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      // my-auth.ts (universal)
      let plugin_0
      try {
        const mod_0 = await import('/project/plugins/my-auth.ts')
        plugin_0 = mod_0.default
        if (!plugin_0 || typeof plugin_0 !== 'object' || typeof plugin_0.setup !== 'function') {
          console.warn(\`[vike-plugins] File "my-auth.ts" does not export a valid VikePlugin (expected default export from definePlugin()). Skipping.\`)
          plugin_0 = null
        } else {
          if (!plugin_0.name || plugin_0.name === 'unnamed') plugin_0.name = 'my-auth'
        }
      } catch (err) {
        console.warn(\`[vike-plugins] Failed to load plugin "my-auth.ts":\`, err instanceof Error ? err.message : err)
        plugin_0 = null
      }

      export const rawPlugins = [plugin_0].filter(Boolean)
      "
    `)
  })

  // ── Edge case: Empty plugins array ──

  it('returns module with empty rawPlugins array for empty input', () => {
    // Arrange
    const files: PluginFileInfo[] = []

    // Act
    const output = generateVirtualModule(files, pluginsDir, true)

    // Assert — empty array in output
    expect(output).toMatchInlineSnapshot(`
      "// ============================================================
      // virtual:vike-plugins — SSR build
      // ============================================================
      //
      // Only plugins for the SSR environment are listed below.
      // Opposite-environment plugins are completely absent.
      //   *.server.ts  → INCLUDED
      //   *.client.ts  → EXCLUDED
      //   *.ts         → always included
      //
      // ============================================================

      export const rawPlugins = []
      "
    `)
  })

  // ── Negative: Duplicate name detection ──

  it('throws Error when duplicate suggestedNames are detected', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth-v1.ts',
        mode: 'universal',
        baseName: 'auth',
        suggestedName: 'auth',
      },
      {
        filename: 'auth-v2.ts',
        mode: 'universal',
        baseName: 'auth',
        suggestedName: 'auth',
      },
    ]

    // Act & Assert — function should throw with duplicate detection message
    expect(() => generateVirtualModule(files, pluginsDir, true)).toThrow(
      'Duplicate plugin names detected after normalization:',
    )
    expect(() => generateVirtualModule(files, pluginsDir, true)).toThrow(
      '"auth"',
    )
  })

  // ── Edge case: No duplicates with different suggestedNames ──

  it('does NOT throw when plugins have different suggestedNames', () => {
    // Arrange
    const files: PluginFileInfo[] = [
      {
        filename: 'auth.server.ts',
        mode: 'server',
        baseName: 'auth',
        suggestedName: 'auth',
      },
      {
        filename: 'db.ts',
        mode: 'universal',
        baseName: 'db',
        suggestedName: 'db',
      },
    ]

    // Act & Assert — should not throw
    expect(() => generateVirtualModule(files, pluginsDir, true)).not.toThrow()
  })
})
