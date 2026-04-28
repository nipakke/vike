import { describe, it, expect } from "vite-plus/test"
import { buildSerializer, createCodec, createCodecRegistry } from "../../src/core/serializer"
import { DeserializeError, SerializeError } from "../../src/core/serializer/errors"
import { expectRoundTrip } from "./helpers"

class Vector {
  constructor(public x: number, public y: number) { }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
}

class Color {
  constructor(public r: number, public g: number, public b: number) { }
}

const VectorCodec = createCodec<Vector, [number, number]>({
  name: "Vector",
  is: (v): v is Vector => v instanceof Vector,
  encode: (v) => [v.x, v.y],
  decode: ([x, y]) => new Vector(x, y),
})

const ColorCodec = createCodec<Color, [number, number, number]>({
  name: "Color",
  is: (v): v is Color => v instanceof Color,
  encode: (v) => [v.r, v.g, v.b],
  decode: ([r, g, b]) => new Color(r, g, b),
})

const registry = createCodecRegistry({
  prefix: "app",
  codecs: [VectorCodec, ColorCodec],
})

function createTestSerializer(withRegistry = false) {
  return buildSerializer(withRegistry ? [registry] : [])
}

describe("serializer", () => {
  describe("core behavior", () => {
    it("produces a string", () => {
      const { serialize } = createTestSerializer()
      expect(typeof serialize(42)).toBe("string")
    })

    it("round-trips primitives", () => {
      const s = createTestSerializer()
      expectRoundTrip(42, s)
      expectRoundTrip("hello", s)
      expectRoundTrip(null, s)
      expectRoundTrip(undefined, s)
    })

    it("round-trips plain objects", () => {
      const s = createTestSerializer()
      expectRoundTrip({ x: 1, y: 2 }, s)
    })

    it("round-trips arrays", () => {
      const s = createTestSerializer()
      expectRoundTrip([1, 2, 3], s)
    })

    it("round-trips nested structures", () => {
      const s = createTestSerializer()
      expectRoundTrip({ a: { b: { c: 42 } } }, s)
    })
  })

  describe("errors", () => {
    it("throws SerializeError on invalid input", () => {
      const { serialize } = createTestSerializer()
      expect(() => serialize(() => { })).toThrow(SerializeError)
    })

    it("throws DeserializeError on invalid input", () => {
      const { deserialize } = createTestSerializer()
      expect(() => deserialize("not valid json at all!!!")).toThrow(DeserializeError)
    })

    it("exposes the path of the offending value", () => {
      const { serializeSafe } = createTestSerializer()
      const [res, e] = serializeSafe({ position: new Vector(3, 4) })

      expect(res).toBeUndefined()
      expect(e).toBeInstanceOf(SerializeError)
      expect((e as SerializeError).path).toBe(".position")
    })
  })

  describe("extended types", () => {
    it("round-trips Date", () => {
      const { serialize, deserialize } = createTestSerializer()
      const date = new Date("2024-01-01")
      const result = deserialize<Date>(serialize(date))

      expect(result).toBeInstanceOf(Date)
      expect(result.getTime()).toBe(date.getTime())
    })

    it("round-trips Map", () => {
      expectRoundTrip(new Map([["a", 1]]), createTestSerializer())
    })

    it("round-trips Set", () => {
      expectRoundTrip(new Set([1, 2, 3]), createTestSerializer())
    })

    it("round-trips RegExp with source and flags", () => {
      const { serialize, deserialize } = createTestSerializer()

      const input = /hello/gi
      const result = deserialize<RegExp>(serialize(input))

      expect(result).toBeInstanceOf(RegExp)
      expect(result.source).toBe(input.source)
      expect(result.flags).toBe(input.flags)
    })

    it("preserves TypedArray values", () => {
      expectRoundTrip(new Uint8Array([1, 2, 3]), createTestSerializer())
    })
  })

  describe("custom codecs", () => {
    it("round-trips a custom class", () => {
      const { serialize, deserialize } = createTestSerializer(true)
      const vec = new Vector(3, 4)

      const result = deserialize<Vector>(serialize(vec))

      expect(result).toBeInstanceOf(Vector)
      expect(result.x).toBe(3)
      expect(result.y).toBe(4)
      expect(result.magnitude()).toBe(5)
    })

    it("throws on unknown class without registry", () => {
      const { serialize } = createTestSerializer()
      expect(() => serialize(new Vector(3, 4))).toThrow(SerializeError)
    })

    it("round-trips nested object with custom class", () => {
      const { serialize, deserialize } = createTestSerializer(true)
      const data = { position: new Vector(1, 2), label: "origin" }

      const result = deserialize<typeof data>(serialize(data))

      expect(result.position).toBeInstanceOf(Vector)
      expect(result.position.x).toBe(1)
      expect(result.label).toBe("origin")
    })

    it("round-trips nested array with custom class", () => {
      const { serialize, deserialize } = createTestSerializer(true)
      const data = [new Vector(1, 0), new Vector(0, 1)]

      const result = deserialize<Vector[]>(serialize(data))

      expect(result[0]).toBeInstanceOf(Vector)
      expect(result[1]).toBeInstanceOf(Vector)
    })

    it("round-trips deeply nested custom classes", () => {
      const { serialize, deserialize } = createTestSerializer(true)
      const data = { a: { b: { vec: new Vector(5, 12), color: new Color(0, 255, 0) } } }

      const result = deserialize<typeof data>(serialize(data))

      expect(result.a.b.vec).toBeInstanceOf(Vector)
      expect(result.a.b.vec.magnitude()).toBe(13)
      expect(result.a.b.color).toBeInstanceOf(Color)
    })
  })

  describe("registry behavior", () => {
    it("last registry wins on key conflict", () => {
      const OverrideCodec = createCodec<Vector, [number, number]>({
        name: "Vector",
        is: (v): v is Vector => v instanceof Vector,
        encode: (v) => [v.x * 2, v.y * 2],
        decode: ([x, y]) => new Vector(x, y),
      })

      const { serialize, deserialize } = buildSerializer([
        createCodecRegistry({ prefix: "app", codecs: [VectorCodec] }),
        createCodecRegistry({ prefix: "app", codecs: [OverrideCodec] }),
      ])

      const result = deserialize<Vector>(serialize(new Vector(3, 4)))
      expect(result.x).toBe(6)
    })
  })

  describe("safe API", () => {
    it("returns [string, undefined] on success", () => {
      const { serializeSafe } = createTestSerializer(true)
      const [value, error] = serializeSafe({ x: 1 })

      expect(value).toBeTypeOf("string")
      expect(error).toBeUndefined()
    })

    it("returns [undefined, SerializeError] on failure", () => {
      const { serializeSafe } = createTestSerializer()
      const [value, error] = serializeSafe(() => { })

      expect(value).toBeUndefined()
      expect(error).toBeInstanceOf(SerializeError)
    })

    it("returns [T, undefined] on success", () => {
      const { serializeSafe, deserializeSafe } = createTestSerializer(true)
      const [serialized] = serializeSafe(new Vector(3, 4))
      const [value, error] = deserializeSafe<Vector>(serialized!)

      expect(value).toBeInstanceOf(Vector)
      expect(error).toBeUndefined()
    })

    it("returns [undefined, DeserializeError] on failure", () => {
      const { deserializeSafe } = createTestSerializer()
      const [value, error] = deserializeSafe("not valid!!!")

      expect(value).toBeUndefined()
      expect(error).toBeInstanceOf(DeserializeError)
    })

    it("preserves original error as cause", () => {
      const { serializeSafe } = createTestSerializer()
      const [, error] = serializeSafe(() => { })
      expect(error?.cause).toBeDefined()
    })

    it("fails to deserialize custom class without registry", () => {
      const { serializeSafe } = createTestSerializer(true)
      const { deserializeSafe } = createTestSerializer()

      const [serialized] = serializeSafe(new Vector(3, 4))
      const [value] = deserializeSafe<Vector>(serialized!)

      expect(value).not.toBeInstanceOf(Vector)
    })
  })



})




