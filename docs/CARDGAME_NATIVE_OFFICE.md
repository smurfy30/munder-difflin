# CardGame native office

Shane has chosen Munder Difflin as the primary orchestration interface. This replaces
the earlier Lanes-first bootstrap instructions for work started in this office.
The game architecture does not need changing merely to run agents visibly.

## Intake and execution

- Use native hive/tasks.json cards for new tasks, bugs and investigations. Preserve
  the card ID from assignment; Michael coordinates and native employee sessions execute.
- Work only on tasks Shane assigns. On startup orient and wait; do not sweep old backlogs.
- Hire with the native spawn-requests interface. Include taskId with the existing todo
  card ID, objective, cwd and name. The harness assigns the actual worker ID and marks
  the task doing once the process starts. Default to one worker and isolated worktrees.
- Set cwd to the registered CardGame repository for development, not the office workspace.
  Read its AGENTS.md, .agents/AGENTS.md and relevant tree instructions and skills.
  This user-authorized native workflow supersedes instructions requiring Lanes dispatch.
- Check legacy Lanes workers before overlapping development; do not dispatch the same
  work through both systems. Legacy records are historical/external work, not employees
  secretly managed by this office. External sessions are not automatically imported.

## Human input and evidence

- When input is required, set the existing card blocked and append {q, askedAt} to
  humanQA. Ask Me is the input channel for these office tasks. Read the actual answer
  before resuming. For lasting game-design decisions, link a repository decision note;
  do not require Shane to answer in two places or overwrite unanswered historical notes.
- Keep current progress and the next step in the task description. Include branch,
  worktree, observed test results and exact commit in the final handoff.
- Readable employee activity means a real native session. An idle process, worker exit,
  or done message is not proof of correct behavior, accepted review, or a merge.
- Follow the current verify.ps1 requirements, unredirected. Rust fixes require an
  observed failing regression; frontend changes require real browser verification.
  Catalog work follows its fragment/export rules; worktrees do not isolate a database.
- After implementation, use a blocked card with a humanQA review/approval request,
  attaching verification evidence. Obtain independent review before integration.
  Never merge or push to master without Shane's explicit approval. Preserve worker branches.

## Current boundaries

Native employees, tasks, questions, terminals and activity are supplied by Munder.
The CardGame page adds structured intake and a live employee/task overview. Native
task status is still editable and agent-authored: it is not a deterministic verification
gate. Lanes quota routing and ownership locks are not automatically inherited by native
employees. Keep one worker until native ownership and verification gates are implemented.
The legacy Lanes panel remains available for inspection and existing runs.

## Windows profile recovery

On the tested profile, even a same-directory rename returned EXDEV for registry
replacement. Hive writes now keep a flushed .pending journal and fall back to an
in-place write on EXDEV. Reads prefer a complete pending journal after interruption.
This preserves the existing file rather than deleting it or changing encryption.
The fallback is recoverable, not atomic for external programs reading the raw file.
Other filesystem errors still fail. Registration failure now rejects the employee
spawn instead of showing a terminal that cannot participate in office coordination.

## Observed smoke test (2026-09-10)

- Created cardgame-6d025603-f61b-4a00-aa1d-8367e879d829 through the CardGame form;
  verified it persisted after restarting the app and assignment kept the same ID.
- Michael created the native pam-smoke-test hire. Pam appeared on the actual floor
  with her own terminal; the harness assigned worker-pam-smoke-test to the card.
- Pam wrote a humanQA question. It appeared in Ask Me; answering in that interface
  preserved the answer on the card and routed it to Michael. The unanswered list cleared.
- The coordinator marked only this office-only smoke test done and stopped Pam.
  No CardGame code or database was changed, and no game development was dispatched.
- Initial inbox dispatch needed a manual terminal nudge. CLI file/tool approval
  prompts also required intervention, including inbox archiving with Windows paths.
  This is evidence for supervised native employees, not reliable unattended execution.

Next work: native ownership and verification/review gates; reliable startup delivery;
scoped CardGame permissions and inbox handling that do not depend on hand-written
shell paths. Retain Lanes overlap checks until native ownership is proven.
