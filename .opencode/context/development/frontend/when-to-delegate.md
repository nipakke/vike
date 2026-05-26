<!-- Context: development/frontend/when-to-delegate | Priority: high | Version: 1.0 | Updated: 2026-05-26 -->
# When to Delegate to Frontend Specialist

## Overview

Clear decision criteria for when to delegate frontend/UI work to the **frontend-specialist** subagent vs. handling it directly.

## Quick Reference

**Delegate to frontend-specialist when**:
- Complex UI/UX design work
- Design system implementation
- Complex responsive layouts
- Animation and micro-interactions
- Visual design iterations

**Handle directly when**:
- Simple HTML/CSS edits
- Single component updates
- Bug fixes in existing UI
- Minor styling tweaks

---

## How to Delegate

### Step 1: Propose Approach

Present a plan to the user:

```markdown
## Implementation Plan

**Task**: [brief description]

**Approach**: Delegate to frontend-specialist subagent

**Why**: 
- Requires UI design work
- Needs responsive layout
- Includes animations

**Approval needed before proceeding.**
```

### Step 2: Get Approval

Wait for explicit user approval before delegating.

### Step 3: Delegate

```javascript
task(
  subagent_type="frontend-specialist",
  description="[brief description]",
  prompt="Task: [detailed requirements]
  Requirements:
  - [specific requirements]
  - Mobile-first responsive
  - Follow staged workflow and request approval between stages."
)
```

---

## Red Flags (Don't Delegate)

- User just wants a quick fix → Handle directly
- Task is backend/logic focused → Wrong subagent (use coder-agent)
- Task is a single line change → Handle directly
- Task is content update → Handle directly
- Task is testing/validation → Use tester
- Task is code review → Use reviewer

## Green Flags (Delegate)

- User wants a new UI design → Delegate
- Task involves design systems → Delegate
- Task requires responsive layouts → Delegate
- Task includes animations → Delegate
- Task needs UI library integration → Delegate

---

## Related Context

- **Frontend Specialist Agent** → `../../../agent/subagents/development/frontend-specialist.md`
- **Delegation Workflow** → `../../core/workflows/task-delegation-basics.md`
