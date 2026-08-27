---
title: "Sandbox Service State Governance: A K8s-Like Declarative Scheduling Mechanism"
createTime: 2026/07/30 21:40:00
permalink: /article/7b623071/
sticky: 2
description: K8s-like declarative resource reconciliation: continuously aligning desired and observed state for sandbox services.
---

> GitHub repo

<CardGrid>
  <RepoCard repo="1nFrastr/baby-lovable" />
</CardGrid>

## Core insight

This mechanism mainly solves three problems:

1. Multiple requests operating the same workspace at once — duplicate resource creation and mutual state overwrite.
2. Shifting scheduling from “the caller decides the next action” to “the caller declares the final desired state.”
3. Lease controls who may advance real resources; CAS prevents old state from overwriting new state.

## Background

When a user opens a new session, the backend starts warming the workspace: create sandbox, start the dev server, prepare PreviewURL. These take time.

Meanwhile the Agent may already be working. Before calling tools it needs a usable workspace. If the workspace is not ready, the Agent also triggers resource prep. Worse, impatient users may click Restart repeatedly to restart the whole preview service.

So under one session you can have concurrent requests:

1. Background warm-up
2. Agent tool-call requests
3. User manual Restart

All operate the same resource set. Without care, two typical failures appear.

**First: duplicate creation.** One session spins up two sandboxes or two dev servers. Extra resource use, port contention, multiple PreviewURLs — state becomes unpredictable.

**Second: state overwrite.** The service is already up, but an earlier request still thinks it is not ready and restarts again. New state is overwritten by an old judgment; the user experience is chaotic.

So the real problem is not mere “concurrent requests,” but:

> Multiple requests decide around the same workspace at once, and each may be acting on already-stale state.

## Naive approach: critical-section lock

The most direct fix is a lock.

```typescript
lock()
  createSandbox()
  startDevServer()
unlock()
```

That helps somewhat: two requests will not enter this code at the same time, avoiding the most direct concurrent execution. But clear flaws remain.

A lock only guarantees “one executor at a time,” not “what that executor is about to do is correct.” Callers still imperatively choose the next action — create sandbox, start dev server, restart preview — usually from state they observed then, which may already be stale.

Request A sees the workspace unready and plans to create a sandbox. Before A actually runs, B may have already created it. If A, after taking the lock, merely continues the action it decided earlier, it can still create duplicates.

So the lock solves “don’t do it at the same time,” not “reconfirm real state before acting.” Worse, writes can overwrite each other: a request holds an old snapshot and later writes it back to durable storage. If another request wrote newer state in between, the old write clobbers it.

A critical-section lock alone is not enough. We need more than mutual exclusion — a mechanism that continuously converges the system toward a desired state.

## From imperative to declarative scheduling

The old mode was imperative. The caller said:

> Create a sandbox for me, then start the dev server.

The new mode is declarative. The caller only says:

> I want this session to become preview-ready.

Whether a sandbox exists, whether the dev server is up, whether PreviewURL is available — the caller does not decide. The reconciler does.

Each time, the reconciler re-observes the real world and chooses the next step: no sandbox → create; already exists → don’t create again; dev server down → start; already usable → no-op; desired state met → exit.

That is the shift from imperative to declarative scheduling. Imperative asks “what command now?”; declarative asks “what final state?”

Callers no longer orchestrate create / start / restart directly — they only write desired state. The system picks minimal actions from the gap between current and desired, converging the real world step by step.

## Basic concepts

The design borrows from the Kubernetes controller model.

### Desired state

Desired state is what the system should become. For example:

```typescript
desired = "preview-ready"
```

Meaning: this session’s preview service should eventually be available.

### Observed state

Observed state is the latest observation of reality. For example:

1. Whether a sandbox exists
2. Whether the dev server is started
3. Whether PreviewURL is reachable
4. Whether we are creating, starting, ready, or failed

Desired is “what we want”; observed is “what it is now.”

### Reconciler

The reconciler advances observed state toward desired state. It does not blindly run fixed commands; it repeatedly:

1. Observes the real world
2. Measures the gap between observed and desired
3. Performs one minimal action

The loop continues until desired is satisfied or the reconcile time budget is exceeded.

### Lease

The lease decides who currently reconciles. Many requests may arrive for one session, but only one may truly operate sandbox, dev server, and PreviewURL. Whoever holds the lease is this round’s reconciler.

Leases expire. If the holding isolate dies mid-flight, the lease does not stick forever. After expiry, others can take over.

### Version check

Version checks prevent old state from overwriting new. Each snapshot has a `revision`. On write you must confirm the stored `revision` is still the one you read.

If the version changed, someone else already wrote newer state. The current write must fail; re-read latest state and decide again. That is CAS.

## Reconcile: declarative reconciliation

The new scheduling flow:

1. Caller writes desired state, e.g. `preview-ready`
2. Request tries to acquire the lease
3. Lease holder starts reconciling
4. Reconciler observes the real world
5. Performs a minimal action from the observation
6. Observes again
7. Until desired is met or this round times out

Winning the lease is not a blank check to start/stop resources at will — it is the right to reconcile. The only duty:

> Gradually bring observed state up to desired state.

If a sandbox already exists, do not create again; if the dev server is up, do not start again; if PreviewURL is ready, exit; if desired changes mid-reconcile, keep converging to the new target.

Requests that miss the lease need not fail immediately. They can wait for the current reconciler; if the lease expires, the prior reconciler may be dead and they can try takeover.

So the system is no longer many requests each running their own flow — many requests collaborate around one desired state.

## What Lease solves

Lease solves concurrent operation of external resources. Under one session, create sandbox, start dev server, prepare PreviewURL are external side effects — careless concurrency easily duplicates and overwrites.

Lease’s roles:

1. Only one reconciler operates external resources at a time
2. If the reconciler dies mid-way, others can take over after lease expiry

Unlike an in-process lock, which only protects one process: in Serverless, requests for the same session may land on different isolates. Each has its own memory; local locks cannot coordinate.

The lease lives in durable storage, so every isolate sees the same lease state. It is not a permanent lock: it expires and requires continuous renewal. While the holder lives, it renews; if it dies, renewal stops, the lease expires, and someone else can take over.

So Lease answers:

> Who is allowed to advance the real world.

## What CAS solves

Lease decides who may operate external resources, but not everything. Old state can still overwrite new.

Request A reads a snapshot:

```typescript
revision = 10
observed = "starting"
```

Then it starts some work. Meanwhile B finishes a reconcile and updates to:

```typescript
revision = 11
observed = "ready"
```

If A later writes its old snapshot back, `ready` may become `starting` again. That is state overwrite.

CAS prevents it. Every write must carry the `revision` from the read. Only if durable storage’s current version still equals that `revision` does the write succeed. If the version changed, the write fails; the request re-reads the latest snapshot and re-decides.

So CAS answers:

> Whose state write is still valid.

Lease is about external-resource operation rights; CAS is about write freshness. Both are required.

## Why not a plain distributed lock

A traditional distributed lock usually means:

> I hold the lock, so I may run this code.

That is still imperative. It stops two requests entering a critical section, but does not care whether the action inside is still sensible, or whether the write-back is based on the latest version.

In this project the real danger is not merely “two requests running at once.” More specifically we fear three things:

1. Multiple sandboxes created for one session
2. An isolate dying mid-way and freezing coordination
3. An isolate holding a stale snapshot and writing it back to durable storage

Lease solves the first two: only one reconciler advances external resources at a time; because leases expire, others can take over after the holder dies. CAS solves the third: every state write must be based on the latest version; if someone already updated the snapshot, the old write cannot overwrite.

So this is not “no locks” — it replaces a bare distributed mutex with an expiring lease plus version checks, fitting Serverless concurrency:

> Many requests may declare desire at once, but only one reconciler advances the real world at a time, and every state write goes through a version check.

## Mapping to Kubernetes

The model closely mirrors Kubernetes controllers. Users rarely say “go start a container on that machine now”; they declare “I want 3 replicas running.” That desired state is written to the API Server; Controllers keep observing cluster state and create, delete, or update resources until observed approaches desired.

Same idea here. Callers do not command create sandbox or start dev server — they write desired state such as `preview-ready`. The system stores both desired and observed. The reconciler keeps observing and acting so observed catches up to desired.

Lease is like electing the controller currently responsible for reconcile. CAS is like etcd’s optimistic concurrency — writes do not clobber each other.

## Code shape

Core state lives in `DaytonaRuntimeSnapshot`. It only stores desired and observed — APIs do not imperatively start/stop sandbox or dev server.

```typescript
export interface DaytonaRuntimeSnapshot {
  sessionId: string;
  revision: number;
  generation: number;

  desired: DaytonaDesiredState;
  observed: DaytonaObservedPhase;

  leaseOwner: string | null;
  leaseExpiresAt: string | null;
}
```

The important fields:

- `desired`: target state — e.g. caller wants preview eventually available
- `observed`: current state from the latest observation of the real world
- `leaseOwner` / `leaseExpiresAt`: who holds the lease and when it expires
- `revision`: for version checks; on every snapshot write, confirm nobody else updated the version
- `generation`: generation of desired state; when desired changes, generation changes so the reconciler knows whether it is still chasing the latest target

## `ensureDesiredState` flow

`ensureDesiredState` has four steps.

**Step 1: write desired state.** If the caller wants preview available:

```typescript
desired = "preview-ready"
```

The caller need not care whether a sandbox already exists or whether to start the dev server.

**Step 2: try to acquire the lease.** If nobody is reconciling, or the prior lease expired, this request can become the new reconciler. If someone else holds the lease, do not create resources again — wait for convergence, or try takeover after expiry.

**Step 3: enter the observe-and-act loop.** The reconciler repeatedly: renew → read latest snapshot → observe the real world → merge observations → check if desired is satisfied → if not, perform one minimal action.

Simplified:

```typescript
async function reconcileLoop(...) {
  while (Date.now() < deadline) {
    await renewRuntimeLease(sessionId, owner, LEASE_TTL_MS);

    let snapshot = await getRuntimeSnapshot(sessionId, null, {
      fresh: true,
    });

    const observed = await observeRuntime(...);

    // Merge real observations into the snapshot

    if (isDesiredSatisfied(snapshot)) {
      return snapshot;
    }

    const acted = await reconcileOnce(sessionId, snapshot, observed);

    // If an action ran, continue to the next observe round
  }
}
```

Critical point: the reconciler does not execute a one-shot plan from the initial judgment. Every round re-reads the latest snapshot and re-observes the real world, avoiding wrong actions on stale state.

**Step 4: finish or release the lease.** If desired is met, this round ends; if the time budget is exceeded, stop and let later requests take over.

## What `reconcileOnce` does

`reconcileOnce` only advances one step. It does not run every action at once — it picks one minimal action from the gap between observed and desired.

For desired `preview-ready`: no sandbox → create; sandbox exists but no dev server → start; dev server up but PreviewURL not ready → wait or refresh; all conditions met → no-op.

One step at a time matters. After each action the real world may change; the next step should follow a new observation, not keep running from an old snapshot.

That is the largest difference between declarative reconcile and imperative flows. Imperative looks like:

```typescript
createSandbox()
startDevServer()
createPreviewURL()
```

Declarative reconcile looks like:

```typescript
observe()

if (!sandboxExists) {
  createSandbox()
  return
}

if (!devServerReady) {
  startDevServer()
  return
}

if (!previewURLReady) {
  preparePreviewURL()
  return
}

return ready
```

After each step, return to observe. Even if another request updates state mid-way, or external resources change, the next reconcile round can correct course.

## A typical scenario

User opens a session; background warm-up starts. It writes desired:

```typescript
desired = "preview-ready"
```

It acquires the lease and starts creating a sandbox. The Agent also starts calling tools, discovers it needs a workspace, and calls `ensureDesiredState("preview-ready")` too — but cannot get the lease.

The Agent does not create another sandbox; it waits for the current reconciler to reach `preview-ready`.

If the warm-up isolate is healthy, it continues create sandbox → start dev server → prepare PreviewURL; once desired is met, the Agent proceeds. If the warm-up isolate dies, it stops renewing; after lease expiry, the Agent’s request can take over reconcile.

On takeover it does not blindly recreate from scratch — it re-observes: reuse an existing sandbox; only start a missing dev server; exit if PreviewURL is already ready. That avoids duplicate creation and stuck flows.

## Restart scenario

Restart is the easiest way to trigger state races. Users may click Restart repeatedly; each click is a new intent.

Imperatively, each request may stop and start again. Interleaved restarts easily yield “just started, then stopped,” or old requests overwriting new state.

In the declarative model, Restart is not “immediately stop then start.” It is more like writing a new desired generation. The system knows:

> The user wants the preview service to converge to available again.

The reconciler acts from the latest generation and real state. If an old reconciler sees the generation changed, it must not keep writing under the old target; if it tries to write an old snapshot, revision mismatch fails the write. Only reconcile results based on the latest desired and latest version succeed. That reduces overwrite from rapid Restart clicks.

## Final model

In one sentence:

> Callers only declare desired state; the system uses a lease to elect a single reconciler, and version checks so state writes cannot overwrite newer results.

More concretely:

1. Callers do not create / start / restart directly
2. Callers only write desired state
3. Lease decides who currently advances real resources
4. The reconciler keeps observing real state
5. Each time, only one minimal action
6. CAS ensures old snapshots cannot overwrite new ones
7. If the reconciler dies, others take over after lease expiry

Division of labor:

- **Lease**: who may operate external resources at a time, and how to take over after the holder dies
- **CAS**: how to avoid old versions overwriting new ones on write
- **Reconciler**: how observed state gradually converges to desired

The point is not a more complex lock. The real change is moving from imperative operations to declarative convergence: callers express intent; the lease elects the current reconciler; version checks protect consistency; the reconciler observes, acts, and observes again until the workspace reaches desired state.

Related: [Server-side state sync: handed off entirely to Supabase Realtime](/article/8703d140/).
