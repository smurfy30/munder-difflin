import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { PixelButton } from './PixelButton';
import { TasksKanban, parseTasks, waitsOnHuman, type HiveTask } from './TasksKanban';
import { LegacyLanesTab } from './LegacyLanesTab';

const KEY = 'cardgame-native-intake-v1';
function readDraft(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return Object.fromEntries(Object.entries(raw || {}).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  } catch { return {}; }
}

/** The same employees, task ledger and human questions as the native office. */
export function CardGameTab() {
  const agents = useStore(s => s.agents);
  const select = useStore(s => s.select);
  const openTask = useStore(s => s.openTaskDetail);
  const [initial] = useState(readDraft);
  const [id, setId] = useState(initial.id || `cardgame-${crypto.randomUUID()}`);
  const [title, setTitle] = useState(initial.title || '');
  const [brief, setBrief] = useState(initial.brief || '');
  const [kind, setKind] = useState(initial.kind || 'Task');
  const [tasks, setTasks] = useState<HiveTask[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [legacy, setLegacy] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ id, title, brief, kind })); } catch { /* optional draft recovery */ }
  }, [id, title, brief, kind]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = parseTasks(await window.cth.hiveTasks());
        if (active) setTasks(next);
      } catch { if (active) setError('The office task ledger is unavailable.'); }
    };
    void refresh();
    const timer = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const save = async () => {
    if (saving) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const card: HiveTask = { id, title: `[${kind}] ${title.trim()}`, description: brief.trim(),
        status: 'todo', dependsOn: [], priority: 2, createdAt: new Date().toISOString() };
      const result = await window.cth.hiveAddTask(card);
      const latest = parseTasks(await window.cth.hiveTasks());
      const saved = latest.find(t => t.id === id);
      if (!saved || saved.title !== card.title || saved.description !== card.description) {
        throw new Error(result.error || 'Task could not be saved. Your draft is preserved.');
      }
      setTasks(latest); setTitle(''); setBrief(''); setId(`cardgame-${crypto.randomUUID()}`);
      setNotice('Saved on the office board. Assign the task to Michael when ready.');
      openTask(id);
    } catch (e) { setError(String(e)); }
    finally { setSaving(false); }
  };
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', color: 'var(--cth-ink-900)' }}>
    <div style={{ padding: 12, fontSize: 12 }}>
      <strong>CardGame office</strong>
      <p>Capture work here. Assign it to Michael from the task details. Employees work on the floor; questions appear in Ask Me.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {agents.filter(a => a.ptyId).map(a => <button key={a.id} className="cth-input" onClick={() => select(a.id)}>
          {a.name} · {a.status}<br />{tasks.filter(t => t.assignee === a.id && t.status === 'doing').map(t => t.title).join(', ') || a.action || 'No active task'}
        </button>)}
      </div>
      {!agents.some(a => a.ptyId && !a.isGod && !a.isAssistant) && <p>No employee workers are running. Assigned workers appear here and on the office floor.</p>}
      {tasks.filter(waitsOnHuman).map(t => <p key={t.id}><button className="cth-input" onClick={() => openTask(t.id)}>Needs your input: {t.title}</button></p>)}
      <details><summary>New task or bug</summary>
        <label>Type<select aria-label="Work type" value={kind} onChange={e => setKind(e.target.value)} disabled={saving}>{['Task', 'Bug', 'Investigation'].map(k => <option key={k}>{k}</option>)}</select></label>
        <label>Title<input className="cth-input" aria-label="Work title" value={title} maxLength={280} onChange={e => setTitle(e.target.value)} disabled={saving} style={{ width: '100%' }} /></label>
        <label>What should happen?<textarea className="cth-input" aria-label="Work description" value={brief} maxLength={18000} onChange={e => setBrief(e.target.value)} disabled={saving} placeholder="Describe the outcome, or the bug and how to reproduce it." style={{ width: '100%', minHeight: 100 }} /></label>
        <PixelButton size="sm" onClick={() => void save()} disabled={saving || !title.trim() || !brief.trim()}>{saving ? 'saving…' : 'create office task'}</PixelButton>
      </details>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div style={{ minHeight: 330, flex: 1 }}><TasksKanban /></div>
    <details style={{ padding: 12 }} onToggle={e => setLegacy(e.currentTarget.open)}><summary>Legacy Lanes records</summary>{legacy && <LegacyLanesTab />}</details>
  </div>;
}
