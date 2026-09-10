const path = require('node:path');
const { pathToFileURL } = require('node:url');

function draftRequest(input) {
  if (!input || !/^[a-zA-Z0-9-]{1,80}$/.test(input.key || '')) throw new Error('A stable request key is required');
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 300) throw new Error('Title must be 1–300 characters');
  if (typeof input.brief !== 'string' || !input.brief.trim() || input.brief.length > 20000) throw new Error('Brief must be 1–20000 characters');
  if (!Array.isArray(input.owns) || input.owns.length > 50 || input.owns.some(p => typeof p !== 'string' || !p.trim() || p.length > 500 || /(^[\\/]|:|(^|[\\/])\.\.([\\/]|$))/.test(p))) throw new Error('Scope must contain repository-relative paths');
  if (!['standard', 'bugfix', 'spike', 'mechanical'].includes(input.workflow)) throw new Error('Unknown workflow');
  return { op: 'run_work_create', project: 'card_game', key: `munder-${input.key}`,
    actor: { name: 'Munder CardGame panel', kind: 'dashboard' },
    title: input.title.trim(), brief: input.brief.trim(), owns: input.owns.map(p => p.trim()),
    needs: [], workflow: input.workflow, kind: input.workflow === 'spike' ? 'research' : 'implementation', risk: 'normal', autoDispatch: false };
}
module.exports = { draftRequest };
if (require.main === module) (async () => {
  let text = '';
  for await (const chunk of process.stdin) { text += chunk; if (text.length > 50000) throw new Error('Request too large'); }
  const request = draftRequest(JSON.parse(text));
  const root = process.env.LANES_ROOT || 'E:/projects/lanes';
  const { control } = await import(pathToFileURL(path.join(root, 'dist', 'control.js')).href);
  const result = await control(request);
  console.log(JSON.stringify({ ok: true, result }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
