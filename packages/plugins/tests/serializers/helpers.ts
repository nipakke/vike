import type { Serializer } from "../../src/core/serializer/types"

export function expectRoundTrip<T>(value: T, serializer: Serializer) {
  const { serialize, deserialize } = serializer
  const result = deserialize(serialize(value))
  expect(result).toEqual(value)
}