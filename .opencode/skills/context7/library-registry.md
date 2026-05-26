# External Library Registry

## Purpose

This file lists external libraries/frameworks that should use **ExternalScout** (via Context7) for live documentation instead of relying on potentially outdated training data.

## When to Use This

**ContextScout** checks this list when:
1. User asks about a library/framework
2. No internal context exists in `.opencode/context/`
3. Query matches a library name below

**Action**: Recommend **ExternalScout** subagent

---

## Supported Libraries

### Frontend Frameworks

#### Vike
- **Aliases**: `vike`, `vikejs`, `vike.js`
- **Docs**: https://vike.dev
- **Context7**: `use context7 for vike` (library ID: `/vikejs/vike`)
- **Common topics**: SSR, routing, data fetching, page architecture, hooks, configuration, file conventions

#### React
- **Aliases**: `react`, `reactjs`, `react.js`
- **Docs**: https://react.dev/
- **Context7**: `use context7 for react`
- **Common topics**: hooks, components, state, effects, context

#### Vue
- **Aliases**: `vue`, `vuejs`, `vue.js`
- **Docs**: https://vuejs.org/
- **Context7**: `use context7 for vue`
- **Common topics**: composition API, components, reactivity, SFC

#### Solid
- **Aliases**: `solid`, `solidjs`, `solid.js`
- **Docs**: https://solidjs.com/
- **Context7**: `use context7 for solid`
- **Common topics**: signals, components, reactivity, JSX

---

### Frontend & UI

#### Tailwind CSS
- **Aliases**: `tailwind`, `tailwindcss`, `tailwind css`
- **Docs**: https://tailwindcss.com/docs
- **Context7**: `use context7 for tailwind`
- **Common topics**: configuration, utilities, responsive design, dark mode

#### Nuxt UI
- **Aliases**: `nuxt-ui`, `@nuxt/ui`, `nuxt ui`
- **Docs**: https://ui.nuxt.com
- **Context7**: `use context7 for nuxt ui`
- **Common topics**: components, theming, customization, Vue integration

---

### State Management

#### Zustand
- **Aliases**: `zustand`
- **Docs**: https://zustand-demo.pmnd.rs/
- **Context7**: `use context7 for zustand`
- **Common topics**: store creation, selectors, middleware, TypeScript

#### Pinia
- **Aliases**: `pinia`
- **Docs**: https://pinia.vuejs.org/
- **Context7**: `use context7 for pinia`
- **Common topics**: store, state, getters, actions, Vue

---

### Validation

#### Zod
- **Aliases**: `zod`
- **Docs**: https://zod.dev/
- **Context7**: `use context7 for zod`
- **Common topics**: schema validation, TypeScript inference, parsing, refinements

---

### Testing

#### Vitest
- **Aliases**: `vitest`
- **Docs**: https://vitest.dev/
- **Context7**: `use context7 for vitest`
- **Common topics**: configuration, testing, mocking, coverage

---

## Detection Patterns

ContextScout and ExternalScout should match queries containing:
- Library name (case-insensitive)
- Common variations (e.g., "next.js" vs "nextjs")
- Package names (e.g., "@tanstack/react-query")

**Examples**:
- "How do I set up **Vike** routing?" → Match: Vike
- "**React** hooks patterns" → Match: React
- "**Vue** composition API" → Match: Vue
- "**Zod** schema validation" → Match: Zod

---

## Query Optimization Patterns

### Vike

| User Intent | Optimized Query |
|-------------|-----------------|
| Setup | `getting+started+setup+installation+configuration+TypeScript` |
| Routing | `routing+page+configuration+files+conventions+parameters` |
| Data fetching | `data+fetching+SSR+async+page+data+useData` |
| SSR/SSG | `SSR+SSG+rendering+modes+hydration+server+side` |
| Configuration | `vike+config+configuration+options+hooks+extensions` |
| TypeScript | `TypeScript+types+inference+props+page+context` |

---

## Adding New Libraries

To add a new library:
1. Add entry under appropriate category
2. Include: Name, aliases, docs link, Context7 command, common topics
3. (Optional) Add query optimization patterns
4. Update ExternalScout if needed (usually automatic)

**Template**:
```markdown
#### Library Name
- **Aliases**: `alias1`, `alias2`, `package-name`
- **Docs**: https://example.com/docs
- **Context7**: `use context7 for library-name`
- **Common topics**: topic1, topic2, topic3
```

---

## Usage by ExternalScout

ExternalScout uses this file to:
1. **Detect** which library the user is asking about
2. **Load** query optimization patterns for that library
3. **Build** optimized Context7 queries
4. **Fetch** live documentation
5. **Return** filtered, relevant results
