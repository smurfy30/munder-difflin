const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

// node-pty 1.1 ships Windows Node-API binaries. Rebuilding those needlessly
// requires the optional VS Spectre libraries. SQLite still needs Electron's ABI.
const hasWindowsPty = process.platform === 'win32' &&
  existsSync(join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds', `win32-${process.arch}`, 'conpty.node'));
const cli = require.resolve('@electron/rebuild/lib/cli.js');
const args = [cli, '-f', ...(hasWindowsPty ? ['--only', 'better-sqlite3'] : [])];
const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
