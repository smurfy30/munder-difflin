const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const repo = path.resolve(__dirname, '..');
const project = path.resolve(process.env.CARDGAME_ROOT || 'E:/projects/card_game');
const profile = path.join(process.env.LOCALAPPDATA || os.homedir(), 'MunderDifflin-CardGame');
const hive = path.join(profile, 'workspace');
if (!fs.existsSync(path.join(project, '.git'))) throw new Error(`CardGame checkout missing: ${project}`);
if (!fs.existsSync(path.join(repo, 'out/main/index.js'))) throw new Error('Run npm run build first.');
fs.mkdirSync(hive, { recursive: true });
const configFile = path.join(profile, 'config.json');
if (!fs.existsSync(configFile)) {
  fs.writeFileSync(configFile, JSON.stringify({
    onboardingComplete: true, audience: 'technical', harnessHome: hive,
    recentHives: [hive], registeredRepos: [project], autoMode: false,
    orchestratorMaySpawn: false, maxConcurrentWorkers: 1,
    defaultCommand: 'claude', godProvider: 'claude', godModel: 'sonnet', defaultModel: 'sonnet',
    missions: [], opsStandupSeeded: true, heartbeatSeeded: true, compactMaintenanceSeeded: true,
    semanticMemory: false, telemetryEnabled: false, autoUpdate: false, reflectEnabled: false,
    strongKeepalive: false, notifications: false
  }, null, 2));
}
const instructions = path.join(hive, 'AGENTS.md');
if (!fs.existsSync(instructions)) {
  fs.writeFileSync(instructions, `# CardGame office\n\nProject: ${project}\n\nRead the project's AGENTS.md and .agents/AGENTS.md before work. This office starts in supervised mode. Orient yourself read-only and wait for Shane's task; do not start backlog work or other agents on startup.\n\nExisting orchestration: E:/projects/lanes. Inspect active work before proposing implementation: run node "${path.join(repo, 'tools/lanes-status.cjs')}". That bridge only reads a snapshot. Do not treat unavailable Lanes as evidence that no workers are active. Do not independently dispatch work that overlaps existing Lanes workers.\n\nStart work from conversation. Keep implementation, verification evidence, accepted independent review, and observed merge separate. Never infer acceptance from an exit code. Never merge without Shane's explicit approval. Questions requiring Shane belong in the project's docs/decisions-needed.md per its instructions. The office task board is a view, not a replacement for the Lanes ledger yet.\n`);
}
const claudeFile = path.join(hive, 'CLAUDE.md');
if (!fs.existsSync(claudeFile)) fs.writeFileSync(claudeFile, '@AGENTS.md\n');
const workflowImport = '@' + path.join(repo, 'docs', 'CARDGAME_WORKFLOW.md').replace(/\\/g, '/');
const currentInstructions = fs.readFileSync(claudeFile, 'utf8');
if (!currentInstructions.includes(workflowImport)) fs.appendFileSync(claudeFile, `\n${workflowImport}\n`);
console.log(`CardGame profile: ${profile}`);
if (process.argv.includes('--prepare-only')) process.exit(0);
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(require('electron'), [repo, `--user-data-dir=${profile}`], {
  cwd: repo, env, detached: true, stdio: 'ignore', windowsHide: false
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.unref();
