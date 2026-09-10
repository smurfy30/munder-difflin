// Passive adapter: never invoke Lanes reconciliation, dispatch, or save functions.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function snapshot({ root = process.env.LANES_ROOT || 'E:/projects/lanes', project = 'card_game' } = {}) {
  const load = file => import(pathToFileURL(path.join(root, 'dist', file)).href);
  const { loadConfig } = await load('config.js');
  const { listWorkflows, currentStage, transitionOptions } = await load('workflows.js');
  const cfg = loadConfig();
  if (!cfg.projects[project]) throw new Error(`Unknown Lanes project: ${project}`);
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const ledger = path.join(cfg.stateDir, 'lanes.json');
  const state = read(ledger);
  if (!Array.isArray(state.lanes)) throw new Error('Malformed Lanes ledger: lanes must be an array');
  if (state.lanes.some(l => !l || typeof l.id !== 'string' || typeof l.project !== 'string')) throw new Error('Malformed lane: id and project are required');
  const runsDir = path.join(cfg.stateDir, 'runs');
  const rawRuns = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter(f => f.endsWith('.json')).map(f => read(path.join(runsDir, f))) : [];
  for (const run of rawRuns) {
    if (typeof run.project !== 'string' || !Array.isArray(run.tasks)) throw new Error(`Malformed run: ${run.id || 'unknown'}`);
  }
  const lanes = state.lanes.filter(l => l.project === project).map(l => ({
    id: l.id, project: l.project, status: l.status, provider: l.provider, model: l.modelId,
    order: l.order, branch: l.branch, worktree: l.worktree, owns: l.owns, needs: l.needs,
    startedAt: l.startedAt, endedAt: l.endedAt, exitCode: l.exitCode, logFile: l.logFile
  }));
  const runs = rawRuns.filter(r => r.project === project).map(r => ({
    id: r.id, project: r.project, title: r.goal, status: r.status, updatedAt: r.updatedAt,
    decisions: r.decisions || [], tasks: r.tasks.map(t => {
      const workflow = t.workflow || 'standard';
      const work = { ...t, brief: t.brief || '', owns: t.owns || [], dependsOn: t.dependsOn || [], evidence: t.evidence || '' };
      const context = { work,
        dependenciesDone: work.dependsOn.every(id => r.tasks.some(dep => dep.id === id && dep.status === 'done')),
        decisionsResolved: !(r.decisions || []).some(d => !d.answer && (!d.task || d.task === t.id)) };
      return { ...work, workflow, stage: currentStage(work, workflow), transitions: transitionOptions(context, workflow) };
    })
  })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { at: new Date().toISOString(), project: { id: project, root: cfg.projects[project].root },
    source: 'Stored Lanes records, not live process status. Files may change during this read.',
    ledgerUpdatedAt: fs.statSync(ledger).mtime.toISOString(), workflows: listWorkflows(), lanes, runs,
    leases: state.leases || {} };
}
module.exports = { snapshot };
