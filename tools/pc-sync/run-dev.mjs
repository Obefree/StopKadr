#!/usr/bin/env node
/** Starts PC sync server + Expo Metro (one command on Windows). */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const sync = spawn(process.execPath, ['tools/pc-sync/server.mjs'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

const expo = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['expo', 'start'],
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
