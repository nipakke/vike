<!-- Context: workflows/external-libraries-scenarios | Priority: medium | Version: 1.0 | Updated: 2026-02-05 -->
# External Libraries: Common Scenarios

**Purpose**: Real-world examples of using ExternalScout

---

## Scenario 1: New Build with External Packages

**Example**: Vike app with authentication

**Process:**
1. Check install scripts: `ls scripts/install/`
2. Identify packages: Vike, React/Vue/Solid, auth library
3. ExternalScout for relevant packages
4. Check requirements: Env vars?
5. Verify version compatibility
6. Implement following current docs
7. Test integration points

**ExternalScout calls:**
```javascript
// Vike
task(
  subagent_type="ExternalScout",
  description="Fetch Vike docs",
  prompt="Fetch Vike docs: setup and configuration
  Focus on: Installation | Routing | Data fetching | SSR
  Context: Building a Vike app"
)

// Auth library
task(
  subagent_type="ExternalScout",
  description="Fetch auth library docs",
  prompt="Fetch current docs for auth integration
  Focus on: Installation | Vike/React integration | Session mgmt
  Context: Adding auth to Vike app"
)
```

---

## Scenario 2: Package Error During Build

**Example**: `Error: Cannot find module 'vike'`

**Process:**
1. Identify package: Vike
2. ExternalScout: "Fetch Vike docs: installation and imports"
3. Check current import patterns
4. Verify package.json has correct deps
5. Propose fix from current docs
6. Request approval → Apply fix

---

## Scenario 3: First-Time Package Setup

**Example**: Setting up a UI library in Vike

**Process:**
1. Check install scripts
2. ExternalScout: "Fetch UI lib docs: Vike/Vue integration"
3. Get: Install steps | Peer deps | Config | Patterns
4. If install script exists: Review → Run
5. If no script: Follow docs for manual setup
6. Implement → Test

---

## Scenario 4: Version Upgrade

**Example**: Vike 0.4 → 0.5

**Process:**
1. ExternalScout: "Fetch Vike docs: Breaking changes and migration"
2. Review breaking changes
3. Identify affected code
4. Plan migration steps
5. Request approval → Implement → Test

---

## Real-World Example: Data-Fetching Integration

**Task**: "Add data fetching with SSR to Vike app"

```javascript
// 1. ContextScout: Project standards
task(
  subagent_type="ContextScout",
  description="Find coding standards",
  prompt="Find context files: Code quality | Security patterns"
)
// Returns: security-patterns.md, code-quality.md

// 2. ExternalScout: Vike docs (MANDATORY)
task(
  subagent_type="ExternalScout",
  description="Fetch Vike data fetching docs",
  prompt="Fetch Vike docs: data fetching and SSR patterns
  Focus on: useData | Page data | Server-side rendering
  Context: Adding data fetching to Vike app"
)
// Returns: Installation | Integration patterns | Working examples

// 3. Combine and implement
// - Vike patterns (from ExternalScout)
// - Code standards (from ContextScout)
// = Well-structured data fetching ✅
```

---

## Error Handling Patterns

| Error Type | Process |
|------------|---------|
| **Package Installation** | ExternalScout: installation docs → Verify package name/version → Check peer deps |
| **Import/Module** | ExternalScout: import patterns → Check current API exports |
| **API/Configuration** | ExternalScout: API docs → Check current signatures |
| **Build Errors** | Identify package → ExternalScout: relevant docs → Check known issues |

---

## Related

- `external-libraries-workflow.md` - Core workflow
- `external-libraries-faq.md` - Troubleshooting FAQ
