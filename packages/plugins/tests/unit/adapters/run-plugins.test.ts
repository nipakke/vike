import { describe, it, expect } from 'vitest'
import { runPlugins } from '../../src/adapters/run-plugins.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { VikePlugin } from '../../src/core/types.js'

describe('runPlugins', () => {
  it('executes plugins in correct sorted order', async () => {
    // Arrange — plugins with explicit ordering
    const executionOrder: string[] = []

    const plugins: VikePlugin[] = [
      definePlugin({
        name: 'third',
        enforce: 'post',
        order: 0,
        setup: () => {
          executionOrder.push('third')
        },
      }),
      definePlugin({
        name: 'first',
        enforce: 'pre',
        order: 0,
        setup: () => {
          executionOrder.push('first')
        },
      }),
      definePlugin({
        name: 'second',
        enforce: 'default',
        order: 0,
        setup: () => {
          executionOrder.push('second')
        },
      }),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Act
    await runPlugins(plugins, pageContext)

    // Assert — pre → default → post
    expect(executionOrder).toEqual(['first', 'second', 'third'])
  })

  it('parallel plugins are batched and all finish before next sequential', async () => {
    // Arrange — two parallel plugins followed by a sequential one
    const executionLog: { name: string; action: 'start' | 'end' }[] = []
    const parallelResults: number[] = []

    const plugins: VikePlugin[] = [
      definePlugin({
        name: 'par-a',
        parallel: true,
        setup: () => {
          executionLog.push({ name: 'par-a', action: 'start' })
          parallelResults.push(1)
          executionLog.push({ name: 'par-a', action: 'end' })
        },
      }),
      definePlugin({
        name: 'par-b',
        parallel: true,
        setup: () => {
          executionLog.push({ name: 'par-b', action: 'start' })
          parallelResults.push(2)
          executionLog.push({ name: 'par-b', action: 'end' })
        },
      }),
      definePlugin({
        name: 'sequential',
        setup: () => {
          executionLog.push({ name: 'sequential', action: 'start' })
          // At this point, both parallel plugins must have finished
          executionLog.push({
            name: 'sequential',
            action: 'assert-parallel-done',
          })
          executionLog.push({ name: 'sequential', action: 'end' })
        },
      }),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Act
    await runPlugins(plugins, pageContext)

    // Assert — sequential runs after both parallels finish
    // All start/end events for parallel plugins happen before sequential's start
    const sequentialStartIdx = executionLog.findIndex(
      (e) => e.name === 'sequential' && e.action === 'start'
    )
    const lastParallelEndIdx = Math.max(
      ...executionLog
        .filter((e) => e.name === 'par-a' && e.action === 'end')
        .map((_, i, arr) =>
          executionLog.findIndex(
            (x) => x === arr[arr.length - 1]
          )
        ),
      ...executionLog
        .filter((e) => e.name === 'par-b' && e.action === 'end')
        .map((_, i, arr) =>
          executionLog.findIndex(
            (x) => x === arr[arr.length - 1]
          )
        )
    )

    expect(sequentialStartIdx).toBeGreaterThan(lastParallelEndIdx)
    // Both parallel results present
    expect(parallelResults).toContain(1)
    expect(parallelResults).toContain(2)
  })

  it('sequential plugins wait for the previous one to complete', async () => {
    // Arrange — two sequential plugins where the second depends on the first's output
    const plugins: VikePlugin[] = [
      definePlugin({
        name: 'first',
        order: 1,
        setup: () => ({ provide: { step: 1 } }),
      }),
      definePlugin({
        name: 'second',
        order: 2,
        setup: () => ({ provide: { step: 2 } }),
      }),
    ]

    const pageContext = { isClientSide: true } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Act
    await runPlugins(plugins, pageContext)

    // Assert — both provides are accumulated (second ran after first)
    expect((pageContext as any).$plugins).toEqual({
      first: { step: 1 },
      second: { step: 2 },
    })
  })

  it('accumulates multiple provides across plugins', async () => {
    // Arrange — three plugins each providing different data
    const plugins: VikePlugin[] = [
      definePlugin({
        name: 'auth',
        enforce: 'pre',
        setup: () => ({ provide: { user: 'alice' } }),
      }),
      definePlugin({
        name: 'db',
        enforce: 'pre',
        order: 10,
        setup: () => ({ provide: { connected: true } }),
      }),
      definePlugin({
        name: 'config',
        enforce: 'default',
        setup: () => ({ provide: { theme: 'dark' } }),
      }),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Act
    await runPlugins(plugins, pageContext)

    // Assert — all provides accumulated by name
    expect((pageContext as any).$plugins).toEqual({
      auth: { user: 'alice' },
      db: { connected: true },
      config: { theme: 'dark' },
    })
  })

  it('handles empty plugins array without error', async () => {
    // Arrange
    const plugins: VikePlugin[] = []
    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Act & Assert — no error thrown
    await expect(runPlugins(plugins, pageContext)).resolves.toBeUndefined()
  })
})
