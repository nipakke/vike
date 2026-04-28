import type { Codec } from "./codec";
import type { Reducers, Revivers } from "./types";

export type CodecRegistryOptions = {
  prefix: string;
  codecs: Codec<any, any>[]
}

export type CodecRegistry = {
  revivers: Reducers
  reducers: Revivers
}

export function createCodecRegistry(opts: CodecRegistryOptions): CodecRegistry {
  const reducers: Reducers = {}
  const revivers: Revivers = {}

  for (const codec of opts.codecs) {
    const key = `${opts.prefix}_${codec.name}`
    reducers[key] = v => codec.is(v) && codec.encode(v)
    revivers[key] = codec.decode
  }

  return {
    reducers,
    revivers
  }
}