const { spawnSync } = require('node:child_process');
const code = `
const pty = require('node-pty');
const db = new (require('better-sqlite3'))(':memory:');
console.log('SQLite:', JSON.stringify(db.prepare('select 1 as ok').get()));
db.close();
const terminal = pty.spawn('cmd.exe', ['/d', '/c', 'echo MUNDER_PTY_OK'], { cols: 80, rows: 24 });
let output = '';
const timer = setTimeout(() => { terminal.kill(); process.exit(1); }, 10000);
terminal.onData(data => { output += data; });
terminal.onExit(({exitCode}) => {
  clearTimeout(timer);
  console.log('PTY:', JSON.stringify(output));
  process.exit(exitCode === 0 && output.includes('MUNDER_PTY_OK') ? 0 : 1);
});
`;
const result = spawnSync(require('electron'), ['-e', code], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 20000
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
