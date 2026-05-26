<!-- Context: project-intelligence/technical | Priority: high | Version: 2.0 | Updated: 2026-05-26 -->

# Technical Domain — @nipakke/vike

> Vike extensions and integrations monorepo.

## Quick Reference

- **Purpose**: Build Vike integrations for Nuxt UI and other frameworks
- **Update When**: New packages, architecture changes, dependency updates
- **Audience**: Developers maintaining or extending Vike integrations

## Primary Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | TypeScript | ^6.0 | Type safety across monorepo |
| Framework | Vike (vike.dev) | ^0.4.259 | SSR framework for frontend integrations |
| Build | Vite | ^8 | Fast dev/build for Vike plugins |
| Monorepo | Turborepo + pnpm | ^2.6 / 10.x | Scalable monorepo with caching |
| UI | Nuxt UI | ^4.8 | Component library integration target |
| Server | h3 | ~1.15 | Minimal HTTP framework for server-side |
| Styling | Tailwind CSS | ^4.2 | Utility-first CSS for UI components |
| Testing | Vitest | latest | Fast unit/integration tests |
| Runtime | Vue | ^3.5.32 | UI framework for integrations |

## Architecture Pattern

```
Type: Monorepo
Pattern: Package-based monorepo with Vike extension packages
```

### Why This Architecture?

- **Separation of concerns**: Each Vike integration is its own package
- **Independent versioning**: Packages version independently via Changesets
- **Shared dev tooling**: Turborepo + pnpm catalog for unified dependency management
- **Playground-driven development**: playgrounds/ for testing integrations in real apps

## Project Structure

```
@nipakke/vike/
├── packages/
│   └── nuxt-ui/            # @nipakke/vike-nuxt-ui — Nuxt UI integration
├── playgrounds/            # Test apps for each integration
├── package.json            # Root monorepo config
├── pnpm-workspace.yaml     # Workspace + catalog config
├── turbo.json              # Turborepo pipeline
└── vite.config.ts          # Shared Vite config
```

**Key Directories**:
- `packages/nuxt-ui/` - Main package: Vike + Nuxt UI integration
- `playgrounds/` - Dev/test applications for packages

## Key Technical Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| pnpm workspace catalogs | Unified dependency versions across packages | Single source of truth for versions |
| Changesets for releases | Automated CHANGELOG + semver | Streamlined publishing |
| Vike as SSR layer | Framework-agnostic, works with Vue/React/Solid | Flexible integration target |
| h3 server | Lightweight, composable HTTP for server-side rendered pages | Minimal overhead for SSR |

## Development Environment

```
Setup: pnpm install
Dev:   pnpm dev:ui (runs nuxt-ui playground)
Build: pnpm build
Test:  pnpm check
```

## Deployment

```
Release: pnpm changeset → pnpm version → pnpm release
CI:     GitHub Actions + Turborepo
```

## Related Files

- `business-domain.md` - Why these integrations exist
- `decisions-log.md` - Full decision history
