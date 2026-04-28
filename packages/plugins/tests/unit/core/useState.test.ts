import { describe, it, expect, vi } from "vite-plus/test"
import { createUseState } from "../../../src/core/useState.js"

describe('useState', () => {
  const testStateKey = (p?: string) => "test_" + p

  it('runs factory when no payload', () => {
    const state = {}
    const { useState } = createUseState('test', undefined, state)
    expect(useState(testStateKey(), () => 42)).toBe(42)
  })

  it('skips factory when payload exists', () => {
    const factory = vi.fn(() => 42)
    const state = {}
    const payload: Record<string, any> = {}
    const key = testStateKey()
    const { useState, setPayloadKey } = createUseState('test', payload, state)

    //create initial state
    setPayloadKey(key, 99)

    expect(useState(key, factory)).toBe(99)
    expect(factory).not.toHaveBeenCalled()
  })

  it('throws when different factories use the same key', () => {
    const { useState } = createUseState('test', undefined, {})
    const key = testStateKey('a')
    useState(key, () => 'a')
    expect(() => useState(key, () => 'b')).toThrow(/key conflict/)
  })

  it('registers values for serialization', () => {
    const { useState, state, makeId } = createUseState('test', undefined, {})
    const key = testStateKey()
    useState(key, () => 'hello')
    expect(state[makeId(key)]).toBe('hello')
  })
})

