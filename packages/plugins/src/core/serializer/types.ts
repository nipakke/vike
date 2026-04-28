import type { DeserializeError, SerializeError } from "./errors"

export type Reducers = Record<string, (value: any) => any>
export type Revivers = Record<string, (value: any) => any>

type Success<T> = [value: T, error: undefined]
type Failure<E extends Error> = [value: undefined, error: E]
export type SerializerResult<T, E extends Error> = Success<T> | Failure<E>

export type Serializer = {
  serialize: <T>(data: T) => string;
  deserialize: <T>(data: string) => T;
  serializeSafe: <T>(data: T) => SerializerResult<string, SerializeError>
  deserializeSafe: <T>(data: string) => SerializerResult<T, DeserializeError>
}