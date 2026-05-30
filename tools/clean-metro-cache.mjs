#!/usr/bin/env node
/** Удаляет кэш Metro / Expo без полного reinstall. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dirs = [
  path.join(root, '.expo'),
  path.join(root, 'node_modules', '.cache'),
];

for (const dir of dirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('removed:', path.relative(root, dir));
  } catch (e) {
    console.warn('skip:', dir, e instanceof Error ? e.message : e);
  }
}

console.log('Done. Start with: npm start  (already uses expo start -c)');
