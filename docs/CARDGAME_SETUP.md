# CardGame setup and Lanes migration

This fork starts from upstream `main` at `9ce27e76` (v0.4.6). Customizations live on
`codex/cardgame-bootstrap`. `origin` is the personal fork; `upstream` is the original project.

## Run

Double-click `Start-CardGame.cmd`, or run `npm run start:cardgame` from this checkout.
Click **open** in the workspace picker. CardGame is registered at `E:/projects/card_game`.
Michael uses the installed Claude CLI and its existing login, with the `sonnet` model alias.
Change the engine/model through the app settings when needed.

The isolated profile is `%LOCALAPPDATA%/MunderDifflin-CardGame`; its `workspace` folder
contains agent state and the project instructions. The launcher creates these only when
missing, preserving later edits. Auto mode and automatic worker spawning start off,
worker concurrency starts at one, and recurring missions start disabled. Auto-update
is disabled for this source fork. Settings are local and are not committed.

To install and rebuild:

```powershell
npm ci
npm run build
npm run typecheck
npm run test:native
npm run start:cardgame
```

The Windows postinstall uses node-pty's shipped Node-API binaries when available and
rebuilds better-sqlite3 for Electron. The upstream blanket rebuild required optional
Visual Studio Spectre libraries even though the packaged PTY worked. Other platforms
retain the upstream rebuild. `test:native` exercises a real Windows PTY and SQLite query.

## First Lanes connection

`npm run lanes:status` reads the existing installation at `E:/projects/lanes`.
Override `LANES_ROOT` and `LANES_CONFIG` for another installation/configuration.
It reuses Lanes' config loader and workflow definitions, then reads its durable ledger
and run files. It outputs selected project, workflow, worker, lease, and task fields.
It does not dispatch, reconcile, refresh, migrate, or save Lanes records. Missing or
malformed state fails explicitly. Stored status is labelled as unreconciled: it is not
proof of current process health, and the separate files are not an atomic snapshot.

The agent workspace instructions point Michael at this command. The Munder task board
is not automatically synchronized yet. Keep Lanes as the authority for existing work;
do not dispatch the same work from both systems. No Lanes engine logic or runtime data
has been copied into this public fork.

The initial HTTP snapshot experiment timed out. Inspection also showed that Lanes'
`snapshot` handler calls reconciliation and saves run state, so the passive bridge
uses disk reads instead. The existing Lanes dashboard task was started; its snapshot
performance remains a separate follow-up.

## What is worth preserving

| Capability | Existing Lanes source | Suggested next step |
| --- | --- | --- |
| Explicit workflow stages and gates | `src/workflows.ts`, `src/runs.ts` | First add a read-only Lanes panel to Munder, showing stage and blocked gates with source IDs. |
| Verification, review acceptance, and observed merge as separate facts | `src/runs.ts`, `src/git.ts` | Preserve these distinctions before allowing any board action to change a Lanes task. |
| File ownership, dependencies, resource leases | `src/scopes.ts`, `src/dispatcher.ts`, `src/ledger.ts` | Route dispatch through Lanes initially; enforce checks at execution time, not only in prompts. |
| Quota reserve, cooldown, model selection, reviewer separation | `src/scheduler.ts`, `src/usage.ts` | Reuse the scheduling service after the basic task loop works; avoid copying provider credential handling. |
| Durable attempts, transcript provenance, recovery | `src/transcript.ts`, `src/recovery.ts`, `src/provenance.ts` | Link existing evidence into the Munder task detail view before replacing storage. |

Start with one supervised task: draft, isolated implementation, verification evidence,
independent review, then an explicit human merge decision. Once that loop works through
Munder, consider extracting the tested workflow/scoping functions into a small shared
package. The desktop UI, PTYs, office visualization, and basic worktree support already
exist in Munder and do not need to be rebuilt from Lanes.

## Verification of this setup

- Production build and both TypeScript checks passed.
- Windows native smoke test passed: SQLite `select 1` and a real PTY echo.
- Playwright exercised the Electron workspace picker and opened the office floor;
  CardGame registration, supervised settings, and a live Claude PTY with output were observed.
- The direct Lanes bridge read the configured CardGame project and all four built-in workflows.
- The broad upstream suite was not green: 808 passed, 18 failed, 8 skipped. Failures
  include Windows/path assumptions, source assertions, and the Electron quit test.
  These remain unresolved; this setup is not a claim that the whole upstream app is validated.
