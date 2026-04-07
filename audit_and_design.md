# Audit and Defensive Design Template

This document is a reusable template for auditing and designing a professional software system with strong defensive defaults. It keeps the most useful patterns visible in this codebase while removing project-specific assumptions.

Use it to document:
- build and release hygiene
- permission and sandbox boundaries
- telemetry and observability
- startup performance decisions
- operational escape hatches and risk controls

---

## 1. Executive Summary

`<Project Name>` should be designed so that speed, extensibility, and operator convenience do not erode security. The architecture should assume:
- code grows over time
- optional features become attack surface
- operational shortcuts will be attempted
- packaging mistakes are common

The defensive posture should therefore emphasize:
- least privilege
- auditable permission paths
- controlled feature exposure
- deliberate startup behavior
- observable failures

**Implementation targets**
- A startup/bootstrap layer with explicit ordering and trust boundaries
- A permission system that all side-effecting actions flow through
- A sandbox or isolation layer for command, file, and external-service access

---

## 2. Supply Chain and Release Hygiene

### Template
Audit the build and release pipeline for:
- accidental source exposure
- sourcemap handling
- hidden debug paths
- overbroad package contents
- environment-specific code leaking into production artifacts

### Design rules
- Use explicit package allowlists where possible.
- Treat source maps as sensitive release artifacts unless intentionally public.
- Gate experimental features with build-time constants when practical.
- Ensure inactive optional code can be excluded from production builds.

### What to preserve from this codebase
- Strong feature-flag discipline
- Clear distinction between bundled optional features and baseline runtime behavior
- Awareness that packaging mistakes can reveal far more than intended

---

## 3. Startup Architecture and Performance

### Template
Startup code should optimize for real latency wins without making initialization opaque or fragile.

### Design rules
- Kick off safe, independent I/O early when it genuinely overlaps expensive imports or computation.
- Keep startup side effects few, intentional, and documented.
- Distinguish mandatory initialization from opportunistic prefetching.
- Avoid hiding critical state mutations in deep import chains.

### Implementation targets
- Early startup profiling and selective prefetching
- A clear split between required initialization and opportunistic optimization

### Audit questions
- Which startup side effects are required?
- Which are speculative optimizations?
- What happens if early prefetching fails?
- Is the system still correct if startup shortcuts are disabled?

---

## 4. Permission Model

### Template
Every side-effecting capability in `<Project Name>` should pass through an explicit permission layer. The model should answer:
- who requested the action
- what resource is affected
- whether the action is allow, deny, or ask
- whether rules or prior approvals apply

### Design rules
- Centralize permission decision types.
- Log approval and denial paths in a structured way.
- Make “always allow” and “always deny” rules explicit and reviewable.
- Keep user interaction and automated checks race-safe.
- Do not allow background workers or remote channels to bypass the same controls silently.

### Implementation targets
- An interactive permission flow for allow, deny, and ask decisions
- A shared permission context and decision model used across tools

---

## 5. Sandboxing and Process Isolation

### Template
If the application can execute commands, access the filesystem, or call external services, isolation rules should be explicit and enforceable.

### Design rules
- Define what the runtime may read, write, or execute.
- Separate default-safe modes from elevated modes.
- Make escalation paths visible to the user or operator.
- Audit destructive capabilities separately from ordinary ones.

### Audit questions
- What is the default execution boundary?
- Which actions require escalation?
- Are dangerous commands or broad wildcards specially handled?
- Can configuration accidentally widen the sandbox beyond intent?

---

## 6. Telemetry, Logging, and Privacy

### Template
Observability should help operators debug the system without leaking sensitive user data.

### Design rules
- Initialize telemetry only after trust and policy conditions are satisfied.
- Sanitize logs before emission.
- Separate diagnostics safe for analytics from raw internal debugging.
- Capture startup, error, and health signals early enough to be useful.

### What to preserve from this codebase
- Privacy-aware telemetry boundaries
- Strong distinction between useful diagnostics and unsafe raw data
- Early process-start markers and error sinks

---

## 7. Error Handling and Failure Containment

### Template
`<Project Name>` should handle partial failure without collapsing the entire session where possible.

### Design rules
- Use specific error classes for recoverable operational conditions.
- Distinguish user-denial, transient infrastructure failure, and programmer error.
- Keep cleanup hooks for background resources and long-lived connections.
- Make degraded behavior explicit rather than silently inconsistent.

### Implementation targets
- Specific error types for recoverable operational failures
- Warning, cleanup, and sink utilities for degraded but controlled operation

---

## 8. Escape Hatches and Operational Risk

### Template
Professional systems often need admin or emergency bypasses. Those paths must be designed as controlled exceptions, not casual shortcuts.

### Design rules
- Inventory every bypass or “dangerous” mode.
- Gate risky flags with environment or trust checks.
- Document who is expected to use them and under what conditions.
- Prefer narrow bypasses over global unrestricted modes.

### Audit questions
- Are dangerous flags visible in code review?
- Are they logged when used?
- Do they materially change security posture?
- Can they leak into production workflows by default?

---

## 9. Professional Audit Checklist

- Release artifacts expose only what is intended.
- Optional features are gated and removable.
- Startup side effects are documented and justified.
- Every destructive or external action passes through permissions.
- Sandbox boundaries are concrete, not implied.
- Telemetry is privacy-aware and operationally useful.
- Errors are categorized and recoverability is intentional.
- Escape hatches exist only where justified and are easy to audit.

---

## 10. Fill-In Summary Table

| Component | Audit Focus | Location |
|---|---|---|
| Entrypoint | Startup effects and trust sequence | `<src/...>` |
| Build/Release | Packaging and artifact exposure | `<build/...>` |
| Permissions | Approval and denial paths | `<src/...>` |
| Sandbox | Isolation and escalation rules | `<src/...>` |
| Telemetry | Logging, tracing, privacy | `<src/...>` |
| Error Handling | Recovery and sinks | `<src/...>` |

---

> [!TIP]
> A mature system is rarely secured by one big mechanism. The real quality signal is that packaging, startup, permissions, logging, and failure handling all reinforce each other.
