import { existsSync, readFileSync, renameSync, unlinkSync, openSync, writeFileSync, fsyncSync, closeSync } from 'node:fs';

function durableWrite(path: string, text: string): void {
  const fd = openSync(path, 'w');
  try { writeFileSync(fd, text, 'utf8'); fsyncSync(fd); } finally { closeSync(fd); }
}

/** Some projected/encrypted Windows profiles reject even same-directory renames
 * with EXDEV. Keep a complete recovery journal before writing in place there.
 * This fallback is recoverable, not an atomic replacement for external readers. */
export function writeRecoverableJson(path: string, data: unknown, io = { rename: renameSync, write: durableWrite }): void {
  const text = JSON.stringify(data, null, 2);
  const pending = `${path}.pending`;
  io.write(pending, text);
  try { io.rename(pending, path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
    io.write(path, text);
    unlinkSync(pending);
  }
}

export function readRecoverableJson<T>(path: string, fallback: T): T {
  for (const candidate of [`${path}.pending`, path]) {
    try { if (existsSync(candidate)) return JSON.parse(readFileSync(candidate, 'utf8')) as T; }
    catch { /* incomplete journal: preserve the last readable destination */ }
  }
  return fallback;
}
