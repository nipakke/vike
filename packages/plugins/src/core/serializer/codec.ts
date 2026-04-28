export type CodecOptions<T, S> = {
  name: string;
  is: (data: unknown) => data is T;
  encode: (data: T) => S;
  decode: (data: S) => T;
}

//TODO: Fordítva
export type Codec<T, S> = Omit<CodecOptions<T, S>, "">

export function createCodec<T, S>(options: CodecOptions<T, S>): Codec<T, S> {
  return Object.freeze(options)
}