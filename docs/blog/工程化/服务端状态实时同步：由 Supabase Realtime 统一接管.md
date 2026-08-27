---
title: "Server-Side State Sync: Handed Off Entirely to Supabase Realtime"
createTime: 2026/07/30 21:20:00
permalink: /article/8703d140/
sticky: 1
description: Use Supabase Realtime to own frequently changing server-side state sync within a session.
---

> GitHub repo

<CardGrid>
  <RepoCard repo="1nFrastr/baby-lovable" />
</CardGrid>

Within a session, many states change often:

- Agent Run queuing, running, completing, or failing
- Preview creating, starting, restarting, or ready
- Browser Test running, passing, or failing

If the frontend polls to stitch these together, several problems appear.

**First, high request volume.** Every UI refresh temporarily queries multiple statuses (run, preview, app test) and assembles them on the server. Multiple open tabs amplify the load.

**Second, the frontend can see inconsistent state.** On refresh, multi-tab use, or out-of-order network packets, the UI may overwrite newer state with older state and diverge from the server truth.

**Third, the sync model is unclear.** Supabase Realtime is better at pushing whole-row changes. If the frontend maintains many local events and merges by hand, UI state becomes another implicit state machine.

So we need a clear read model:

> The server assembles state; the frontend only receives and replaces.

## Core design

The sync mechanism has two layers:

1. The command side updates real domain state
2. The query side maintains the read model the UI needs

In other words: separate write path and read model.

## Write path

Domain modules still update their own business state. For example:

- Agent Run updates execution status
- Daytona Runtime updates Preview status
- Browser Test updates test status

After those domain updates succeed, they call:

```typescript
publishRuntimeUpdate(...)
```

Its job is not to drive the UI directly, but to turn domain state into the unified view the frontend needs. If the update did not change any UI-relevant fields, `version` is not incremented. Lease renewal, for example, is internal coordination and should not force a UI refresh. That cuts meaningless pushes and stops the UI from thrashing on internal churn.

## Read model

The frontend does not subscribe to many scattered events. It subscribes to one unified `SessionRuntimeProjection`, which includes:

- `run`
- `preview`
- `appTest`
- `version`

`version` is a monotonically increasing number. Whenever UI-related state changes, the server builds a new projection and bumps `version`.

On receiving a projection, the frontend does not partial-merge — it replaces wholesale. If the incoming `version` is older than current, discard it. That prevents out-of-order packets from overwriting newer state.

## Transport layer

The projected read model travels different channels depending on the persistence backend.

Local development:

```txt
local file store → host SSE → Web UI
```

Cloud deployment:

```txt
Supabase Postgres → Supabase Realtime → Web UI
```

Cloud uses the `session_runtime_projection` table. The frontend subscribes to the row for the current session.

## How the frontend consumes it

The frontend consumes runtime state via `useSessionRuntime`. On entering the page, it fetches initial state once:

```txt
GET /runtime
```

After that, no polling — all further changes arrive via Realtime. Simplified:

```typescript
const channel = supabase
  .channel(`runtime:${sessionId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "session_runtime_projection",
      filter: `session_id=eq.${sessionId}`,
    },
    (payload) => {
      // applyProjectionIfNewer(payload)
    },
  );
```

Core logic:

```txt
if incoming.version > current.version:
  replace projection
else:
  ignore
```

The frontend does not need to know how each event merges. It only compares versions and accepts a full new state.

## How Preview state is published

Preview’s true state comes from the Daytona runtime snapshot. After each successful CAS write on Daytona, UI-needed preview fields are projected from the snapshot and published into `SessionRuntimeProjection`.

```typescript
// Publish UI projection only when derived preview fields change.
// Lease-only CAS no-ops should not trigger UI updates.
void publishPreviewFromSnapshot(saved, ownerId);
```

An important constraint:

> Publish a new projection only when UI-visible fields change.

Lease renewal, internal owner changes, and coordination-only fields must not push a new UI state.

The frontend cares whether Preview is ready, the PreviewURL, whether it is starting / restarting / failed, and any displayable error. It does not care about the lease holder, lease expiry, or whether a CAS was only a renewal. That isolates control-plane state from UI state.

## Why not let the client merge

A seemingly simple approach: push `preview.updated`, `run.updated`, `appTest.updated` partial events and let the client merge. We did not — that moves complexity to the client.

The client would handle: out-of-order events, missing partial state, restoring initial state after refresh, multi-tab consistency, and cross-event dependencies. The frontend easily becomes an implicit state machine.

So the server assembles the full projection. The frontend receives the complete read model and applies it based on `version`. Sync semantics stay simple:

> The server produces facts; the frontend shows the latest fact.

## Deliberately not doing

### No client-side merge of partial events

The client does not handle `preview.updated`-style patches — only full `SessionRuntimeProjection`.

### No second state bus

We did not add Ably, Redis Pub/Sub, or another messaging system as a second UI state channel. State already lives in Postgres; Supabase Realtime can push table changes. Another bus raises consistency cost.

### Do not mix chat tokens into the runtime channel

Agent streaming text still goes over Workflow SSE. The runtime projection only covers structured state: Preview, Run, Browser Test. Lifecycles and consumption patterns differ — keep them on separate channels.

## Relation to sandbox scheduling

Sandbox scheduling converges real resources; realtime sync lets the UI see the converged result. Full chain:

```txt
Agent / Preview API
  → ensureDesiredState(desired)
  → Lease + observe/act
  → upsertRuntimeSnapshot(CAS)
  → publishRuntimeUpdate
  → SessionRuntimeProjection
  → Supabase Realtime / SSE
  → Web UI
```

First half is the control plane:

```txt
ensureDesiredState
  → Lease
  → observe/act
  → CAS
```

It solves: when multiple isolates operate the same sandbox, how to avoid duplicate creation and state overwrite.

Second half is read-model push:

```txt
publishRuntimeUpdate
  → SessionRuntimeProjection
  → Realtime
```

It solves: how the frontend sees server runtime state promptly and consistently.

Splitting them keeps boundaries clear. Resource reconciliation does not drive the UI; the UI does not infer resource state. Reconciliation advances the real world toward desired state; the realtime projection turns current runtime into display state.

## Summary

The core of this realtime sync design:

> The server maintains a unified read model; the frontend subscribes to full projections and uses version to reject stale overwrites.

Concretely:

- Preview, Agent Run, and Browser Test project into one `SessionRuntimeProjection`
- On page entry, fetch initial state once; then receive updates via Realtime
- Each update replaces the whole projection — no client partial merge
- `version` rejects out-of-order or expired packets
- Internal coordination like lease renewal does not refresh the UI
- Chat tokens stay on Workflow SSE, not the runtime channel

Result: the backend owns a consistent runtime view; the frontend only renders the latest version.

Related: [Sandbox service state governance: a K8s-like declarative scheduling mechanism](/article/7b623071/).
