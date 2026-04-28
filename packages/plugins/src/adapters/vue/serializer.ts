import { isReactive, isRef, reactive, ref, toRaw, type Ref, isShallow, type ShallowRef, shallowRef, shallowReactive, type ShallowReactive, type ComputedRef } from 'vue'
import { createCodec, createCodecRegistry } from '../../core/serializer'
import { SerializeError, DeserializeError } from '../../core/serializer/errors'

const isComputed = (v: unknown): v is ComputedRef => isRef(v) && 'effect' in (v as object)

const refCodec = createCodec({
  name: 'Ref',
  is: (v): v is Ref => isRef(v) && !isShallow(v) && !isComputed(v),
  encode: (v) => v.value,
  decode: (v) => ref(v)
})

const shallowRefCodec = createCodec({
  name: "shallowRef",
  is: (v): v is ShallowRef => isRef(v) && isShallow(v) && !isComputed(v),
  encode(data) {
    return data.value
  },
  decode(data) {
    return shallowRef(data)
  },
})

const shallowReactiveCodec = createCodec({
  name: "shallowReactive",
  is: (v): v is ShallowReactive<object> => isReactive(v) && isShallow(v),
  encode: toRaw,
  decode: (v: object) => shallowReactive(v)
})

const reactiveCodec = createCodec({
  name: "reactive",
  is: (v): v is object => isReactive(v) && !isShallow(v),
  encode: toRaw,
  decode: (v: object) => reactive(v)
})

/**
 * Computed refs cannot be serialized because they are derived values — they
 * have no state of their own, only a getter (and optionally a setter) that
 * depends on other reactive sources. Serializing a computed would only capture
 * a snapshot of its current value, losing the reactivity entirely on
 * deserialization. If you need to serialize the value, use the underlying
 * reactive source instead.
 *
 * Without this codec, devalue throws a cryptic non-POJO error. This provides
 * a clear message pointing to the actual problem.
 */
const computedCodec = createCodec<ComputedRef, any>({
  name: "computed",
  is: (v): v is ComputedRef => isRef(v) && 'effect' in (v as object),
  encode: (_v) => { throw new SerializeError("Computed refs cannot be serialized") },
  decode: (_v) => { throw new DeserializeError("Computed refs cannot be deserialized") },
})

/**
 * Order does not matter — each codec's `is` guard is mutually exclusive.
 * computedCodec is included to provide a clear error message when a computed
 * ref is serialized, rather than a cryptic devalue error. See computedCodec
 * for why computed refs cannot be serialized.
 */
const vueCodecRegistry = createCodecRegistry({
  prefix: "vue",
  codecs: [
    reactiveCodec,
    refCodec,
    shallowReactiveCodec,
    shallowRefCodec,
    computedCodec
  ]
})

export {
  vueCodecRegistry,
  reactiveCodec,
  refCodec,
  shallowReactiveCodec,
  shallowRefCodec,
  computedCodec
}