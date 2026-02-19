# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Stock Analyzer — a new project using Firebase. Codebase is currently empty and under initial setup.

## Infrastructure

- Firebase is configured (firebase-debug.log present)
## Feature Development Workflow

For non-trivial changes, follow this workflow. Skip to step 3 for small edits.

### 0. Discover — `/agentic-coding:writing-vision-briefs`

For fuzzy or early-stage ideas, use the `/agentic-coding:writing-vision-briefs` slash command to create a Vision Brief before writing a PRD. It:
- Walks you through the problem, users, vision, capabilities, and success criteria in plain language
- Assesses the scope — is this one feature or multiple?
- Breaks bigger visions into **epics** (major themes) and **features** (individual buildable pieces)
- Creates `type:epic` GitHub issues for each epic
- Recommends which feature to build first
- Saves everything to `specs/[name]-vision.md`

If the vision is small enough to be a single feature, the breakdown is skipped.

Record architectural decisions about scope or direction (see [Architecture Decision Records](#architecture-decision-records) below).

**Skip this step if** you already know exactly what single feature you want to build. Go straight to Step 1.

### 1. Define — `/agentic-coding:writing-feature-prds`

Use the `/agentic-coding:writing-feature-prds` slash command to create a PRD for **one feature**. It will:
- Check if you're coming from a Vision Brief — if so, scope the PRD to your chosen feature
- If starting fresh, gather requirements (and redirect to Step 0 if the idea is too big for one feature)
- Create a PRD at `specs/<feature-name>-prd.md` using the template
- Stress-test the PRD for edge cases and ambiguity
- Create a GitHub issue linking back to the PRD (and referencing the epic issue if applicable)

For early-stage ideas that need exploration, use the `brainstorming` superpowers skill first to validate the approach before writing a PRD.

Record scope and design decisions (see [Architecture Decision Records](#architecture-decision-records) below).

**Skip specs for:** Bug fixes, trivial changes, urgent hotfixes.

### 2. Plan (plan mode)

After the PRD is approved, **enter plan mode** to design the implementation before writing any code. In plan mode, Claude explores your codebase, designs the approach, and presents a plan for your approval — no code is written until you say go.

- For complex features, use the `code-explorer` agent (from `feature-dev`) to trace execution paths and map dependencies, then the `code-architect` agent to design the architecture before planning
- The `writing-plans` superpowers skill converts specs into bite-sized tasks with exact file paths, code snippets, and commands
- Plans are saved to `specs/<feature-name>-plan.md` (alongside the PRD)
- **Always save the plan file before starting implementation** — even if the plan was provided inline or from a prior session, persist it to `specs/` first
- For features needing workspace isolation, use `using-git-worktrees` to create a clean worktree before starting

Record implementation approach decisions (see [Architecture Decision Records](#architecture-decision-records) below).

### 3. Implement — `/feature-dev`

Use the `/feature-dev` slash command, referencing the spec and issue:
```
/feature-dev specs/feature-name-prd.md (issue #123)
```

**Implementation approach:**
- Use the `test-driven-development` superpowers skill: write a failing test first, then write minimal code to pass, then refactor. No production code without a failing test.
- For long implementations, use `executing-plans` to work through the plan in batches with review checkpoints between each batch.
- For plans with independent tasks, use `dispatching-parallel-agents` to implement multiple tasks concurrently.

**Safety net:** The `security-guidance` plugin (Anthropic) runs a hook that automatically warns about potential security issues (command injection, XSS, unsafe patterns) when editing files.

**When things break:**
- Use `systematic-debugging` for any test failure or unexpected behavior — 4-phase structured debugging instead of guessing. Stops after 3 failed fixes to rethink the approach.

### 4. Verify

Before claiming work is complete, use the `verification-before-completion` superpowers skill. It enforces evidence-based completion — must show actual passing output from:

```
# Replace with your project's build/test commands, e.g.:
# npm test
# pytest
# mkdocs build --strict
```

No "should work" or "seems correct" — only verified passing output.

### 5. Review — Quality Gate

**Automated code review:**
- Use `requesting-code-review` superpowers skill to dispatch a code review subagent against the implementation
- When receiving PR feedback, use `receiving-code-review` to evaluate feedback technically rather than blindly accepting all suggestions

**Review agents** — run via the Task tool before shipping:

**Always run:**

| Agent | Task tool identifier | Purpose |
|-------|---------------------|---------|
| Code Reviewer | `feature-dev:code-reviewer` | Review for bugs, security vulnerabilities, and logic errors |
| Test Analyzer | `pr-review-toolkit:pr-test-analyzer` | Verify test coverage and identify gaps |
| Code Simplifier | `pr-review-toolkit:code-simplifier` | Simplify code for clarity and maintainability |

**Run if applicable:**

| Agent | Task tool identifier | When to use |
|-------|---------------------|-------------|
| Silent Failure Hunter | `pr-review-toolkit:silent-failure-hunter` | Changes include error handling, catch blocks, or fallbacks |
| Type Design Analyzer | `pr-review-toolkit:type-design-analyzer` | New types or interfaces introduced |
| Comment Analyzer | `pr-review-toolkit:comment-analyzer` | Significant documentation or comments added |

### 6. Ship — `/commit-push-pr`

Use the `/commit-push-pr` slash command to commit, push, and open a PR in one step. The PR should reference the issue number so it auto-closes on merge.

For structured merge decisions (merge locally vs PR vs keep branch), use the `finishing-a-development-branch` superpowers skill.

After shipping, use `/revise-claude-md` to capture any session learnings.

## Issue Types

| Type | Label | Use For |
|------|-------|---------|
| Feature | `type:feature` | New functionality, references spec file |
| Bug | `type:bug` | Unexpected behavior, no spec needed |
| Task | `type:task` | Refactoring, cleanup, no spec needed |
| Epic | `type:epic` | Groups related features |

## Requirements Format

When writing acceptance criteria:
- Use numbered list (not checkboxes)
- Write yes/no verifiable statements
- Focus on *what*, not *how*
- Use active voice ("Error message is displayed" not "User sees error")
- Include concrete expected values when possible

## Architecture Decision Records

When choosing between meaningful alternatives during Steps 0–2, capture the decision as an ADR in `specs/decisions/`. Not every feature needs one — only when there's a real fork in the road (e.g., "JWT vs session auth", "one plugin or two", "flat structure vs nested").

**File naming:** `specs/decisions/NNN-short-title.md` (zero-padded, e.g., `001-plan-files-alongside-prds.md`)

**Template:**

```markdown
# NNN — Title

**Status:** Accepted | Superseded by NNN
**Date:** YYYY-MM-DD
**Step:** Discover | Define | Plan

## Context
What prompted the decision and why it matters.

## Options Considered
1. **Option A** — tradeoffs
2. **Option B** — tradeoffs

## Decision
Which option and why.

## Consequences
What changes as a result — both positive and negative.
```

## Slash Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `/agentic-coding:writing-vision-briefs` | Capture a fuzzy idea as a structured Vision Brief |
| `/agentic-coding:writing-feature-prds` | Create a feature PRD, stress-test it, and open a GitHub issue |
| `/feature-dev` | Guided feature development with codebase understanding |
| `/commit` | Create a git commit |
| `/commit-push-pr` | Commit, push, and open a PR |
| `/revise-claude-md` | Capture session learnings back into CLAUDE.md |

### Review & Quality

| Command | Description |
|---------|-------------|
| `/review-pr` | Comprehensive PR review using specialized agents |
| `/code-review` | Code review a pull request |

### Superpowers Skills

Skills from the `superpowers` plugin, invoked automatically based on context:

| Skill | When it activates |
|-------|-------------------|
| `brainstorming` | Before creative work — explores intent, proposes approaches, validates design |
| `writing-plans` | After spec approval — converts specs into bite-sized implementation tasks |
| `using-git-worktrees` | Starting feature work that needs workspace isolation |
| `test-driven-development` | During implementation — enforces RED→GREEN→REFACTOR cycle |
| `executing-plans` | Long implementations — works through plan in batches with review checkpoints |
| `dispatching-parallel-agents` | Multiple independent tasks that can be worked concurrently |
| `systematic-debugging` | Any bug or test failure — structured 4-phase debugging |
| `verification-before-completion` | Before claiming done — requires actual passing evidence |
| `requesting-code-review` | After implementation — dispatches automated code review subagent |
| `receiving-code-review` | After PR feedback — enforces technical evaluation of suggestions |
| `finishing-a-development-branch` | After verification — structured merge/PR decision |

### Review Agents (via Task tool)

| Agent | Identifier | Purpose |
|-------|-----------|---------|
| Code Reviewer | `feature-dev:code-reviewer` | Review for bugs, security vulnerabilities, logic errors |
| Test Analyzer | `pr-review-toolkit:pr-test-analyzer` | Verify test coverage completeness |
| Code Simplifier | `pr-review-toolkit:code-simplifier` | Simplify for clarity and maintainability |
| Silent Failure Hunter | `pr-review-toolkit:silent-failure-hunter` | Find suppressed errors and bad fallbacks |
| Type Design Analyzer | `pr-review-toolkit:type-design-analyzer` | Review type invariants and encapsulation |
| Comment Analyzer | `pr-review-toolkit:comment-analyzer` | Verify comment accuracy and usefulness |

### Codebase Analysis Agents (via Task tool)

| Agent | Identifier | Purpose |
|-------|-----------|---------|
| Code Explorer | `feature-dev:code-explorer` | Trace execution paths, map architecture, document dependencies |
| Code Architect | `feature-dev:code-architect` | Design feature architecture with implementation blueprints |

## Quick Reference

| Step | Action | Tools |
|------|--------|-------|
| 0. Discover | Capture idea as Vision Brief, break into epics + features | `/agentic-coding:writing-vision-briefs` (skip if single feature is clear) |
| 1. Define | Create PRD + issue for one feature | `/agentic-coding:writing-feature-prds` (use `brainstorming` for early ideas) |
| 2. Plan | Enter plan mode, explore codebase, create plan | `code-explorer` + `code-architect` agents, `writing-plans` skill |
| 3. Implement | Build with TDD | `/feature-dev` + `test-driven-development` + `security-guidance` hook |
| 4. Verify | Prove it works | `verification-before-completion` |
| 5. Review | Quality gate | `requesting-code-review` + `code-reviewer` + review agents |
| 6. Ship | Commit, push, PR | `/commit-push-pr` + `/revise-claude-md` |