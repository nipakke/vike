import { DeserializeError, SerializeError } from "./errors";
import type { CodecRegistry } from "./registry"
import * as devalue from "devalue"
import type { SerializerResult, Serializer } from "./types";



export function buildSerializer(registries: CodecRegistry[] = []): Serializer {
  //TODO: Check if two registries have the same prefix, if so fail
  const { reducers, revivers } = registries.reduce((prev, curr) => ({
    reducers: { ...prev.reducers, ...curr.reducers },
    revivers: { ...prev.revivers, ...curr.revivers },
  }), { reducers: {}, revivers: {} })

  function serialize<T>(data: T): string {
    try {
      return devalue.stringify(data, reducers)
    } catch (e) {
      throw new SerializeError(e)
    }
  }

  function deserialize<T>(data: string): T {
    try {
      return devalue.parse(data, revivers)
    } catch (e) {
      throw new DeserializeError(e)
    }
  }

  function serializeSafe<T>(data: T): SerializerResult<string, SerializeError> {
    try {
      return [serialize(data), undefined]
    } catch (e) {
      return [undefined, e instanceof SerializeError ? e : new SerializeError(e)]
    }
  }

  function deserializeSafe<T>(data: string): SerializerResult<T, DeserializeError> {
    try {
      return [deserialize<T>(data), undefined]
    } catch (e) {
      return [undefined, e instanceof DeserializeError ? e : new DeserializeError(e)]
    }
  }

  return { serialize, deserialize, serializeSafe, deserializeSafe }
}