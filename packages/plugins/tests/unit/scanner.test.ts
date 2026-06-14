import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanDirectory } from '../../src/vite/scanner.js'

describe('scanDirectory', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'vike-scanner-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('detects .server.ts files with correct mode', () => {
    writeFileSync(join(tempDir, 'auth.server.ts'), '')
    writeFileSync(join(tempDir, 'middleware.server.js'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "auth",
          "filename": "auth.server.ts",
          "mode": "server",
        },
        {
          "baseName": "middleware",
          "filename": "middleware.server.js",
          "mode": "server",
        },
      ]
    `)
  })

  it('detects .client.ts files with correct mode', () => {
    writeFileSync(join(tempDir, 'analytics.client.ts'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "analytics",
          "filename": "analytics.client.ts",
          "mode": "client",
        },
      ]
    `)
  })

  it('detects unsuffixed files as universal', () => {
    writeFileSync(join(tempDir, 'db.ts'), '')
    writeFileSync(join(tempDir, 'utils.mjs'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "db",
          "filename": "db.ts",
          "mode": "universal",
        },
        {
          "baseName": "utils",
          "filename": "utils.mjs",
          "mode": "universal",
        },
      ]
    `)
  })

  it('skips hidden files starting with dot', () => {
    writeFileSync(join(tempDir, '.hidden.ts'), '')
    writeFileSync(join(tempDir, 'visible.ts'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "visible",
          "filename": "visible.ts",
          "mode": "universal",
        },
      ]
    `)
  })

  it('skips files starting with double underscore', () => {
    writeFileSync(join(tempDir, '__private.ts'), '')
    writeFileSync(join(tempDir, 'public.ts'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "public",
          "filename": "public.ts",
          "mode": "universal",
        },
      ]
    `)
  })

  it('skips non-TS/JS files', () => {
    writeFileSync(join(tempDir, 'readme.md'), '')
    writeFileSync(join(tempDir, 'config.json'), '')
    writeFileSync(join(tempDir, 'plugin.ts'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "plugin",
          "filename": "plugin.ts",
          "mode": "universal",
        },
      ]
    `)
  })

  it('returns empty array for non-existent directory', () => {
    const nonExistentDir = join(tempDir, 'does-not-exist')

    const result = scanDirectory(nonExistentDir)

    expect(result).toMatchInlineSnapshot('[]')
  })

  it('returns empty array for empty directory', () => {
    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot('[]')
  })

  it('sorts results alphabetically by filename', () => {
    writeFileSync(join(tempDir, 'zeta.ts'), '')
    writeFileSync(join(tempDir, 'alpha.ts'), '')
    writeFileSync(join(tempDir, 'beta.ts'), '')

    const result = scanDirectory(tempDir)

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "alpha",
          "filename": "alpha.ts",
          "mode": "universal",
        },
        {
          "baseName": "beta",
          "filename": "beta.ts",
          "mode": "universal",
        },
        {
          "baseName": "zeta",
          "filename": "zeta.ts",
          "mode": "universal",
        },
      ]
    `)
  })
})
