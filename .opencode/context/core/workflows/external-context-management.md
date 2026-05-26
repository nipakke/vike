<!-- Context: workflows/external-context | Priority: high | Version: 1.0 | Updated: 2026-01-28 -->
# External Context Management

## Overview

External context is live documentation fetched from external libraries and frameworks (via Context7 API or official docs). Instead of re-fetching on every task, we **persist external context** to `.tmp/external-context/` so main agents can pass it to subagents.

**Key Principle**: ExternalScout fetches once → persists to disk → main agents reference → subagents read (no re-fetching)

---

## Directory Structure

```
.tmp/external-context/
├── .manifest.json                    # Metadata about all cached external docs
├── vike/
│   ├── routing-setup.md             # Fetched: "Page routing configuration"
│   ├── data-fetching.md             # Fetched: "SSR data fetching patterns"
│   └── configuration.md             # Fetched: "Vike config and hooks"
├── tailwindcss/
│   ├── configuration.md             # Fetched: "Tailwind CSS setup"
│   └── customization.md             # Fetched: "Theme customization"
└── vue/
    ├── composition-api.md           # Fetched: "Composition API patterns"
    └── components.md                # Fetched: "Component architecture"
```

### Naming Conventions

- **Package name** (directory): Exact npm package name (kebab-case)
  - ✅ `vike`, `tailwindcss`, `zod`
  - ❌ `vikejs`, `tailwind`, `z`

- **File name** (topic): Kebab-case description of the topic
  - ✅ `routing-setup.md`, `data-fetching.md`, `configuration.md`
  - ❌ `routing setup.md`, `DataFetching.md`, `Configuration.md`

---

## Manifest File

**Location**: `.tmp/external-context/.manifest.json`

**Purpose**: Track what's cached, when it was fetched, and from which source

**Structure**:
```json
{
  "last_updated": "2026-01-28T14:30:22Z",
  "packages": {
    "vike": {
      "files": [
        "routing-setup.md",
        "data-fetching.md",
        "configuration.md"
      ],
      "last_updated": "2026-05-26T12:00:00Z",
      "source": "Context7 API",
      "official_docs": "https://vike.dev"
    },
    "tailwindcss": {
      "files": [
        "configuration.md",
        "customization.md"
      ],
      "last_updated": "2026-05-26T11:55:00Z",
      "source": "Context7 API",
      "official_docs": "https://tailwindcss.com/docs"
    }
  }
}
```

---

## File Format

Each external context file has a metadata header followed by the documentation content.

**Template**:
```markdown
---
source: Context7 API
library: Vike
package: vike
topic: routing-setup
fetched: 2026-05-26T12:00:00Z
official_docs: https://vike.dev
---

# Vike — Routing and Page Configuration

[Filtered documentation content from Context7 API]

## Key Concepts

[Relevant sections only]

## Code Examples

[Practical examples from official docs]

---

**Source**: Context7 API (live, version-specific)
**Official Docs**: https://vike.dev
**Fetched**: 2026-05-26T12:00:00Z
```

---

## Workflow: How External Context Flows

### Stage 1: Main Agent Needs External Context

```
Main Agent (e.g., OpenAgent)
  ↓
  Detects: "User is asking about Vike + Tailwind CSS + Vue"
  ↓
  Calls: ExternalScout to fetch live docs
```

### Stage 2: ExternalScout Fetches & Persists

```
ExternalScout
  ↓
  1. Detects libraries: Vike, Tailwind CSS, Vue
  ↓
  2. Fetches from Context7 API (primary) or official docs (fallback)
  ↓
  3. Filters to relevant sections
  ↓
  4. Persists to .tmp/external-context/{package-name}/{topic}.md
  ↓
  5. Updates .manifest.json
  ↓
  Returns: File paths + formatted documentation
```

### Stage 3: Main Agent References in Session Context

```
Main Agent
  ↓
  Creates session: .tmp/sessions/{session-id}/context.md
  ↓
  Adds section: "## External Context Fetched"
  ↓
  Lists files:
    - .tmp/external-context/vike/routing-setup.md
    - .tmp/external-context/tailwindcss/configuration.md
    - .tmp/external-context/vue/composition-api.md
  ↓
  Delegates to TaskManager with session path
```

### Stage 4: Subagents Read External Context

```
TaskManager (or CoderAgent, TestEngineer, etc.)
  ↓
  Reads: .tmp/sessions/{session-id}/context.md
  ↓
  Extracts: "## External Context Fetched" section
  ↓
  Reads: .tmp/external-context/{package-name}/{topic}.md files
  ↓
  Uses: External docs to inform implementation
  ↓
  NO RE-FETCHING needed ✅
```

---

## Integration with Task Delegation

### In Session Context File

Add this section to `.tmp/sessions/{session-id}/context.md`:

```markdown
## External Context Fetched

These are live documentation files fetched from external libraries. Subagents should reference these instead of re-fetching.

### Vike
- `.tmp/external-context/vike/routing-setup.md` — Page routing and configuration
- `.tmp/external-context/vike/data-fetching.md` — SSR data fetching patterns

### Tailwind CSS
- `.tmp/external-context/tailwindcss/configuration.md` — Setup and customization

### Vue
- `.tmp/external-context/vue/composition-api.md` — Composition API patterns

**Important**: These files are read-only and should not be modified. They're cached for reference only.
```

### In Subtask JSONs (Created by TaskManager)

When TaskManager creates subtask JSONs, it should include external context files:

```json
{
  "id": "01-vike-routing-setup",
  "title": "Set up Vike page routing",
  "context_files": [
    ".opencode/context/core/standards/code-quality.md",
    ".opencode/context/core/standards/test-coverage.md"
  ],
  "reference_files": [
    "package.json",
    "packages/nuxt-ui/src/"
  ],
  "external_context": [
    ".tmp/external-context/vike/routing-setup.md",
    ".tmp/external-context/vike/data-fetching.md"
  ],
  "instructions": "Set up Vike page routing following patterns from external context..."
}
```

---

## Cleanup & Maintenance

### When to Clean Up

External context files should be cleaned up when:
1. Task is complete and session is deleted
2. External docs become stale (>7 days old)
3. User explicitly requests cleanup
4. Disk space is needed

### How to Clean Up

**Manual cleanup** (ask user first):
```bash
rm -rf .tmp/external-context/{package-name}/
# Update .manifest.json to remove package entry
```

**Automatic cleanup** (future enhancement):
- Add cleanup script that removes files older than 7 days
- Run as part of session cleanup process
- Update manifest after cleanup

### Manifest Cleanup

After deleting external context files, update `.manifest.json`:
```json
{
  "last_updated": "2026-01-28T15:00:00Z",
  "packages": {
    // Remove entries for deleted packages
  }
}
```

---

## Best Practices

### For Main Agents (OpenAgent, etc.)

1. **Call ExternalScout early** in the planning phase
2. **Capture returned file paths** from ExternalScout
3. **Add to session context** in "## External Context Fetched" section
4. **Pass session path to subagents** so they know where to find external docs
5. **Don't re-fetch** — trust that ExternalScout persisted correctly

### For ExternalScout

1. **Always persist** fetched documentation to `.tmp/external-context/`
2. **Update manifest** after each fetch
3. **Include metadata header** in every file (source, library, package, topic, fetched timestamp)
4. **Filter aggressively** — only include relevant sections
5. **Cite sources** — include official docs links

### For Subagents (TaskManager, CoderAgent, etc.)

1. **Read external context files** from session context
2. **Don't re-fetch** — use persisted files
3. **Reference in implementation** — cite which external docs informed decisions
4. **Don't modify** external context files — they're read-only
5. **Include in subtask JSONs** — pass external_context to downstream agents

---

## Examples

### Example 1: Vike + Tailwind CSS Setup

**Main Agent Flow**:
```
1. User asks: "Set up Vike with Tailwind CSS"
2. Main agent calls ExternalScout
3. ExternalScout fetches:
   - vike/routing-setup.md
   - vike/data-fetching.md
   - tailwindcss/configuration.md
4. ExternalScout persists all files to .tmp/external-context/
5. Main agent creates session with "## External Context Fetched" section
6. Main agent delegates to TaskManager with session path
7. TaskManager reads external context, creates subtasks
8. CoderAgent implements using external docs (no re-fetching)
```

**Session Context File**:
```markdown
## External Context Fetched

### Vike
- `.tmp/external-context/vike/routing-setup.md`
- `.tmp/external-context/vike/data-fetching.md`

### Tailwind CSS
- `.tmp/external-context/tailwindcss/configuration.md`
```

### Example 2: SSR Data Fetching with Vike

**Main Agent Flow**:
```
1. User asks: "How do I do SSR data fetching with Vike?"
2. Main agent calls ExternalScout
3. ExternalScout fetches:
   - vike/data-fetching.md
   - vike/configuration.md
4. ExternalScout persists to .tmp/external-context/
5. Main agent creates session with external context references
6. Subagents read and implement using external docs
```

---

## Troubleshooting

### External Context Files Not Found

**Problem**: Subagent can't find `.tmp/external-context/{package-name}/{topic}.md`

**Solution**:
1. Check that ExternalScout ran successfully
2. Verify file path in session context matches actual file location
3. Check `.manifest.json` to see what's cached
4. If missing, re-run ExternalScout to fetch and persist

### Stale External Context

**Problem**: External docs are outdated (>7 days old)

**Solution**:
1. Delete stale files: `rm -rf .tmp/external-context/{package-name}/`
2. Update `.manifest.json`
3. Re-run ExternalScout to fetch fresh docs
4. Update session context with new file paths

### Manifest Out of Sync

**Problem**: `.manifest.json` doesn't match actual files

**Solution**:
1. Regenerate manifest by listing actual files:
   ```bash
   find .tmp/external-context -name "*.md" | sort
   ```
2. Update `.manifest.json` to match
3. Verify all files have metadata headers

---

## References

- **ExternalScout**: `.opencode/agent/subagents/core/externalscout.md` — Fetches and persists external docs
- **Task Delegation**: `.opencode/context/core/workflows/task-delegation-basics.md` — How to reference external context in sessions
- **Session Management**: `.opencode/context/core/workflows/session-management.md` — Session lifecycle
- **Library Registry**: `.opencode/skills/context7/library-registry.md` — Supported libraries and query patterns
