# Agent and System Architecture Template

This document is a reusable template for describing the agentic core of a serious software system. It is written to preserve the most valuable structural lessons from this codebase while remaining adaptable to other projects.

Use it to document:
- the main execution loop
- context and prompt assembly
- tool and command boundaries
- multi-agent or background coordination
- persistence, budgets, and recovery behavior

---

## 1. Executive Summary

`<Project Name>` is built around a bounded orchestration engine that manages user input, model interaction, tool execution, and state transitions. The architecture should be optimized for:
- explicit control flow
- typed contracts between subsystems
- incremental progress reporting
- safe extensibility
- recoverability under interruption

**Quality bar**
- Keep the orchestration layer narrow and legible.
- Push specialized logic into isolated modules.
- Make side effects deliberate, observable, and permission-aware.
- Prefer predictable state transitions over hidden framework magic.

**Implementation targets**
- A long-running query or orchestration loop that manages turns, budgets, cancellation, and progress updates
- Central tool contracts that define input schemas, permissions, execution boundaries, and result shapes
- Session and bootstrap state that owns global runtime configuration, working directory, mode selection, and persistence hooks

---

## 2. Core Engine

### Purpose
The core engine is responsible for converting user intent into a controlled execution loop. It should own:
- turn lifecycle
- message/state evolution
- model invocation
- tool-call routing
- stopping conditions

### Template
`<EngineName>` manages a turn-based async workflow. Each turn should follow a clear sequence:
1. normalize incoming user input
2. assemble execution context
3. invoke the model or planner
4. validate and execute requested tools
5. append results to the working transcript
6. repeat until completion, cancellation, or budget exhaustion

### Design rules
- Keep turn limits and budget limits explicit.
- Track cumulative usage in one place.
- Prefer streaming progress updates over black-box waiting.
- Reset turn-scoped caches at the beginning of each top-level request.
- Make cancellation first-class through an abort controller or equivalent primitive.

### What to preserve from this codebase
- Turn-scoped bookkeeping instead of uncontrolled cross-turn growth
- Explicit wrapping of permission checks before tool execution
- Separation between prompt assembly, execution context, and tool runtime

---

## 3. Context and Prompt Assembly

### Purpose
A professional agent system does not build prompts ad hoc. It assembles a prompt from well-defined sources with a stable order of precedence.

### Template
Context for `<Project Name>` is composed from:
- base system instructions
- user/session context
- project/workspace context
- tool metadata and capability descriptions
- optional policy or memory layers
- optional mode-specific addenda

### Design rules
- Treat prompt assembly as a deterministic pipeline, not scattered string concatenation.
- Keep custom overrides narrow and auditable.
- Add memory or policy prompts only when the runtime has actually enabled the corresponding mechanism.
- Distinguish persistent session context from transient turn context.

### Implementation targets
- A deterministic system-prompt assembly pipeline
- A context collection layer for user, workspace, tool, and policy data

---

## 4. Tooling Architecture

### Purpose
Tools are how the orchestration layer touches the outside world. They should be modular, typed, and safe by default.

### Template
Each tool in `<Project Name>` should define:
- a stable name
- an input schema
- a permission model
- an execution function
- result and progress shapes

### Design rules
- Validate inputs before execution.
- Isolate side effects inside tool modules.
- Keep shared tool context typed and centrally defined.
- Make permission decisions part of the call path, not an afterthought.
- Standardize progress events so the UI and logs can render tool activity consistently.

### Quality patterns worth copying
- Strongly typed shared tool context
- Centralized permission context and decision types
- Narrow tool modules with explicit contracts instead of generic “do anything” handlers

### Implementation targets
- A shared tool interface or base contract
- A registry or discovery layer for available tools
- Isolated tool implementation modules grouped by capability

---

## 5. Commands and Non-Agent Actions

### Purpose
Not every CLI action should go through the agent loop. Some operations are deterministic and should stay that way.

### Template
`<Project Name>` separates:
- agent-driven actions that require planning or model reasoning
- direct commands that are procedural, deterministic, or administrative

### Design rules
- Keep operational commands independent from the model when possible.
- Use command handlers for setup, diagnostics, auth, and maintenance flows.
- If commands delegate to the agent, make that handoff explicit.

### Implementation targets
- A command registration layer
- A command implementation layer separate from core orchestration

---

## 6. Multi-Agent or Background Coordination

### Purpose
If the system supports delegation, the coordination layer must be explicit about ownership, communication, and safety boundaries.

### Template
When enabled, `<CoordinatorName>` may decompose larger tasks into smaller units and assign them to workers or background agents. The coordinator should own:
- task decomposition
- worker capability selection
- message passing
- shared state or memory synchronization
- lifecycle management

### Design rules
- Delegate only bounded tasks with clear ownership.
- Keep the main orchestrator authoritative for final integration.
- Do not let background workers bypass the same safety controls as the main agent.
- Separate session-scoped state from worker-local state.

### Implementation targets
- A coordination module for delegation and worker lifecycle
- A runtime definition layer for worker or agent capabilities

---

## 7. State, Persistence, and Recovery

### Purpose
A production-quality agent system must survive interruption, partial completion, and resumed sessions without corrupting its working state.

### Template
`<Project Name>` should persist:
- conversation or execution transcript
- session identifiers
- recoverable user-visible state
- optionally memory and attribution metadata

### Design rules
- Record enough information to resume meaningfully, not merely replay logs.
- Keep session persistence opt-in or policy-controlled where appropriate.
- Make state transitions observable and testable.
- Avoid hidden global mutation except for carefully controlled bootstrap state.

### Implementation targets
- Session/bootstrap state for global runtime control
- A store or state container for app/session updates

---

## 8. Professional Code Quality Checklist

- Types define boundaries before implementation grows.
- Module names map cleanly to responsibilities.
- Comments explain why a tricky choice exists, not what obvious code does.
- Dangerous or high-cost actions are bounded by permissions, limits, or both.
- Startup work is front-loaded only when it clearly improves latency.
- Long-running flows expose progress and cancellation paths.
- Feature flags gate optional behavior cleanly and can be stripped from builds when inactive.

---

## 9. Fill-In Summary Table

| Area | Module / Folder | Responsibility |
|---|---|---|
| Engine | `<src/...>` | Main agent loop and orchestration |
| Prompting | `<src/...>` | Context and system prompt assembly |
| Tools | `<src/...>` | Capability modules and validation |
| Commands | `<src/...>` | Deterministic CLI or admin actions |
| Coordinator | `<src/...>` | Delegation and worker management |
| State | `<src/...>` | Session and app state |
| Persistence | `<src/...>` | Resume and transcript storage |

---

> [!IMPORTANT]
> The strongest transferable lesson from this codebase is not any single file layout. It is the combination of explicit boundaries, typed contracts, bounded execution loops, and safety checks on every side-effecting path.
