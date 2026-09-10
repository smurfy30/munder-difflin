# Working on CardGame through this office

Use conversation for intake. The CardGame tab reads the existing Lanes ledger and
can save non-dispatched drafts there. The separate upstream Tasks tab is the office's
own ledger; it is not the authority for existing Lanes work.

Before implementation, read the target repository's AGENTS.md, .agents/AGENTS.md,
the relevant tree instructions, and the applicable skill. Read the current files;
do not rely on cached test counts or assume an older lane contract overrides them.

1. Shape a bounded task with reproduction or acceptance criteria, a workflow, and
   narrow repository-relative ownership paths. Draft intake is not dispatch approval.
2. Inspect current Lanes work, unresolved decisions, dependencies, leases, and real
   process state before dispatch. The status bridge contains stored observations,
   not live process verification. Missing or corrupt state means unknown availability.
3. Use the existing Lanes control/MCP surface for execution. It owns worktree creation,
   ownership checks and provider scheduling. Do not independently hire a Munder worker
   for the same work or bypass a Lanes rejection. Start with one worker at a time.
4. Implement in an isolated worktree on a checked base. Preserve unrelated changes.
   Carry the repository's work order and exact instructions into the worker prompt.
   Use the existing provider/model registry rather than inventing model identifiers.
5. Verify according to the changed surface. Follow the current verify.ps1 instructions
   without redirecting its output. Frontend changes need real browser behavior, not
   only a build. Before trusting localhost results, check the game server's health
   and commit identity. Catalog changes use the catalog skill and authored fragments;
   worktree isolation does not isolate a shared database or server port.
6. Record evidence and the exact commit, then obtain independent review. A successful
   process exit is neither verified behavior nor accepted review. An accepted task is
   not necessarily merged; the CardGame panel deliberately displays these separately.
7. Merge only with Shane's explicit approval. Follow the current repository merge and
   verification rules, then record the observed merge in Lanes. Do not mark work merged
   based on a worker's claim or a task-board status.

The built-in standard, bugfix, spike and mechanical workflows are read from the local
Lanes installation. Blocked transitions in the panel use that installation's gate
functions. The panel itself cannot dispatch, accept a review, transition, or merge.

Questions requiring Shane follow the project's decisions-needed.md convention.
Do not silently replace it with Munder's Ask Me ledger. While this adapter is in use,
keep one authoritative record of tasks and decisions rather than maintaining copies.

For recovery, first inspect the recorded worker, branch, worktree, log, and evidence.
Do not rerun automatically after an uncertain outcome. Draft submissions use a stable
request key so retries do not create another run. Unsubmitted drafts are stored in
this local app profile across tab changes and restarts.

The current integration is a source-checkout feature and expects Node plus a built
local Lanes installation (`LANES_ROOT`, default E:/projects/lanes). Packaging a standalone
desktop distribution is a separate step. Do not enable unattended dispatch until a
complete supervised CardGame task and stop/restart recovery have been observed.
