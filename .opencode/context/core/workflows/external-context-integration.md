<!-- Context: workflows/external-context-integration | Priority: high | Version: 1.0 | Updated: 2026-01-28 -->
# External Context Integration Guide

## Overview

This guide explains how to integrate external context (fetched via ExternalScout) into the main agent workflow so that subagents can access it without re-fetching.

**Key Principle**: Main agents fetch external docs once → persist to disk → reference in session → subagents read (no re-fetching)

---

## When to Use External Context

Use ExternalScout to fetch external context when:

1. **User asks about external libraries** (Vike, React, Vue, Tailwind, Zod, etc.)
2. **Task involves integration** between multiple external libraries
3. **Setup or configuration** of external tools is needed
4. **API patterns or best practices** from external libraries are relevant

**Don't use** when:
- Question is about internal project code
- Answer is in `.opencode/context/` (use ContextScout instead)
- User is asking for general programming concepts

---

## Integration Workflow

### Stage 1: Analyze & Discover (Before Approval)

```
Main Agent (OpenAgent, etc.)
  ↓
  1. Analyze user request
  ↓
  2. Identify external libraries mentioned
  ↓
  3. Call ContextScout for internal context
  ↓
  4. Call ExternalScout for external docs
     - ExternalScout fetches from Context7 API
     - ExternalScout persists to .tmp/external-context/
     - ExternalScout returns file paths
  ↓
  5. Capture returned file paths
  ↓
  6. Do NOT write anything to disk yet
```

### Stage 2: Propose Plan (Before Approval)

```
Main Agent
  ↓
  1. Show user lightweight summary:
     - What will be done
     - Which external libraries involved
     - Which context files will be used
  ↓
  2. Include discovered external context files in proposal
  ↓
  3. Wait for user approval
```

### Stage 3: Approve (User Gate)

```
User
  ↓
  Approves plan (or redirects)
```

### Stage 4: Init Session (After Approval)

```
Main Agent
  ↓
  1. Create .tmp/sessions/{session-id}/context.md
  ↓
  2. Populate sections:
     - ## Context Files (from ContextScout)
     - ## Reference Files (project files)
     - ## External Context Fetched (from ExternalScout)
     - ## Components
     - ## Constraints
     - ## Exit Criteria
  ↓
  3. CRITICAL: Add "## External Context Fetched" section with:
     - File paths returned by ExternalScout
     - Brief description of each file
     - Note that files are read-only
```

### Stage 5: Delegate with Context Path

```
Main Agent
  ↓
  1. Call TaskManager (or other subagent)
  ↓
  2. Pass session path in prompt:
     "Load context from .tmp/sessions/{session-id}/context.md"
  ↓
  3. TaskManager reads session context
  ↓
  4. TaskManager extracts external context files
  ↓
  5. TaskManager includes in subtask JSONs
```

### Stage 6: Subagents Read External Context

```
TaskManager / CoderAgent / TestEngineer
  ↓
  1. Read session context file
  ↓
  2. Extract "## External Context Fetched" section
  ↓
  3. Read referenced files from .tmp/external-context/
  ↓
  4. Use external docs to inform implementation
  ↓
  5. NO RE-FETCHING ✅
```

---

## Implementation Details

### Step 1: Call ExternalScout

In your main agent (before approval):

```javascript
// Detect external libraries from user request
const externalLibraries = ["vike", "vue", "tailwindcss", "zod"];

// Call ExternalScout
task(
  subagent_type="ExternalScout",
  description="Fetch external documentation",
  prompt="Fetch documentation for these libraries:
          - Vike: page routing and SSR setup
          - Better Auth: Next.js integration
          - Next.js: App Router setup
          
          Persist fetched docs to .tmp/external-context/
          Return file paths for each fetched document"
)

// Capture returned file paths
// Example return:
// - .tmp/external-context/vike/routing-setup.md
// - .tmp/external-context/tailwindcss/configuration.md
// - .tmp/external-context/vue/composition-api.md
```

### Step 2: Propose Plan with External Context

```markdown
## Implementation Plan

**Task**: Set up Vike with Tailwind CSS and Vue

**External Libraries Involved**:
- Vike (SSR framework)
- Tailwind CSS (styling)
- Vue (UI framework)

**External Context Discovered**:
- `.tmp/external-context/vike/routing-setup.md`
- `.tmp/external-context/tailwindcss/configuration.md`
- `.tmp/external-context/vue/composition-api.md`

**Approach**:
1. Configure Vike with Vue integration
2. Set up Tailwind CSS
3. Create page components

**Approval needed before proceeding.**
```

### Step 3: Create Session with External Context

After approval, create `.tmp/sessions/{session-id}/context.md`:

```markdown
# Task Context: Vike + Tailwind CSS Setup

Session ID: 2026-05-26-vike-setup
Created: 2026-05-26T12:00:00Z
Status: in_progress

## Current Request
Set up Vike with Tailwind CSS and Vue in a monorepo

## Context Files (Standards to Follow)
- .opencode/context/core/standards/code-quality.md
- .opencode/context/core/standards/test-coverage.md

## Reference Files (Source Material)
- package.json
- packages/nuxt-ui/src/ (existing)

## External Context Fetched
These are live documentation files fetched from external libraries. Subagents should reference these instead of re-fetching.

### Vike
- `.tmp/external-context/vike/routing-setup.md` — Page routing and configuration
- `.tmp/external-context/vike/data-fetching.md` — SSR data fetching patterns

### Tailwind CSS
- `.tmp/external-context/tailwindcss/configuration.md` — Setup and customization

**Important**: These files are read-only and cached for reference. Do not modify them.

## Components
- Vike page routing setup
- Tailwind CSS integration
- Vue component structure

## Constraints
- TypeScript strict mode
- Monorepo with pnpm workspaces
- Turborepo build pipeline

## Exit Criteria
- [ ] Vike configured with Vue
- [ ] Tailwind CSS integrated
- [ ] Page components working
- [ ] All tests passing
- [ ] Documentation updated

## Progress
- [ ] Session initialized
- [ ] Tasks created
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Handoff complete
```

### Step 4: Delegate to TaskManager

```javascript
task(
  subagent_type="TaskManager",
  description="Break down Vike + Tailwind CSS setup",
  prompt="Load context from .tmp/sessions/2026-05-26-vike-setup/context.md

          Read the context file for full requirements, standards, and external documentation.
          
          Break down this feature into atomic subtasks:
          1. Vike routing and page configuration
          2. Tailwind CSS setup
          3. Vue component integration
          4. Test suite
          
          For each subtask, include:
          - context_files: Standards from context.md
          - reference_files: Project files to understand
          - external_context: External docs to reference
          
           Create subtask files in tasks/subtasks/vike-setup/"
)
```

### Step 5: TaskManager Creates Subtasks with External Context

TaskManager creates subtask JSONs like:

```json
{
  "id": "01-vike-routing-setup",
  "title": "Set up Vike routing and pages",
  "description": "Configure Vike page routing following best practices",
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
  "instructions": "Set up Vike routing following patterns from external context. Reference .tmp/external-context/vike/routing-setup.md for best practices.",
  "acceptance_criteria": [
    "Pages properly configured with Vike routing",
    "SSR data fetching working",
    "TypeScript types properly used",
    "Tests cover page setup"
  ]
}
```

### Step 6: CoderAgent Implements Using External Context

CoderAgent reads subtask JSON and:

1. Loads context_files (standards)
2. Reads reference_files (existing code)
3. **Reads external_context files** (external docs)
4. Implements following all standards and external docs
5. Returns completed subtask

---

## Best Practices

### For Main Agents

✅ **DO**:
- Call ExternalScout early in planning phase
- Capture returned file paths
- Add to session context under "## External Context Fetched"
- Pass session path to subagents
- Include external context in proposal to user

❌ **DON'T**:
- Forget to call ExternalScout when external libraries involved
- Skip adding external context to session
- Re-fetch external docs (trust ExternalScout persistence)
- Modify external context files

### For ExternalScout

✅ **DO**:
- Always persist fetched docs to `.tmp/external-context/`
- Update `.manifest.json` after each fetch
- Include metadata header in every file
- Filter aggressively to relevant sections
- Cite sources and include official docs links

❌ **DON'T**:
- Forget to persist files
- Skip manifest updates
- Return entire documentation
- Fabricate documentation content
- Write outside `.tmp/external-context/`

### For TaskManager

✅ **DO**:
- Extract external_context from session context
- Include in subtask JSONs
- Pass to downstream agents
- Document which external docs informed decisions

❌ **DON'T**:
- Forget to include external_context in subtasks
- Mix external_context with context_files
- Assume subagents will re-fetch

### For Subagents (CoderAgent, TestEngineer, etc.)

✅ **DO**:
- Read external_context files from subtask JSON
- Use external docs to inform implementation
- Reference external docs in comments
- Follow patterns from external docs

❌ **DON'T**:
- Re-fetch external documentation
- Ignore external context files
- Modify external context files
- Assume external docs are optional

---

## Example: Complete Flow

### User Request
```
"Set up Drizzle ORM with Better Auth in Next.js, using modular schema organization"
```

### Main Agent Flow

1. **Analyze**: Detect Drizzle, Better Auth, Next.js
2. **Discover**: Call ContextScout + ExternalScout
3. **Propose**: Show plan with external context files
4. **Approve**: User approves
5. **Init Session**: Create context.md with external context section
6. **Delegate**: Call TaskManager with session path
7. **Validate**: Check tests pass
8. **Complete**: Update docs, cleanup

### ExternalScout Flow

1. **Detect**: Drizzle, Better Auth, Next.js
2. **Fetch**: Get docs from Context7 API
3. **Filter**: Extract relevant sections
4. **Persist**: Write to `.tmp/external-context/{package}/{topic}.md`
5. **Update**: Add to `.manifest.json`
6. **Return**: File paths to main agent

### TaskManager Flow

1. **Read**: Session context.md
2. **Extract**: External context files
3. **Create**: Subtasks with external_context field
4. **Delegate**: Pass to CoderAgent

### CoderAgent Flow

1. **Read**: Subtask JSON
2. **Load**: context_files (standards)
3. **Reference**: reference_files (existing code)
4. **Read**: external_context files (external docs)
5. **Implement**: Following all standards and external docs
6. **Complete**: Return implemented subtask

---

## Troubleshooting

### External Context Files Not Found

**Problem**: Subagent can't find `.tmp/external-context/{package}/{topic}.md`

**Solution**:
1. Check ExternalScout ran successfully
2. Verify file path in session context matches actual location
3. Check `.manifest.json` to see what's cached
4. If missing, re-run ExternalScout

### Stale External Context

**Problem**: External docs are outdated

**Solution**:
1. Delete stale files: `scripts/external-context/manage-external-context.sh delete-package {package}`
2. Re-run ExternalScout to fetch fresh docs
3. Update session context with new file paths

### Manifest Out of Sync

**Problem**: `.manifest.json` doesn't match actual files

**Solution**:
1. Regenerate manifest: `scripts/external-context/manage-external-context.sh regenerate-manifest`
2. Verify all files have metadata headers

---

## References

- **ExternalScout**: `.opencode/agent/subagents/core/externalscout.md`
- **External Context Management**: `.opencode/context/core/workflows/external-context-management.md`
- **Task Delegation**: `.opencode/context/core/workflows/task-delegation-basics.md`
- **Management Script**: `scripts/external-context/manage-external-context.sh`
