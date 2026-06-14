import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanDirectory } from '../../src/vite/scanner.js'

// ─────────────────────────────────────────────────────────────────────────────
// scanDirectory — isolated unit tests
//
// Tests the directory scanner in isolation (not through the Vite plugin).
// Uses temp directories created fresh for each test to ensure determinism.
// All output assertions use inline snapshots (toMatchInlineSnapshot).
// ─────────────────────────────────────────────────────────────────────────────

describe('scanDirectory', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'vike-scanner-test-'))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  // ── Positive: server mode detection ─────────────────────────────────────

  it('detects .server.ts files with correct mode and suggestedName', () => {
    // Arrange
    writeFileSync(join(tempDir, 'auth.server.ts'), '')
    writeFileSync(join(tempDir, 'middleware.server.js'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — both files detected as server mode, sorted alphabetically
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "auth",
          "filename": "auth.server.ts",
          "mode": "server",
          "suggestedName": "auth",
        },
        {
          "baseName": "middleware",
          "filename": "middleware.server.js",
          "mode": "server",
          "suggestedName": "middleware",
        },
      ]
    `)
  })

  // ── Positive: client mode detection ─────────────────────────────────────

  it('detects .client.ts files with correct mode', () => {
    // Arrange
    writeFileSync(join(tempDir, 'analytics.client.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "analytics",
          "filename": "analytics.client.ts",
          "mode": "client",
          "suggestedName": "analytics",
        },
      ]
    `)
  })

  // ── Positive: universal mode (no suffix) ────────────────────────────────

  it('detects unsuffixed files as universal', () => {
    // Arrange
    writeFileSync(join(tempDir, 'db.ts'), '')
    writeFileSync(join(tempDir, 'utils.mjs'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "db",
          "filename": "db.ts",
          "mode": "universal",
          "suggestedName": "db",
        },
        {
          "baseName": "utils",
          "filename": "utils.mjs",
          "mode": "universal",
          "suggestedName": "utils",
        },
      ]
    `)
  })

  // ── Negative: hidden files are skipped ──────────────────────────────────

  it('skips hidden files starting with dot', () => {
    // Arrange
    writeFileSync(join(tempDir, '.hidden.ts'), '')
    writeFileSync(join(tempDir, 'visible.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only visible.ts returned, .hidden.ts excluded
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "visible",
          "filename": "visible.ts",
          "mode": "universal",
          "suggestedName": "visible",
        },
      ]
    `)
  })

  // ── Negative: __-prefixed files are skipped ─────────────────────────────

  it('skips files starting with double underscore', () => {
    // Arrange
    writeFileSync(join(tempDir, '__private.ts'), '')
    writeFileSync(join(tempDir, 'public.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only public.ts returned, __private.ts excluded
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "public",
          "filename": "public.ts",
          "mode": "universal",
          "suggestedName": "public",
        },
      ]
    `)
  })

  // ── Negative: non-TS/JS files are skipped ───────────────────────────────

  it('skips non-TS/JS files', () => {
    // Arrange
    writeFileSync(join(tempDir, 'readme.md'), '')
    writeFileSync(join(tempDir, 'config.json'), '')
    writeFileSync(join(tempDir, 'plugin.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — only plugin.ts returned, .md and .json excluded
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "plugin",
          "filename": "plugin.ts",
          "mode": "universal",
          "suggestedName": "plugin",
        },
      ]
    `)
  })

  // ── Edge case: non-existent directory ───────────────────────────────────

  it('returns empty array for non-existent directory', () => {
    // Arrange
    const nonExistentDir = join(tempDir, 'does-not-exist')

    // Act
    const result = scanDirectory(nonExistentDir)

    // Assert
    expect(result).toMatchInlineSnapshot('[]')
  })

  // ── Edge case: empty directory ──────────────────────────────────────────

  it('returns empty array for empty directory', () => {
    // Arrange — tempDir is already empty after mkdtempSync

    // Act
    const result = scanDirectory(tempDir)

    // Assert
    expect(result).toMatchInlineSnapshot('[]')
  })

  // ── Ordering: alphabetical sort by filename ─────────────────────────────

  it('sorts results alphabetically by filename', () => {
    // Arrange
    writeFileSync(join(tempDir, 'zeta.ts'), '')
    writeFileSync(join(tempDir, 'alpha.ts'), '')
    writeFileSync(join(tempDir, 'beta.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — alpha, beta, zeta order
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "alpha",
          "filename": "alpha.ts",
          "mode": "universal",
          "suggestedName": "alpha",
        },
        {
          "baseName": "beta",
          "filename": "beta.ts",
          "mode": "universal",
          "suggestedName": "beta",
        },
        {
          "baseName": "zeta",
          "filename": "zeta.ts",
          "mode": "universal",
          "suggestedName": "zeta",
        },
      ]
    `)
  })

  // ── Normalization: special characters in suggestedName ──────────────────

  it('normalizes special characters in suggestedName from filename', () => {
    // Arrange — file with spaces and special chars in its name
    writeFileSync(join(tempDir, 'My Plugin!.ts'), '')

    // Act
    const result = scanDirectory(tempDir)

    // Assert — suggestedName is normalized: lowercase, special chars → _
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "baseName": "My Plugin!",
          "filename": "My Plugin!.ts",
          "mode": "universal",
          "suggestedName": "my_plugin",
        },
      ]
    `)
  })
})
