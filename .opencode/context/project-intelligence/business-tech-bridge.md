<!-- Context: project-intelligence/bridge | Priority: medium | Version: 2.0 | Updated: 2026-05-26 -->

# Business-Tech Bridge — @nipakke/vike

> How business needs map to technical solutions.

## Mapping

| Business Need | Technical Solution | Implementation |
|--------------|-------------------|----------------|
| Nuxt UI works with Vike | Vike extension package | `packages/nuxt-ui/` bridges Vike SSR + Nuxt UI components |
| Easy to test integrations | Playground apps | `playgrounds/` provide real Vike apps for each package |
| Simple dependency management | pnpm catalog | Centralized `catalog:` versions in `pnpm-workspace.yaml` |
| Automated releases | Changesets | `pnpm changeset` → version → publish |

## Core Workflows

**Adding a new integration**:
1. Create new package in `packages/`
2. Add playground in `playgrounds/`
3. Register in workspace
4. Test with `turbo dev`
5. Release with Changesets

**Updating deps**:
1. Update version in `pnpm-workspace.yaml` catalog
2. Run `pnpm install`
3. Build and test with `turbo build`

## Related Files

- `technical-domain.md` - Stack and architecture
- `business-domain.md` - Why this project exists
