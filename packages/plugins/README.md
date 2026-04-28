# useonce

Define an async composable once. It runs on the server, hydrates to the client, no double fetching.

```ts
export const useAuth = defineVikeShared("auth", {
  serializers: [vueSerializer],
  fn: async (ctx) => {
    const client = createAuthClient();
    const user = ctx.useState<User | null>(() => ref(null));

    if (!user.value) user.value = await client.getSession();

    return { client, user };
  },
});
```

```ts
// anywhere in your app
const { user } = useAuth();
```

The session is fetched on the server. The client gets the result without making the request again. Works without a server too, in that case it just runs normally on the client.

---

## The problem

Good point. Something like:

In SSR apps you often need to fetch something once (a session, config, feature flags) and have it available everywhere. The options are not great:

- Pinia is tied to Vue, cannot await initialization, and you end up with loading states everywhere
- TanStack Query handles fetching and deduplication but gives you query objects, not composables you can share globally
- Nuxt plugins solve this exactly but only within Nuxt

`useonce` gives you one function where you write your async logic once, await it properly, and use it anywhere.

The key distinction from both is **awaitable + composable + portable**. None of the existing solutions has all three.

---

## How it works

`fn` runs on both server and client. On the server, any value wrapped in `ctx.useState` is serialized and sent to the client. On the client, `ctx.useState` returns the hydrated value instead of running the factory, so the async call is skipped.

Anything outside `ctx.useState` (like `client` in the example above) is just recreated on both sides normally and never sent over the wire.

---

## Installation

```bash
pnpm add useonce
```

For Vue support:

```bash
pnpm add useonce vue
```

---

## Serializers

By default plain JSON-serializable values work without any configuration. For reactive values or special types you need a serializer.

```ts
import { vueSerializer } from "useonce/vue";
import { devalueSerializer } from "useonce/devalue";

defineVikeShared("auth", {
  serializers: [vueSerializer, devalueSerializer],
  fn: async (ctx) => {
    const user = ctx.useState<User | null>(() => ref(null)); // ref handled by vueSerializer
    const createdAt = ctx.useState(() => new Date()); // Date handled by devalueSerializer
    // ...
  },
});
```

Serializers are checked in order, first match wins. You can write your own:

```ts
import type { Serializer } from "useonce";

const mySerializer: Serializer<MyClass, string> = {
  name: "MyClass",
  is: (v): v is MyClass => v instanceof MyClass,
  serialize: (v) => v.toString(),
  deserialize: (v) => MyClass.from(v),
};
```

---

## Adapters

### Vike

```ts
import { defineVikeShared } from "useonce/vike";
```

Register your composables in `vike.config.ts`:

```ts
export default {
  onCreatePageContext: [
    "import:../composables/useAuth.ts:default",
    "import:../composables/useCart.ts:default",
  ],
};
```

The default export of each file should be the `.hook`:

```ts
// composables/useAuth.ts
export const useAuth = defineVikeShared('auth', { ... })
export default useAuth.hook
```

Order matters if composables depend on each other. Put dependencies first.

---

## `ctx.useState` rules

`ctx.useState` follows the same rules as React hooks or Vue's `setup`. Call order must be stable between server and client runs.

- Do not call inside conditionals
- Do not call inside loops with dynamic length
- Always call in the same order

Violating these will cause hydration mismatches.

---

## Without SSR

`useonce` works in SPA mode too. Without a server payload, `ctx.useState` just runs the factory normally. No special configuration needed.

---

## Packages

| Package           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `useonce`         | Core, no framework dependencies                            |
| `useonce/vike`    | Vike adapter                                               |
| `useonce/vue`     | Vue serializer (requires `vue`)                            |
| `useonce/devalue` | Devalue serializer for Date, Map, Set (requires `devalue`) |