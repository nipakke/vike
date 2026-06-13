# @nipakke/vike-plugins — Technical Reference

Auto-discovered, ordered, per-request plugin runner for [Vike](https://vike.dev).

---

## 1. Package Structure

```
packages/plugins/
├── src/
│   ├── core/
│   │   ├── types.ts           # VikePlugin, PluginContext, Enforcement, etc.
│   │   └── definePlugin.ts    # Factory: options → resolved VikePlugin
│   ├── adapters/
│   │   └── vike.ts            # runPlugins(), sortPlugins(), re-exports
│   ├── vite/
│   │   └── plugin.ts          # Vite plugin: scan dir, generate virtual module, HMR
│   ├── runner.ts              # onCreatePageContext hook — dynamic imports + calls runPlugins()
│   └── +config.ts             # Vike config extension (name, import string)
├── dist/                      # Built by vp pack (4 entries)
│   ├── vike.js / vike.d.ts
│   ├── vite.js / vite.d.ts
│   ├── runner.js / runner.d.ts
│   └── +config.js / +config.d.ts
├── vite.config.ts             # vp pack config (entries, build hooks, neverBundle)
├── package.json               # Exports map: ./vike, ./vite, ./runner, ./config
└── tests/
    └── unit/
        └── core/
            └── definePlugin.test.ts
```

### Exports

| Export path | Source | Built to | Purpose |
|---|---|---|---|
| `./vike` | `src/adapters/vike.ts` | `dist/vike.js` | `definePlugin()`, `runPlugins()`, types |
| `./vite` | `src/vite/index.ts` | `dist/vite.js` | `vikePlugins()` Vite plugin |
| `./runner` | `src/runner.ts` | `dist/runner.js` | `onCreatePageContext()` hook |
| `./config` | `src/+config.ts` | `dist/+config.js` | Vike extension config (import string) |

---

## 2. Architecture

Four components, three phases.

```
PHASE 1: BUILD TIME (one-time on startup / file change)
┌─────────────────────────────────────────────────────┐
│  Vite plugin (vikePlugins)                          │
│                                                     │
│  resolveId('virtual:vike-plugins') → \0virtual:...  │
│  load(\0virtual:...) → generated ESM source         │
│                                                     │
│  configureServer:                                   │
│    watcher.on('add|unlink|change') → invalidate +   │
│    HMR full-reload                                  │
└─────────────────────────────────────────────────────┘

PHASE 2: CONFIG RESOLUTION (Vike startup)
┌─────────────────────────────────────────────────┐
│  User's pages/+config.ts                        │
│  ┌───────────────────────────────────────────┐  │
│  │ extends: [vikePluginsConfig]              │  │
│  │   → loads dist/+config.js                │  │
│  │     → name: '@nipakke/vike-plugins'      │  │
│  │     → onCreatePageContext:                │  │
│  │       'import:...runner:onCreatePage...'  │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Vike resolves the import string via            │
│  createRequire → require.resolve()             │
│  → loads dist/runner.js (statically)           │
│  → registers the exported function as the      │
│    onCreatePageContext hook                     │
└─────────────────────────────────────────────────┘

PHASE 3: PER-REQUEST EXECUTION (SSR + hydration)
┌─────────────────────────────────────────────────┐
│  Vike calls runner.onCreatePageContext(pageCtx) │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. import('@nipakke/vike-plugins/vike')   │  │
│  │    → runPlugins ref                        │  │
│  │ 2. import('virtual:vike-plugins')          │  │
│  │    → rawPlugins[] (from virtual module)    │  │
│  │ 3. runPlugins(rawPlugins, pageContext)     │  │
│  │    → sort, batch, execute                  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. Vike Integration Mechanics

### 3.1 Config Extension (`vike.config.js` pattern)

The file `src/+config.ts` exports a Vike config object:

```typescript
// src/+config.ts
export default {
  name: '@nipakke/vike-plugins',
  onCreatePageContext: 'import:@nipakke/vike-plugins/runner:onCreatePageContext',
}
```

This file is built to `dist/+config.js`. The user pulls it in via Vike's `extends`:

```typescript
// User's pages/+config.ts
import vikePluginsConfig from '@nipakke/vike-plugins/config'  // resolves to dist/+config.js

export default {
  extends: [vikePluginsConfig],
}
```

Vike merges the extended config into the user's config. The `name` field is cosmetic (used for debug logging). The `onCreatePageContext` import string is what matters.

### 3.2 Import String Resolution

Vike uses `import:` syntax for `onCreate*` hooks. The string `'import:@nipakke/vike-plugins/runner:onCreatePageContext'` tells Vike:

1. Resolve the module `@nipakke/vike-plugins/runner` via `require.resolve()` to a file path
2. Import that file and extract the named export `onCreatePageContext`
3. Call that function as the hook

This resolution happens at **config time** — before Vite starts building. It uses Node's `createRequire`, so the module must exist on disk as a runnable JS file. Vite virtual modules (`virtual:*`) **cannot** be resolved via `require.resolve()` — they only exist inside Vite's module graph.

This is why the runner is a static file on disk (`dist/runner.js`) and the virtual module is only loaded via dynamic `import()` **inside** the runner at **runtime** (when Vite's SSR module loader is active).

### 3.3 Build Hook Rename

The source file is `src/+config.ts` (the `+` is valid in filenames but esbuild replaces `+` with `_` in output filenames). The build config works around this:

```typescript
// vite.config.ts (excerpt)
pack: {
  entry: { '_config': 'src/+config.ts' },
  hooks: {
    'build:done': async () => {
      renameSafeSync('dist/_config.js', 'dist/+config.js')
      renameSafeSync('dist/_config.d.ts', 'dist/+config.d.ts')
    },
  },
}
```

Entry name `_config` → output `dist/_config.js` → renamed to `dist/+config.js`. The `package.json` exports map points to the final name:

```json
{ "./config": "./dist/+config.js" }
```

---

## 4. Virtual Module (`virtual:vike-plugins`)

### 4.1 Resolution

The Vite plugin uses the standard virtual module pattern:

```typescript
const VIRTUAL_ID = 'virtual:vike-plugins'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID  // \0 prefix = "internal, don't resolve via fs"

resolveId(id) {
  if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
}

load(id) {
  if (id === RESOLVED_VIRTUAL_ID) {
    // scan directory, generate source
  }
}
```

### 4.2 Generation

`generateVirtualModule()` produces ESM that imports every plugin file and re-exports them as an array:

```javascript
// Generated output (for plugins/auth.ts, plugins/db.ts, plugins/log.ts)
import _mod_0 from '/absolute/path/to/plugins/auth.ts'
const plugin_auth_0 = _mod_0
if (!plugin_auth_0.name || plugin_auth_0.name === 'unnamed') plugin_auth_0.name = 'auth'

import _mod_1 from '/absolute/path/to/plugins/db.ts'
const plugin_db_1 = _mod_1
if (!plugin_db_1.name || plugin_db_1.name === 'unnamed') plugin_db_1.name = 'db'

export const rawPlugins = [plugin_auth_0, plugin_db_1]
```

Each plugin file must `export default` a `VikePlugin` object (the return value of `definePlugin()`).

### 4.3 Name Inference

If a plugin's `name` is `undefined` or `'unnamed'` (the default when `definePlugin` is called without a `name` option), the virtual module infers a name from the filename:

```javascript
const inferredName = basename(file, extname(file))  // "auth" from "auth.ts"
if (!pluginVar.name || pluginVar.name === 'unnamed') pluginVar.name = inferredName
```

This ensures alphabetical sorting has meaningful values even when `name` is omitted.

### 4.4 HMR Integration

```typescript
configureServer(server) {
  server.watcher.add(pluginsDir)  // add the plugins directory to the file watcher

  server.watcher.on('add', handleChange)
  server.watcher.on('unlink', handleChange)
  server.watcher.on('change', handleChange)
}
```

On any file add/remove/change in the scanned directory:

1. Invalidate the virtual module in Vite's module graph
2. Send a `full-reload` WebSocket message

This forces the virtual module to be re-generated on the next request, picking up the changes.

---

## 5. Runner (`src/runner.ts`)

```typescript
export async function onCreatePageContext(pageContext: PageContext): Promise<void> {
  const [{ runPlugins }, mod] = await Promise.all([
    import('@nipakke/vike-plugins/vike'),
    import('virtual:vike-plugins'),
  ])

  const plugins = mod.rawPlugins ?? []
  if (plugins.length > 0) {
    await runPlugins(plugins, pageContext)
  }
}
```

### 5.1 Why Dynamic Imports

- `import('virtual:vike-plugins')` — this is a Vite virtual module. It only exists inside Vite's SSR module system. A static `import` would fail at config time (Node doesn't know about Vite virtual modules). Dynamic `import()` defers resolution to runtime, when Vite's SSR transform pipeline is active.
- `import('@nipakke/vike-plugins/vike')` — this is a package import resolved by Vite's SSR resolver. It's loaded dynamically to keep the runner module small (the `vike` entry is marked `neverBundle`, so it stays as an external import rather than being chunked into the runner).

### 5.2 `neverBundle`

The build config prevents Vite from inlining the adapter:

```typescript
deps: {
  neverBundle: ['vike', '@nipakke/vike-plugins/vike']
}
```

Without this, esbuild would inline `runPlugins` directly into `dist/runner.js`. With `neverBundle`, the runner keeps `import('@nipakke/vike-plugins/vike')` as a package import — resolved at runtime by Vite's module resolution. This avoids duplication and lets Vite handle the import naturally.

---

## 6. Adapter & Execution Engine (`src/adapters/vike.ts`)

### 6.1 `runPlugins(plugins, pageContext)`

**Parameters:**
- `plugins: VikePlugin[]` — raw plugins from the virtual module
- `pageContext: PageContext` — Vike's page context for the current request

**Algorithm:**

```
1. Determine isServer = !pageContext.isClientSide
2. Sort plugins by enforce group → order → name
3. Iterate through sorted plugins:
   a. If plugin.parallel is true:
      - Collect consecutive parallel plugins into a batch
      - Execute all via Promise.all
      - Wait for the batch to complete
   b. If plugin.parallel is false:
      - Execute sequentially (await)
```

### 6.2 Sorting

```
Priority (most significant → least):
  1. enforce group:  pre (0) < default (1) < post (2)
  2. order (numeric):  lower runs first
  3. name (string):     alphabetical (localeCompare)
```

Implementation:

```typescript
function sortPlugins(plugins: VikePlugin[]): VikePlugin[] {
  const order: Record<string, number> = { pre: 0, default: 1, post: 2 }
  return [...plugins].sort((a, b) => {
    if (a.enforce !== b.enforce) return order[a.enforce] - order[b.enforce]
    if (a.order !== b.order) return a.order - b.order
    return a.name.localeCompare(b.name)
  })
}
```

### 6.3 Per-Plugin Execution

```typescript
async function runOne(plugin: VikePlugin, isServer: boolean): Promise<void> {
  const ctx: PluginContext = { isServer }
  const result = plugin.setup(ctx)
  if (plugin.await !== false) {
    await result
  }
  // if await: false, the promise is fire-and-forget
}
```

**`await` flag behavior:**
- `await: true` (default): `await` the result of `setup()`. The next plugin (or batch) waits.
- `await: false`: call `setup()` but do NOT await. The function returns immediately. The plugin's promise continues in the background. Errors in fire-and-forget plugins become unhandled promise rejections (no error propagation to the caller).

### 6.4 Parallel Batching

Parallel plugins are batched **by consecutive position in the sorted array** — not globally. Example:

```
Sorted order: [A(parallel), B(parallel), C(sequential), D(parallel)]
Execution:
  Batch 1: Promise.all([A, B])  → then
  Sequential: await C             → then
  Sequential: await D             (D runs alone — there are no consecutive parallel neighbors)
```

This means `parallel: true` on a plugin only groups it with its immediate neighbors — the batch boundary is any sequential plugin.

---

## 7. Type System

### 7.1 Input Types

```typescript
type Enforcement = 'pre' | 'default' | 'post'

type PluginContext = {
  isServer: boolean
}

type VikePluginHook = (ctx: PluginContext) => void | Promise<void>

type VikePluginOptions = {
  name?: string
  enforce?: Enforcement
  order?: number
  parallel?: boolean
  await?: boolean
  setup: VikePluginHook
}
```

### 7.2 Resolved Type

```typescript
type VikePlugin = {
  name: string      // always a string (default: 'unnamed')
  enforce: Enforcement  // always defined (default: 'default')
  order: number     // always defined (default: 0)
  parallel: boolean // always defined (default: false)
  await: boolean    // always defined (default: true)
  setup: VikePluginHook
}
```

`definePlugin()` is the only way to produce a `VikePlugin`. It fills in defaults, transforming `VikePluginOptions` → `VikePlugin`. The resolved type has no optional fields — consumers like `runPlugins()` can trust all fields are present.

### 7.3 Public Type Exports

All types are re-exported from `@nipakke/vike-plugins/vike`:

```typescript
export type { VikePlugin, VikePluginOptions, PluginContext, Enforcement } from '../core/types'
```

---

## 8. Build Pipeline

```
src/+config.ts ──┐
src/runner.ts  ──┤
src/vite/index.ts ──┤    vp pack    ┌── dist/vike.js + .d.ts
src/adapters/vike.ts ──┘ ─────────→ ├── dist/vite.js + .d.ts
                                    ├── dist/runner.js + .d.ts
                                    └── dist/_config.js + .d.ts
                                                         │
                                              build:done hook
                                              rename → +config.js
```

**Build tool:** `vp pack` (vite-plus pack, configured in `vite.config.ts`)
**Format:** ESM only
**Type generation:** `dts: true` — one `.d.ts` per entry
**Source maps:** enabled
**TSConfig:** `tsconfig.build.json` (production build, excludes tests)

The `_config` → `+config` rename is a workaround for esbuild's filename sanitization. The `clean: false` option prevents `vp pack` from deleting files between builds (the rename happens after clean would have run).

---

## 9. Design Decisions

### 9.1 No File Generation on Disk

**What was considered:** Writing a generated runner file to `.vike-plugins/runner.mjs` during build.

**Why rejected:**
- Requires cleanup scripts
- Race conditions between builds
- Stale files after `git clean`
- Vite virtual modules are the idiomatic pattern

**Solution:** The virtual module (`virtual:vike-plugins`) exists only in Vite's in-memory module graph. The static runner loads it dynamically at runtime. Zero disk writes from the plugin.

### 9.2 Framework-Agnostic Core

The package has zero Vue, React, Solid, or framework-specific dependencies. The `VikePlugin` interface only depends on `{ isServer: boolean }`. Framework-specific behavior (e.g., serializing Vue `ref`s) would be a separate entrypoint — the core runner doesn't care what framework the user is using.

### 9.3 Import String Pattern (not Inlined Config)

**Why not directly set `onCreatePageContext` in the user's `+config.ts`?**

That would require the user to manually import and wire the runner — defeating the zero-boilerplate goal. The `extends` + import string pattern moves the wiring into the package itself. User just adds `extends: [vikePluginsConfig]` and drops files into the scanned directory.

### 9.4 Alphabetical Name Tiebreaker

When two plugins have the same `enforce` group and `order`, they're sorted by `name`. This gives a deterministic fallback that's easy to reason about (and doesn't depend on filesystem order, which varies across OSes).

---

## 10. Limitations & Edge Cases

### 10.1 Virtual Module Not Resolvable at Config Time

`import('virtual:vike-plugins')` only works inside Vite's SSR module loader. It cannot be resolved by Node's `require.resolve()` or by static analysis tools. The runner's dynamic import pattern works around this, but tools that statically analyze imports (e.g., bundlers wrapping the runner) may warn or error.

### 10.2 Plugin Files Must Default-Export a VikePlugin

The virtual module's generated code does `import _mod_0 from '...'` — it reads the default export. Named exports are ignored. Plugin files that don't have a default export will produce an empty object, which will fail silently at runtime (no `name`, no `setup`).

### 10.3 Undefined Plugin Names

If a plugin omits `name` AND is generated with an unsanitizable filename (e.g., only non-`[a-zA-Z0-9]` characters), the inferred name will be an empty string. This could cause sorting issues (empty strings sort before any non-empty string). In practice, filenames like `auth.ts` produce `auth` — safe.

### 10.4 Fire-and-Forget Error Handling

Plugins with `await: false` are fire-and-forget. If their promise rejects, the error becomes an unhandled promise rejection. There is no mechanism to catch or surface these errors to the caller of `runPlugins()`.

### 10.5 No Payload Serialization (Yet)

The current implementation does not serialize state between server and client (no `useState`, no serializer pipeline). A plugin's `setup()` runs independently on server and client with no shared state. The `PluginContext` only has `isServer` — it does not carry serialized data. This is a planned feature (see PLAN.MD for the `useState` and serializer design).

### 10.6 Watch Requires Dev Server

HMR only works with `vike dev` (Vite dev server). In production (`vike build`), the virtual module is generated once at build time and used as-is. File changes during a production build are not watched.
