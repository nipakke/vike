import { describe, it, expect } from "vite-plus/test"
import { reactive, isReactive, isShallow, shallowReactive, isRef, ref, shallowRef, computed } from 'vue'
import { buildSerializer } from "../../src/core/serializer"
import { vueCodecRegistry, refCodec, shallowRefCodec, reactiveCodec, shallowReactiveCodec, computedCodec } from "../../src/adapters/vue/serializer"
import { SerializeError } from "../../src/core/serializer/errors"
const { serialize, deserialize } = buildSerializer([vueCodecRegistry])

describe("vue reactivity serialization", () => {
  describe("ref", () => {
    it("round-trips ref", () => {
      const data = ref(42)
      const result = deserialize<ReturnType<typeof ref>>(serialize(data))

      expect(isRef(result)).toBe(true)
      expect(result.value).toBe(42)
      expect(isShallow(result)).toBe(false)
    })

    it("does not match shallowRef codec", () => {
      expect(refCodec.is(shallowRef(42))).toBe(false)
    })
  })

  describe("shallowRef", () => {
    it("round-trips shallowRef", () => {
      const data = shallowRef(42)
      const result = deserialize<ReturnType<typeof shallowRef>>(serialize(data))

      expect(isRef(result)).toBe(true)
      expect(isShallow(result)).toBe(true)
      expect(result.value).toBe(42)
    })

    it("does not match ref codec", () => {
      expect(shallowRefCodec.is(ref(42))).toBe(false)
    })
  })

  describe("reactive", () => {
    it("round-trips reactive object", () => {
      const data = reactive({ x: 1, y: 2 })
      const result = deserialize<typeof data>(serialize(data))

      expect(isReactive(result)).toBe(true)
      expect(result).toEqual({ x: 1, y: 2 })
      expect(isShallow(result)).toBe(false)
    })

    it("preserves nested reactivity structure", () => {
      const data = reactive({ nested: { x: 1 } })
      const result = deserialize<typeof data>(serialize(data))

      expect(isReactive(result)).toBe(true)
      expect(result.nested.x).toBe(1)
    })

    it("does not match shallowReactive codec", () => {
      expect(reactiveCodec.is(shallowReactive({ x: 1 }))).toBe(false)
    })
  })

  describe("shallowReactive", () => {
    it("round-trips shallowReactive object", () => {
      const data = shallowReactive({ x: 1, y: 2 })
      const result = deserialize<typeof data>(serialize(data))

      expect(isReactive(result)).toBe(true)
      expect(isShallow(result)).toBe(true)
      expect(result).toEqual({ x: 1, y: 2 })
    })

    it("does not deeply wrap nested objects", () => {
      const data = shallowReactive({ nested: { x: 1 } })
      const result = deserialize<typeof data>(serialize(data))

      expect(isShallow(result)).toBe(true)
      expect(isReactive(result.nested)).toBe(false)
    })

    it("does not match reactive codec", () => {
      expect(shallowReactiveCodec.is(reactive({ x: 1 }))).toBe(false)
    })
  })

  describe("codec isolation rules", () => {
    it("reactive and shallowReactive are mutually exclusive", () => {
      const a = reactive({ x: 1 })
      const b = shallowReactive({ x: 1 })

      expect(reactiveCodec.is(b)).toBe(false)
      expect(shallowReactiveCodec.is(a)).toBe(false)
    })

    it("ref and shallowRef are mutually exclusive", () => {
      const a = ref(1)
      const b = shallowRef(1)

      expect(refCodec.is(b)).toBe(false)
      expect(shallowRefCodec.is(a)).toBe(false)
    })
  })

  describe("computedCodec", () => {
    it("throws SerializeError on readonly computed", () => {
      const c = computed(() => 42)
      expect(() => serialize(c)).toThrow(SerializeError)
    })

    it("throws SerializeError on writable computed", () => {
      const source = ref(0)
      const c = computed({
        get: () => source.value,
        set: (v) => { source.value = v }
      })

      expect(() => serialize(c)).toThrow(SerializeError)
    })

    it("does not match plain ref", () => {
      expect(computedCodec.is(ref(42))).toBe(false)
    })

    it("does not match shallowRef", () => {
      expect(computedCodec.is(shallowRef(42))).toBe(false)
    })
  })
})


/* describe.skip('vueSerializer', () => {
  it('detects refs', () => {
    expect(vueSerializer.is(ref(null))).toBe(true)
    expect(vueSerializer.is(42)).toBe(false)
  })

  it('serializes ref to raw value', () => {
    expect(vueSerializer.serialize(ref({ name: 'john' }))).toEqual({ name: 'john' })
  })

  it('deserializes to ref', () => {
    const result = vueSerializer.deserialize({ name: 'john' })
    expect(isRef(result)).toBe(true)
    expect(result.value).toEqual({ name: 'john' })
  })

  it('round trips', () => {
    const r = ref({ name: 'john' })
    expect(vueSerializer.deserialize(vueSerializer.serialize(r)).value).toEqual(r.value)
  })
})
 */