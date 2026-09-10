// Read durable records directly: Lanes' HTTP snapshot reconciles/saves runs and
// performs Git queries. It is not suitable for a passive, bounded first bridge.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
async function main() {
  const root = process.env.LANES_ROOT || 'E:/projects/lanes';
  const load = file => import(pathToFileURL(path.join(root, 'dist', file)).href);
  const { loadConfig } = await load('config.js');
  const { listWorkflows } = await load('workflows.js');
  const cfg = loadConfig();
  const ledgerFile = path.join(cfg.stateDir, 'lanes.json');
  const state = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
  const runsDir = path.join(cfg.stateDir, 'runs');
  const runs = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter(f => f.endsWith('.json')).map(f => {
    const r = JSON.parse(fs.readFileSync(path.join(runsDir, f), 'utf8'));
    return { id: r.id, title: r.title, status: r.status, tasks: r.tasks?.map(t => ({ id: t.id, title: t.title, status: t.status, stage: t.stage, workflow: t.workflow })) };
  }) : [];
  console.log(JSON.stringify({
    at: new Date().toISOString(), source: 'durable records; not reconciled with live processes',
    ledgerUpdatedAt: fs.statSync(ledgerFile).mtime.toISOString(),
    projects: Object.entries(cfg.projects).map(([id, p]) => ({ id, root: p.root })),
    workflows: listWorkflows(), leases: state.leases,
    lanes: state.lanes.map(l => ({ id: l.id, status: l.status, provider: l.provider, model: l.modelId, order: l.order, worktree: l.worktree, startedAt: l.startedAt, endedAt: l.endedAt })),
    runs
  }, null, 2));
}
main().catch(error => { console.error(`Lanes unavailable: ${error.message}. Check LANES_ROOT and LANES_CONFIG; this does not mean no workers are active.`); process.exitCode = 1; });
