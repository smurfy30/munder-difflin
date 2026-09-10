import { useEffect, useRef, useState } from 'react';
import type { LanesSnapshot, LanesTask } from '@shared/lanes';
import { PixelButton } from './PixelButton';

const DRAFT_KEY = 'munder-cardgame-draft';
function savedDraft() {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    return value && typeof value === 'object' ? value as Record<string, string> : {};
  } catch { return {}; }
}

export function LegacyLanesTab() {
  const [data, setData] = useState<LanesSnapshot>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  const [saved] = useState(savedDraft);
  const [title, setTitle] = useState(typeof saved.title === 'string' ? saved.title : '');
  const [brief, setBrief] = useState(typeof saved.brief === 'string' ? saved.brief : '');
  const [scope, setScope] = useState(typeof saved.scope === 'string' ? saved.scope : '');
  const [workflow, setWorkflow] = useState(['standard', 'bugfix', 'spike', 'mechanical'].includes(saved.workflow) ? saved.workflow : 'standard');
  const [saving, setSaving] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [notice, setNotice] = useState('');
  const requestKey = useRef(saved.key || crypto.randomUUID());
  const lastRequest = useRef(saved.request || '');
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, brief, scope, workflow, key: requestKey.current, request: lastRequest.current })); }
    catch { /* Draft saving to Lanes still works when local storage is unavailable. */ }
  }, [title, brief, scope, workflow]);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const refresh = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const result = await window.cth.lanesSnapshot();
      if (!alive.current) return;
      if (result.ok) { setData(result.snapshot); setError(''); }
      else { setError(result.error); setData(undefined); }
    } catch (e) { if (alive.current) { setError(String(e)); setData(undefined); } }
    finally { inFlight.current = false; if (alive.current) setBusy(false); }
  };
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    return () => { alive.current = false; clearInterval(timer); };
  }, []);
  const runs = data?.runs.filter(r => history || !['done', 'archived'].includes(r.status)) || [];
  const createDraft = async () => {
    setSaving(true); setDraftError(''); setNotice('');
    try {
      const fingerprint = JSON.stringify({ title, brief, scope, workflow });
      if (lastRequest.current && lastRequest.current !== fingerprint) requestKey.current = crypto.randomUUID();
      lastRequest.current = fingerprint;
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, brief, scope, workflow, key: requestKey.current, request: fingerprint })); } catch { /* Storage may be unavailable. */ }
      const result = await window.cth.lanesCreateDraft({ key: requestKey.current, title, brief,
        owns: scope.split('\n').map(p => p.trim()).filter(Boolean), workflow });
      if (!result.ok) { setDraftError(result.error); return; }
      requestKey.current = crypto.randomUUID();
      lastRequest.current = '';
      setTitle(''); setBrief(''); setScope('');
      setNotice('Draft saved in Lanes. No worker started.');
      await refresh();
    } catch (e) { setDraftError(String(e)); }
    finally { setSaving(false); }
  };
  return <div style={{ overflowY: 'auto', padding: 12, fontSize: 12, color: 'var(--cth-ink-900)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <strong>CardGame development</strong>
      <PixelButton size="sm" disabled={busy} onClick={() => void refresh()}>{busy ? 'reading…' : 'refresh'}</PixelButton>
    </div>
    <p>Work recorded in Lanes. Verification, review acceptance, and merge remain separate.</p>
    <details><summary>New development task</summary>
      <p>Capture a draft for review before dispatch. Use repository-relative paths for the intended scope.</p>
      <label>Title<input className="cth-input" aria-label="Task title" value={title} disabled={saving} maxLength={300} onChange={e => setTitle(e.target.value)} style={{ width: '100%' }} /></label>
      <label>Brief<textarea className="cth-input" aria-label="Task brief" value={brief} disabled={saving} maxLength={20000} onChange={e => setBrief(e.target.value)} style={{ width: '100%', minHeight: 90 }} /></label>
      <label>Scope, one path per line<textarea className="cth-input" aria-label="Task scope" value={scope} disabled={saving} onChange={e => setScope(e.target.value)} style={{ width: '100%' }} /></label>
      <label>Workflow<select aria-label="Task workflow" value={workflow} disabled={saving} onChange={e => setWorkflow(e.target.value)}>{['standard', 'bugfix', 'spike', 'mechanical'].map(w => <option key={w}>{w}</option>)}</select></label>
      <p><PixelButton size="sm" disabled={saving || !data || !title.trim() || !brief.trim()} onClick={() => void createDraft()}>{saving ? 'saving…' : 'save draft'}</PixelButton></p>
      {draftError && <p role="alert">{draftError} Retry keeps the same request key.</p>}
    </details>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert" style={{ whiteSpace: 'pre-wrap' }}>Cannot read Lanes: {error}<br />Worker availability is unknown. Retry before starting overlapping work.</p>}
    {data && <>
      <p style={{ overflowWrap: 'anywhere' }}>{data.project.root}<br />{data.source}<br />Read: {new Date(data.at).toLocaleTimeString()} · Ledger updated: {new Date(data.ledgerUpdatedAt).toLocaleString()}</p>
      <label><input type="checkbox" checked={history} onChange={e => setHistory(e.target.checked)} /> Include completed and archived runs</label>
      <p>{runs.length} runs shown · {data.lanes.filter(l => l.status === 'running').length} workers recorded as running</p>
      {runs.length === 0 && <p>No matching runs. This is not proof that no processes are running.</p>}
      {runs.map(run => <section key={run.id} style={{ marginTop: 12, padding: 10, background: 'var(--cth-paper-100)', border: '1px solid var(--cth-ink-300)' }}>
        <strong>{run.title}</strong><p>{run.status} · <code>{run.id}</code></p>
        {run.decisions.filter(d => !d.answer).map(d => <p key={d.id}>Needs a decision: {d.question}</p>)}
        {run.tasks.map(task => <Task key={task.id} task={task} data={data} />)}
      </section>)}
      <details style={{ marginTop: 12 }}><summary>Resource leases (all projects)</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(data.leases, null, 2)}</pre></details>
    </>}
  </div>;
}

function Task({ task, data }: { task: LanesTask; data: LanesSnapshot }) {
  const workers = data.lanes.filter(l => task.laneIds?.includes(l.id));
  const review = task.reviews?.at(-1);
  return <details style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--cth-ink-300)', overflowWrap: 'anywhere' }}>
    <summary>{task.title} — {task.stage} ({task.status})</summary>
    <p>{task.brief}</p>
    <p>Workflow: {task.workflow}<br />Owns: {task.owns.join(', ') || 'No scope recorded'}</p>
    <p>Verification evidence: {task.evidence || 'Not recorded'}</p>
    <p>Review: {review ? `${review.decision}: ${review.evidence || review.note}` : 'Not recorded'}</p>
    <p>Merge: {task.merge ? `${task.merge.commit} → ${task.merge.target}` : 'Not recorded'}</p>
    {task.note && <p>{task.note}</p>}
    {task.transitions.map(t => <p key={t.to}>{t.label}: {t.allowed ? 'Recorded prerequisites satisfied; no transition requested' : `Blocked by ${t.blockedBy.join(', ')}`}</p>)}
    {workers.map(w => <p key={w.id}><strong>{w.provider} · {w.model}</strong><br />{w.status} · Exit: {w.exitCode ?? 'not recorded'}<br />Branch: {w.branch || 'not recorded'}<br />Worktree: {w.worktree || 'not recorded'}<br />Log: {w.logFile}</p>)}
  </details>;
}
