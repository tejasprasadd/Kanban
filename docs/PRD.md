# PRD — Kanban Task Management Board (API + Local Persistence)

## Document control
- **Product**: Kanban Task Management Board (intern assignment; production-quality expectations)
- **Owner**: Frontend Intern
- **Stakeholders**: Engineering manager, mentor reviewers
- **Status**: Draft
- **Last updated**: 2026-04-15

## 1) Summary
Build a Trello-like Kanban board that initializes tasks from **JSONPlaceholder** (`/todos`) and then behaves **local-first**: users can create/edit/delete/reorder tasks and drag them between columns. User changes persist locally and **must not be overwritten** on refresh by re-fetching the API.

The app should feel fast, interactive, and reliable with production-grade UX patterns: optimistic updates, smooth drag-and-drop, robust error handling, and clean modular architecture.

## 2) Goals & success metrics
### Goals
- **G1**: Demonstrate production-level frontend engineering: architecture, state synchronization, and UX details.
- **G2**: Implement reliable API initialization + local persistence without duplication or overwrites.
- **G3**: Provide smooth, accessible drag-and-drop across columns and within columns.

### Success metrics (definition of done)
- **Functional completeness**: All mandatory requirements satisfied; expected features implemented.
- **Reliability**: No duplicate tasks on refresh; API failure handled gracefully; persistence is correct.
- **UX quality**: No flicker on load, clear drag feedback, responsive layout, predictable interactions.
- **Maintainability**: Decoupled modules; typed domain model; low coupling between UI and data/state.

## 3) Non-goals (explicitly out of scope)
- Authentication/authorization
- Multi-user collaboration, server-side persistence, or real-time sync
- Complex workflow automation (rules, triggers)
- Full audit logs

## 4) Target users & primary use cases
### Persona
- **Internal user**: An engineer/PM/intern who wants to manage a list of tasks quickly in a Kanban workflow.

### Primary user journeys
1. **First load**: App loads, shows skeleton/loading, initializes tasks from JSONPlaceholder, board appears.
2. **Create**: User adds a task with a required title; it appears immediately in “To Do”.
3. **Progress**: User drags a task from “To Do” → “In Progress” → “Done”.
4. **Organize**: User reorders tasks within a column using drag-and-drop.
5. **Maintain**: User edits details; deletes tasks; refreshes and sees the same state preserved.
6. **Failure mode**: API fetch fails; user sees a friendly error and can retry; board still works with local tasks.

## 5) Requirements overview
### Columns (minimum)
- **To Do**
- **In Progress**
- **Done**

### Feature list
- **Mandatory**: API fetch/initialize, create tasks, drag between columns, card display, local persistence, responsive UI.
- **Expected**: edit, delete, reorder within a column, merge API + local consistently.
- **Bonus (optional)**: loading/error UI polish, priority/due date, grouping by user, optimistic UX.

## 6) Functional requirements (with acceptance criteria)

### FR-1 Fetch & initialize tasks from API
**Description**: On first load (or when no local tasks exist), fetch initial tasks from JSONPlaceholder.

- **Source**: `https://jsonplaceholder.typicode.com/todos`
- **Mapping**:
  - `title` → `Task.title`
  - `completed=false` → `Task.status = "todo"`
  - `completed=true` → `Task.status = "done"`
  - API has no “In Progress”; tasks can enter “In Progress” via user actions.

**Acceptance criteria**
- **AC1**: On a clean profile (no prior local state), app fetches tasks once and shows them on the board.
- **AC2**: Completed tasks appear in “Done”; incomplete tasks appear in “To Do”.
- **AC3**: During fetch, a loading UI is shown (skeleton/spinner). No layout jump/flicker after load.
- **AC4**: On fetch failure, show an error UI with a **Retry** action.
- **AC5**: API tasks are normalized into the canonical `Task` model (see section 7).

**Notes**
- Consider limiting initial load volume for UX (e.g., first N tasks). If limited, document it and keep deterministic.

### FR-2 Task creation
**Description**: Users can create a new task with required title and optional description.

**Acceptance criteria**
- **AC1**: Title is required; empty/whitespace-only titles are rejected with inline validation.
- **AC2**: On submit, task appears immediately in “To Do” at the top (or bottom) per defined ordering rule.
- **AC3**: New tasks are persisted locally and survive refresh.
- **AC4**: Create flow is keyboard-friendly (enter to submit; escape to close modal/drawer).

### FR-3 Task display (cards)
**Description**: Tasks are displayed as cards showing at least title and status.

**Acceptance criteria**
- **AC1**: Each card shows title; optional description preview may be shown (truncated).
- **AC2**: Very long titles do not break layout (wrap or truncate with ellipsis).
- **AC3**: Cards are clickable/focusable for edit/view interactions.

### FR-4 Drag & drop between columns (status update)
**Description**: Users can move tasks between columns using drag-and-drop.

**Acceptance criteria**
- **AC1**: Dragging a card to another column updates `Task.status` immediately (optimistic).
- **AC2**: Drop targets are clearly highlighted; dragged item has visual affordances.
- **AC3**: After drop, state persists locally and survives refresh.
- **AC4**: If drop is cancelled (escape or drop outside), task returns to its original position.

### FR-5 Reorder within a column
**Description**: Users can reorder tasks within a column via drag-and-drop.

**Acceptance criteria**
- **AC1**: Dragging within same column changes order deterministically and persists.
- **AC2**: Order is stable across refreshes.
- **AC3**: Reordering does not mutate tasks in other columns.

### FR-6 Edit task
**Description**: Users can update a task’s title and description.

**Acceptance criteria**
- **AC1**: Title edit enforces the same validation as create.
- **AC2**: Edits persist locally and survive refresh.
- **AC3**: Edits to API-seeded tasks are supported and must “win” over the original API values.

### FR-7 Delete task
**Description**: Users can delete tasks.

**Acceptance criteria**
- **AC1**: Delete removes task from UI immediately.
- **AC2**: Delete is persisted locally and survives refresh.
- **AC3**: If an API task is deleted, it must not reappear on refresh.

### FR-8 Local persistence and “API + local merge”
**Description**: Local state is the source of truth after initialization. API is a seed, not a continuously authoritative source.

**Acceptance criteria**
- **AC1**: If local state exists, API fetch must **not overwrite** user-created/edited/moved/reordered tasks.
- **AC2**: Refreshing the page must not duplicate API tasks.
- **AC3**: If local state is empty, API fetch seeds the board and then persists it.
- **AC4**: If API schema changes or fetch fails, app still runs and local tasks remain usable.

**Deterministic merge strategy (required)**
- Use **stable IDs** and a **source marker** to avoid collisions and duplication.
- Track a one-time “seed has been applied” flag and/or store `apiSeedVersion` in persistence.
- Store “tombstones” for deletions of API tasks (to prevent them from resurfacing).

## 7) Data model (canonical domain)
### Enums
- `TaskStatus`: `"todo" | "in_progress" | "done"`
- `TaskSource`: `"api" | "local"`

### Canonical Task
Minimum recommended fields:
- **id**: string (globally unique; no collisions between API and local)
- **title**: string (required)
- **description**: string (optional)
- **status**: `TaskStatus`
- **order**: number (sortable; column-local ordering)
- **source**: `TaskSource`
- **createdAt**: ISO string
- **updatedAt**: ISO string
- **userId**: number | null (optional, future grouping)

### ID strategy
Requirements:
- Prevent collisions between API numeric ids and locally created tasks.
- Prefer a namespaced string id scheme:
  - API task: `api:jsonplaceholder:<id>`
  - Local task: `local:<uuid>`

### Persistence schema (storage payload)
Recommended persisted keys:
- `tasksById: Record<string, Task>`
- `columnOrder: Record<TaskStatus, string[]>` (ordered task ids per column)
- `deletedTaskIds: Record<string, true>` (tombstones; especially for API tasks)
- `seed: { provider: "jsonplaceholder"; appliedAt: string; version: number }`

## 8) State management & architecture
### High-level architecture principles
- **UI layer** only renders; it does not own business rules.
- **Domain layer** defines types and pure operations (merge, reorder, move).
- **State layer** owns persistence and exposes actions.
- **Data layer** wraps API calls and mapping into domain objects.

### Recommended approach
- **Central store**: Zustand (with persistence middleware).
- **Selectors**: derive column lists and UI state via memoized selectors where needed.
- **Action design**: small, intention-revealing actions:
  - `seedFromApi(todos)`
  - `createTask(input)`
  - `updateTask(id, patch)`
  - `deleteTask(id)`
  - `moveTask(id, toStatus, toIndex)`
  - `reorderTask(status, fromIndex, toIndex)`

### Data fetching boundary
- API calls live in a dedicated module (e.g., `src/api/jsonplaceholder.ts`).
- Mapping lives near the API client (e.g., `mapTodoToTask`).
- State layer decides whether to call seed or skip based on persisted state.

### Optional (recommended for production patterns)
If you want a stronger “production libraries” posture, use **TanStack Query** for:
- caching, retries, request cancellation, and stable loading/error states

The PRD does not require server-state caching long-term because API is a seed, but using TanStack Query for the initial fetch is acceptable and can improve code quality.

## 9) Drag-and-drop requirements
### Library
- Standardize on **dnd-kit** for:
  - modern API
  - strong TypeScript support
  - flexible sensors (mouse/touch/keyboard)

### DnD interaction rules
- Drag between columns updates `status` + inserts at drop index.
- Drag within column updates ordering only.
- Provide:
  - drag overlay/preview
  - drop indicators
  - keyboard support (at least basic) via dnd-kit keyboard sensors if feasible

## 10) UI/UX requirements (shadcn/ui + Tailwind)
### UI library constraints
- All UI primitives should come from **shadcn/ui** components (built on Radix) where appropriate:
  - buttons, inputs, dialogs, drawers/sheets, dropdown menus, toasts, separators, scroll areas

### Key UX expectations
- **Instant UI updates** for create/edit/move/reorder/delete (optimistic).
- **Smooth dragging**: no flicker, stable drop targets, clear hover feedback.
- **Responsive**:
  - mobile: columns stacked or horizontally scrollable with snap
  - desktop: 3 columns visible side-by-side
- **Accessibility**:
  - visible focus states
  - keyboard navigation for dialogs/forms
  - aria labels for actionable icons

### Visual design expectations
- Clean layout, spacing, and typography (Tailwind tokens).
- Truncation and overflow handling for long titles/descriptions.
- Empty state placeholders per column and globally.

## 11) Edge cases & reliability requirements
### Edge cases to handle
- **API failure**: show error + retry; allow local-only usage.
- **Empty board**: show friendly empty state and clear “Add task” CTA.
- **Duplicate IDs**: prevent by namespacing IDs; guard against accidental collisions.
- **Very long titles**: wrap/truncate; avoid overflow.
- **Refresh dedupe**: seeding should be idempotent; no duplication on refresh.
- **Deleted API tasks**: do not resurrect; tombstones required.

### Resilience rules
- Persisted state is authoritative after it exists.
- Seeding logic must be idempotent.
- Storage corruption handling:
  - if parse fails, reset to empty with a user-noticeable but non-blocking message.

## 12) Performance requirements
- Initial render should remain responsive; avoid re-rendering the full board unnecessarily.
- Store should be normalized; selectors should avoid O(N) work per card render when possible.
- DnD should remain smooth for at least ~100 tasks (target) without major jank.

## 13) Security & privacy
- No sensitive data stored.
- Only public API usage (JSONPlaceholder).
- Local storage only; do not log user content unnecessarily.

## 14) Tech stack (current + required + recommended)
### Current (repo)
- **Runtime/build**: Bun (dev server + bundler)
- **Framework**: React 19
- **Language**: TypeScript (strict)

### Required by assignment / project direction
- **API**: JSONPlaceholder `/todos` (seed data)
- **UI**: shadcn/ui components
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Drag-and-drop**: dnd-kit

### Recommended “production quality” additions
- **Lint/format**: ESLint + Prettier
- **Type-safe validation**: Zod (for persisted schema migrations / guardrails)
- **Notifications**: shadcn/ui toast for success/error feedback

## 15) Release criteria / acceptance checklist
### Mandatory checklist
- [ ] API seeded tasks render into correct columns.
- [ ] Create task works with validation and persistence.
- [ ] Drag between columns works and persists.
- [ ] Cards display title and status, handle long titles.
- [ ] Local persistence works; refresh does not overwrite or duplicate.
- [ ] Responsive layout works on mobile and desktop.
- [ ] Loading and error states implemented.

### Expected checklist
- [ ] Edit task works and persists.
- [ ] Delete task works and persists; deleted API tasks do not return.
- [ ] Reorder within column works and persists.
- [ ] API + local merge is deterministic and robust.

## 16) Implementation plan (phases + detailed steps)
This section is **execution-focused** (feature development only; no testing deliverable required).

### Phase 0 — Repo baseline & tooling (quality gates)
- Add Tailwind CSS and confirm it’s wired into the Bun bundler pipeline.
- Add shadcn/ui configuration and generate required primitives (button, input, dialog/sheet, textarea, toast).
- Add lint/format tooling (ESLint + Prettier) and align with strict TypeScript.

### Phase 1 — Domain model + module boundaries (decoupling)
- Create domain types and invariants:
  - `TaskStatus`, `TaskSource`, `Task`
  - ID strategy (`api:jsonplaceholder:<id>` and `local:<uuid>`)
- Implement pure domain utilities (no React, no storage):
  - `createTask()`, `updateTask()`, `moveTask()`, `reorderTask()`
  - `applySeedIfNeeded()` (idempotent merge rules + tombstones)
- Establish folder boundaries (example):
  - `src/domain/*` (types + pure logic)
  - `src/api/*` (fetch + mapping)
  - `src/state/*` (Zustand store + persistence)
  - `src/components/*` (UI)

### Phase 2 — State layer (Zustand + persistence)
- Create Zustand store with:
  - normalized `tasksById`
  - `columnOrder` arrays per status
  - `deletedTaskIds` tombstones
  - `seed` metadata
- Add persistence (localStorage):
  - versioned schema
  - safe hydration (handle parse failures gracefully)
- Expose store actions:
  - `seedFromApi`, `createTask`, `updateTask`, `deleteTask`, `moveTask`, `reorderTask`

### Phase 3 — API integration (JSONPlaceholder seed)
- Implement API client:
  - fetch `https://jsonplaceholder.typicode.com/todos`
  - map to canonical `Task` objects
  - optional deterministic limit \(N\) for initial UX
- Implement initialization flow:
  - on app load: if local state empty and seed not applied → fetch + seed + persist
  - if local exists → skip seed; do not overwrite
- Add loading + error UI with retry.

### Phase 4 — Core UI (board, columns, cards)
- Build responsive board layout (3 columns) using Tailwind + shadcn/ui primitives.
- Column component:
  - header + count
  - empty placeholder when no tasks
- Card component:
  - title (required), description preview optional
  - overflow handling for long titles
  - actions affordance (edit/delete)

### Phase 5 — CRUD flows (Create/Edit/Delete)
- Create task:
  - modal or sheet form (title required; description optional)
  - optimistic add into “To Do” with deterministic ordering
- Edit task:
  - same form; updates persist and override API-seeded values
- Delete task:
  - remove from state; mark tombstone for API tasks so they do not return

### Phase 6 — Drag-and-drop (dnd-kit)
- Implement sortable behavior within columns (reorder).
- Implement cross-column moves (status change + insertion index).
- Add drag overlay and clear drop indicators.
- Ensure persistence is updated after each drag operation.

### Phase 7 — Persistence hardening & edge-case handling
- Guarantee idempotent seed and dedupe on refresh.
- Handle:
  - storage corruption (reset with non-blocking notice)
  - duplicate IDs (prevent by construction; guard defensively)
  - very long titles (wrap/truncate; no overflow)
- Confirm “deleted API tasks never resurrect”.

### Phase 8 — UX polish & release readiness
- Improve perceived performance:
  - skeletons, transitions, no flicker on load/hydration
- Accessibility pass:
  - focus states, aria labels for icon buttons, keyboard-friendly dialogs
- Finalize README (setup, architecture, merge strategy, trade-offs) and deployment (Vercel or equivalent).

## 17) Risks & mitigations
- **R1: Persistence bugs leading to duplication/overwrites**  
  - *Mitigation*: idempotent seed, tombstones, schema versioning.
- **R2: DnD complexity with reordering + columns**  
  - *Mitigation*: normalized ordering arrays; single “move” action; dnd-kit sortable patterns.
- **R3: Missing Tailwind/shadcn scaffolding in repo**  
  - *Mitigation*: treat as setup tasks in implementation; PRD assumes they will be added.

## 18) Deliverables
- **Repository**: GitHub repo containing source, PRD, and README.
- **Deployment**: Live deployed link (Vercel preferred; any equivalent acceptable).
- **README must include**:
  - Setup instructions (Bun install + dev + build + start)
  - Tech stack overview
  - API integration approach (seed strategy; why API does not overwrite local)
  - State management approach (Zustand store shape; persistence; merge rules)
  - Drag-and-drop approach (dnd-kit strategy; reorder vs move)
  - Trade-offs and future improvements

## 19) Evaluation rubric mapping (how we meet it)
- **Functionality (30%)**
  - FR-1 to FR-8 define the full functional scope and acceptance criteria.
- **Code quality (25%)**
  - Section 8 enforces separation of concerns (UI/domain/state/data).
  - Strong typing (section 7) and deterministic merge rules (FR-8).
- **UI/UX (20%)**
  - Section 10 specifies responsive behavior, drag affordances, and accessibility expectations.
- **API handling (15%)**
  - FR-1 + FR-8 specify loading/error UX, retry, and idempotent seeding.
- **Problem solving (10%)**
  - Section 11 edge cases + section 17 risks explicitly address real-world failure modes.

