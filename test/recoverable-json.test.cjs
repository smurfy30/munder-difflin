const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeRecoverableJson, readRecoverableJson } = require('./load-ts.cjs')('src/main/recoverableJson.ts');

test('same-directory EXDEV preserves the new record without losing encryption through delete/recreate', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-json-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'registry.json');
  fs.writeFileSync(file, JSON.stringify({ agents: {} }));
  const record = { agents: { pam: { status: 'idle' } } };
  writeRecoverableJson(file, record, { rename() { throw Object.assign(new Error('projected file'), { code: 'EXDEV' }); }, write: fs.writeFileSync });
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), record);
  assert.equal(fs.existsSync(file + '.pending'), false);
});

test('an interrupted fallback retains a complete recoverable record', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-json-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'registry.json');
  fs.writeFileSync(file, '{}');
  const record = { agents: { pam: {} } };
  assert.throws(() => writeRecoverableJson(file, record, {
    rename() { throw Object.assign(new Error('projected file'), { code: 'EXDEV' }); },
    write(p, text) { if (p === file) { fs.writeFileSync(p, '{'); throw new Error('interrupted'); } fs.writeFileSync(p, text); }
  }), /interrupted/);
  assert.deepEqual(readRecoverableJson(file, {}), record);
});

test('an incomplete journal does not hide the previous readable record', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-json-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'registry.json');
  fs.writeFileSync(file, '{"agents":{"pam":{}}}');
  fs.writeFileSync(file + '.pending', '{');
  assert.deepEqual(readRecoverableJson(file, {}), { agents: { pam: {} } });
});
