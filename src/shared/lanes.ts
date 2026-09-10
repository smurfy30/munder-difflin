export interface LanesTask {
  id: string; title: string; brief: string; status: string; workflow: string; stage: string;
  evidence: string; note: string; owns: string[]; dependsOn: string[]; laneIds: string[];
  attempts?: { lane: string; exitCode?: number | null }[];
  reviews?: { decision: string; evidence: string; note: string; commit?: string }[];
  merge?: { commit: string; target: string; evidence: string };
  transitions: { to: string; label: string; allowed: boolean; blockedBy: string[] }[];
}
export interface LanesSnapshot {
  at: string; source: string; ledgerUpdatedAt: string; project: { id: string; root: string };
  lanes: { id: string; project: string; status: string; provider: string; model: string;
    branch: string | null; worktree: string | null; logFile: string; exitCode: number | null }[];
  runs: { id: string; project: string; title: string; status: string; updatedAt: string;
    tasks: LanesTask[]; decisions: { id: string; question: string; answer?: string }[] }[];
  leases: Record<string, unknown>;
}
export type LanesResult = { ok: true; snapshot: LanesSnapshot } | { ok: false; error: string };
export interface LanesDraft { key: string; title: string; brief: string; owns: string[]; workflow: string }
export type LanesDraftResult = { ok: true } | { ok: false; error: string };
