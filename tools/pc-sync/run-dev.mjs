#!/usr/bin/env node
/** Starts PC sync server + Expo Metro (one command on Windows). */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deepClear = process.argv.includes('--clear');

if (deepClear) {
  spawnSync(process.execPath, ['tools/clean-metro-cache.mjs'], { cwd: root, stdio: 'inherit' });
}

const expoArgs = ['expo', 'start', '-c'];
console.log('[dev] Metro: expo start -c' + (deepClear ? ' + .expo removed' : ''));

const sync = spawn(process.execPath, ['tools/pc-sync/server.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const expo = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  expoArgs,
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);

function shutdown() {
  sync.kill();
  expo.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

sync.on('exit', (code) => {
  if (code && code !== 0) console.error('[pc-sync] exited', code);
});
expo.on('exit', (code) => {
  shutdown();
  if (code) process.exitCode = code;
});
