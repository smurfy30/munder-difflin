const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { draftRequest } = require('../tools/lanes-draft.cjs');
const root = process.env.LANES_ROOT || 'E:/projects/lanes';
const installed = fs.existsSync(path.join(root, 'dist/control.js'));
function removeFixture(dir) {
  const target = path.resolve(dir);
  const parent = path.resolve(os.tmpdir());
  if (path.dirname(target) !== parent || !path.basename(target).startsWith('munder-lanes-')) throw new Error('Unsafe fixture cleanup path');
  fs.rmSync(target, { recursive: true, force: true });
}

test('draft requests cannot dispatch or change project, and reject escaping scope', () => {
  const input = { key: 'test-1', title: 'Fix a bug', brief: 'Reproduce first', owns: ['src/app'], workflow: 'bugfix', autoDispatch: true, project: 'other', op: 'dispatch' };
  const req = draftRequest(input);
  assert.equal(req.op, 'run_work_create'); assert.equal(req.project, 'card_game'); assert.equal(req.autoDispatch, false);
  for (const bad of ['../other', 'E:/elsewhere', '/etc', 'src/../../other']) assert.throws(() => draftRequest({ ...input, owns: [bad] }));
});

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'munder-lanes-'));
  const state = path.join(dir, 'state'); fs.mkdirSync(path.join(state, 'runs'), { recursive: true });
  const config = path.join(dir, 'config.json');
  fs.writeFileSync(config, JSON.stringify({ stateDir: state, projects: { card_game: { root: dir }, other: { root: dir } }, providers: {} }));
  fs.writeFileSync(path.join(state, 'lanes.json'), JSON.stringify({ lanes: [
    { id: 'ours', project: 'card_game', status: 'done', branch: 'codex/example', exitCode: 0 },
    { id: 'theirs', project: 'other', status: 'running' }
  ], leases: {} }));
  const run = { id: 'run-test', project: 'card_game', goal: 'Project-specific title', status: 'review', updatedAt: '2026-09-10',
    tasks: [{ id: 'task-test', title: 'Verify', status: 'review', workflow: 'standard', stage: 'review', brief: 'A brief', owns: ['src'], dependsOn: [], evidence: 'Real evidence', laneIds: ['ours'], reviews: [] }] };
  fs.writeFileSync(path.join(state, 'runs/run-test.json'), JSON.stringify(run));
  fs.writeFileSync(path.join(state, 'runs/run-other.json'), JSON.stringify({ ...run, id: 'run-other', project: 'other' }));
  const invoke = (script, input) => spawnSync(process.execPath, [path.join(__dirname, '../tools', script)], {
    encoding: 'utf8', input: input && JSON.stringify(input), timeout: 15000,
    env: { ...process.env, LANES_ROOT: root, LANES_CONFIG: config }
  });
  return { dir, state, invoke };
}

test('real Lanes adapter preserves attribution and evidence, explains gates, and does not rewrite state', { skip: !installed }, t => {
  const f = fixture(); t.after(() => removeFixture(f.dir));
  const before = fs.readFileSync(path.join(f.state, 'runs/run-test.json'), 'utf8');
  const res = f.invoke('lanes-status.cjs'); assert.equal(res.status, 0, res.stderr);
  const data = JSON.parse(res.stdout);
  assert.equal(data.runs.length, 1); assert.equal(data.runs[0].title, 'Project-specific title');
  assert.equal(data.runs[0].project, 'card_game'); assert.deepEqual(data.lanes.map(l => l.id), ['ours']);
  const task = data.runs[0].tasks[0]; assert.equal(task.evidence, 'Real evidence');
  assert.deepEqual(task.transitions.find(t => t.to === 'accepted').blockedBy, ['accepted_review']);
  assert.equal(fs.readFileSync(path.join(f.state, 'runs/run-test.json'), 'utf8'), before);
  fs.writeFileSync(path.join(f.state, 'runs/run-test.json'), '{bad');
  const bad = f.invoke('lanes-status.cjs'); assert.notEqual(bad.status, 0); assert.match(bad.stderr, /Lanes unavailable/);
  fs.writeFileSync(path.join(f.state, 'runs/run-test.json'), before);
  assert.equal(f.invoke('lanes-status.cjs').status, 0, 'Recovers after a corrected file');
});

test('real Lanes draft creation is idempotent and never launches a worker', { skip: !installed }, t => {
  const f = fixture(); t.after(() => removeFixture(f.dir));
  const input = { key: 'retry-same-key', title: 'One draft', brief: 'Do not dispatch', owns: ['src'], workflow: 'standard' };
  const ledgerBefore = fs.readFileSync(path.join(f.state, 'lanes.json'), 'utf8');
  for (let i = 0; i < 2; i++) { const res = f.invoke('lanes-draft.cjs', input); assert.equal(res.status, 0, res.stderr); }
  const runs = fs.readdirSync(path.join(f.state, 'runs')).map(name => JSON.parse(fs.readFileSync(path.join(f.state, 'runs', name), 'utf8')));
  const matches = runs.filter(r => r.requestKey === 'munder-retry-same-key');
  assert.equal(matches.length, 1); assert.equal(matches[0].tasks[0].autoDispatch, false);
  assert.equal(matches[0].tasks[0].stage, 'draft'); assert.deepEqual(matches[0].tasks[0].laneIds, []);
  assert.equal(fs.readFileSync(path.join(f.state, 'lanes.json'), 'utf8'), ledgerBefore);
});
