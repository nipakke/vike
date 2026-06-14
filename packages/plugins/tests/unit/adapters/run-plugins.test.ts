import { describe, it, expect } from 'vitest'
import { runPlugins } from '../../src/vike/run-plugins.js'
import { definePlugin } from '../../src/core/definePlugin.js'
import type { PluginEntry, VikePlugin } from '../../src/core/types.js'

function entry(name: string, plugin: VikePlugin): PluginEntry {
  return { name, plugin }
}

describe('runPlugins', () => {
  it('executes plugins in correct sorted order', async () => {
    const executionOrder: string[] = []

    const entries: PluginEntry[] = [
      entry('third', definePlugin(
        () => { executionOrder.push('third') },
        { name: 'third', enforce: 'post', order: 0 }
      )),
      entry('first', definePlugin(
        () => { executionOrder.push('first') },
        { name: 'first', enforce: 'pre', order: 0 }
      )),
      entry('second', definePlugin(
        () => { executionOrder.push('second') },
        { name: 'second', enforce: 'default', order: 0 }
      )),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await runPlugins(entries, pageContext)

    expect(executionOrder).toEqual(['first', 'second', 'third'])
  })

  it('parallel plugins are batched and all finish before next sequential', async () => {
    const executionLog: { name: string; action: 'start' | 'end' }[] = []
    const parallelResults: number[] = []

    const entries: PluginEntry[] = [
      entry('par-a', definePlugin(
        () => {
          executionLog.push({ name: 'par-a', action: 'start' })
          parallelResults.push(1)
          executionLog.push({ name: 'par-a', action: 'end' })
        },
        { name: 'par-a', parallel: true }
      )),
      entry('par-b', definePlugin(
        () => {
          executionLog.push({ name: 'par-b', action: 'start' })
          parallelResults.push(2)
          executionLog.push({ name: 'par-b', action: 'end' })
        },
        { name: 'par-b', parallel: true }
      )),
      entry('sequential', definePlugin(
        () => {
          executionLog.push({ name: 'sequential', action: 'start' })
          executionLog.push({ name: 'sequential', action: 'assert-parallel-done' })
          executionLog.push({ name: 'sequential', action: 'end' })
        },
        { name: 'sequential' }
      )),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await runPlugins(entries, pageContext)

    const sequentialStartIdx = executionLog.findIndex(
      (e) => e.name === 'sequential' && e.action === 'start'
    )
    const lastParallelEndIdx = Math.max(
      ...executionLog
        .filter((e) => e.name === 'par-a' && e.action === 'end')
        .map((_, i, arr) =>
          executionLog.findIndex((x) => x === arr[arr.length - 1])
        ),
      ...executionLog
        .filter((e) => e.name === 'par-b' && e.action === 'end')
        .map((_, i, arr) =>
          executionLog.findIndex((x) => x === arr[arr.length - 1])
        )
    )

    expect(sequentialStartIdx).toBeGreaterThan(lastParallelEndIdx)
    expect(parallelResults).toContain(1)
    expect(parallelResults).toContain(2)
  })

  it('sequential plugins wait for the previous one to complete', async () => {
    const entries: PluginEntry[] = [
      entry('first', definePlugin(
        () => ({ provide: { step: 1 } }),
        { name: 'first', order: 1 }
      )),
      entry('second', definePlugin(
        () => ({ provide: { step: 2 } }),
        { name: 'second', order: 2 }
      )),
    ]

    const pageContext = { isClientSide: true } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await runPlugins(entries, pageContext)

    expect((pageContext as any).$plugins).toEqual({
      first: { step: 1 },
      second: { step: 2 },
    })
  })

  it('accumulates multiple provides across plugins', async () => {
    const entries: PluginEntry[] = [
      entry('auth', definePlugin(
        () => ({ provide: { user: 'alice' } }),
        { name: 'auth', enforce: 'pre' }
      )),
      entry('db', definePlugin(
        () => ({ provide: { connected: true } }),
        { name: 'db', enforce: 'pre', order: 10 }
      )),
      entry('config', definePlugin(
        () => ({ provide: { theme: 'dark' } }),
        { name: 'config', enforce: 'default' }
      )),
    ]

    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await runPlugins(entries, pageContext)

    expect((pageContext as any).$plugins).toEqual({
      auth: { user: 'alice' },
      db: { connected: true },
      config: { theme: 'dark' },
    })
  })

  it('handles empty plugins array without error', async () => {
    const entries: PluginEntry[] = []
    const pageContext = { isClientSide: false } as any // eslint-disable-line @typescript-eslint/no-explicit-any

    await expect(runPlugins(entries, pageContext)).resolves.toBeUndefined()
  })
})
