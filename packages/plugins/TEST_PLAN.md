Focus on tests that catch the _silent failure modes_. You already covered happy paths well — now you need “this should never happen” tests.

---

## 1. `useState` order / stability tests

### Mismatch detection (dev-mode)

```ts
it("warns when useState call count differs between server and client", async () => {
  const plugin = definePlugin("test", {
    fn: (ctx) => {
      ctx.useState(() => 1);
      if (ctx.isServer) ctx.useState(() => 2);
      return null;
    },
  });

  // server
  const serverStore = createStore();
  await plugin.run(serverStore, { isServer: true });

  // client
  const clientStore = createStore(serverStore.payload);

  // expect warning / error
});
```

---

## 2. Idempotency / dedupe

```ts
it("runs plugin only once even if called multiple times", async () => {
  const fn = vi.fn(() => 42);

  const plugin = definePlugin("test", { fn });

  const store = createStore();

  await Promise.all([plugin.run(store, { isServer: false }), plugin.run(store, { isServer: false })]);

  expect(fn).toHaveBeenCalledTimes(1);
});
```

---

## 3. `get()` safety

```ts
it("throws if get() is called before run()", () => {
  const plugin = definePlugin("test", { fn: () => 1 });
  const store = createStore();

  expect(() => plugin.get(store)).toThrow();
});
```

---

## 4. Version / payload invalidation

```ts
it("ignores payload when plugin version changes", async () => {
  const pluginV1 = definePlugin("test", {
    version: 1,
    fn: (ctx) => ctx.useState(() => 1),
  });

  const serverStore = createStore();
  await pluginV1.run(serverStore, { isServer: true });

  const pluginV2 = definePlugin("test", {
    version: 2,
    fn: (ctx) => ctx.useState(() => 2),
  });

  const clientStore = createStore(serverStore.payload);
  await pluginV2.run(clientStore, { isServer: false });

  expect(pluginV2.get(clientStore)).toBe(2);
});
```

---

## 5. Serializer edge cases

### Missing serializer

```ts
it("warns when tagged value has no matching serializer", () => {
  const raw = { __s: "Unknown", v: 123 };
  const result = deserializeValue([], raw);

  expect(result).toEqual(raw); // but with warning
});
```

### Collision safety

```ts
it("does not deserialize plain objects that look like tagged values", () => {
  const raw = { __s: "Ref", v: 123 };

  const result = deserializeValue([], raw);

  expect(result).toEqual(raw);
});
```

---

## 6. Circular / invalid values

```ts
it("throws or warns on circular structures", async () => {
  const obj: any = {};
  obj.self = obj;

  const plugin = definePlugin("test", {
    fn: (ctx) => ctx.useState(() => obj),
  });

  const store = createStore();

  await expect(plugin.run(store, { isServer: true })).rejects.toThrow();
});
```

---

## 7. Async factory misuse

```ts
it("warns or rejects async useState factory", async () => {
  const plugin = definePlugin("test", {
    fn: (ctx) => ctx.useState(async () => 42),
  });

  const store = createStore();

  await expect(plugin.run(store, { isServer: true })).rejects.toThrow();
});
```

---

## 8. Store mutation safety (if you change design)

```ts
it("does not mutate original store reference", async () => {
  const store = createStore();
  const original = { ...store };

  await plugin.run(store, { isServer: true });

  expect(store).not.toBe(original); // or ensure controlled mutation
});
```

---

## 9. Multiple plugins isolation

```ts
it("does not mix state between plugins", async () => {
  const a = definePlugin("a", {
    fn: (ctx) => ctx.useState(() => 1),
  });

  const b = definePlugin("b", {
    fn: (ctx) => ctx.useState(() => 2),
  });

  const store = createStore();

  await a.run(store, { isServer: true });
  await b.run(store, { isServer: true });

  expect(store.payload.a).not.toEqual(store.payload.b);
});
```

---

## 10. SSR/client divergence

```ts
it("handles different server/client logic safely", async () => {
  const plugin = definePlugin("test", {
    fn: (ctx) => {
      const a = ctx.useState(() => 1);
      const b = ctx.isServer ? ctx.useState(() => 2) : null;
      return { a, b };
    },
  });

  const { clientStore } = await ssrRoundTrip(plugin);

  // assert warning OR safe fallback behavior
});
```

---

## What matters most

If you only add a few, prioritize:

1. **order mismatch detection**
2. **idempotent run / concurrency**
3. **serializer failure cases**
4. **get-before-run guard**

Those are the ones that prevent “everything looks fine but is actually broken” bugs.