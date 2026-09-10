import { app } from 'electron';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import type { LanesResult, LanesDraft, LanesDraftResult } from '../shared/lanes';

let pending: Promise<LanesResult> | undefined;
export function createLanesDraft(input: LanesDraft): Promise<LanesDraftResult> {
  const body = JSON.stringify(input);
  if (body.length > 50000) return Promise.resolve({ ok: false, error: 'Request too large' });
  return new Promise(resolve => {
    const child = execFile('node', [join(app.getAppPath(), 'tools', 'lanes-draft.cjs')],
      { windowsHide: true, timeout: 20000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) return resolve({ ok: false, error: stderr.trim() || error.message });
        try { const result = JSON.parse(stdout); resolve(result.ok ? { ok: true } : { ok: false, error: 'Draft was not confirmed' }); }
        catch { resolve({ ok: false, error: 'Draft response unreadable; retry with the same form to avoid duplicates' }); }
      });
    child.stdin?.on('error', () => {});
    child.stdin?.end(body);
  });
}
export function readLanes(): Promise<LanesResult> {
  if (pending) return pending;
  pending = new Promise<LanesResult>(resolve => {
    execFile('node', [join(app.getAppPath(), 'tools', 'lanes-status.cjs')],
      { windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) return resolve({ ok: false, error: stderr.trim() || error.message });
        try { resolve({ ok: true, snapshot: JSON.parse(stdout) }); }
        catch { resolve({ ok: false, error: 'Lanes returned an invalid snapshot' }); }
      });
  }).finally(() => { pending = undefined; });
  return pending;
}
