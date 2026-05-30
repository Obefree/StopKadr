#!/usr/bin/env node
/**
 * StopKadr PC inbox — same Wi‑Fi as phone.
 * POST /upload  (application/zip)  → inbox/<folder>/
 * GET  /health
 * GET  /projects — JSON list
 * GET  /browse — simple HTML for second device
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.STOPKADR_SYNC_PORT || 8792);
const INBOX =
  process.env.STOPKADR_INBOX ||
  path.join(os.homedir(), 'Documents', 'StopKadr-Inbox');

function ensureInbox() {
  fs.mkdirSync(INBOX, { recursive: true });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Project-Title, X-Project-Id');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function safeName(s) {
  return (s || 'project')
    .replace(/[^\w\u0400-\u04FF-]+/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 48) || 'project';
}

function listProjects() {
  ensureInbox();
  const entries = fs.readdirSync(INBOX, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const dir = path.join(INBOX, e.name);
      const zipPath = path.join(dir, 'project.zip');
      const stat = fs.existsSync(zipPath) ? fs.statSync(zipPath) : fs.statSync(dir);
      return {
        id: e.name,
        name: e.name,
        mtime: stat.mtime.toISOString(),
        zipUrl: `/files/${encodeURIComponent(e.name)}/project.zip`,
      };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function lanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const list of Object.values(nets)) {
    for (const ni of list || []) {
      if (ni.family === 'IPv4' && !ni.internal) ips.push(ni.address);
    }
  }
  return ips;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
    json(res, 200, {
      ok: true,
      service: 'stopkadr-pc-sync',
      port: PORT,
      inbox: INBOX,
      ips: lanIps(),
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/projects') {
    json(res, 200, { projects: listProjects(), inbox: INBOX });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/browse') {
    const projects = listProjects();
    const rows = projects
      .map(
        (p) =>
          `<li><a href="${p.zipUrl}">${p.name}</a> <small>${p.mtime}</small></li>`,
      )
      .join('');
    cors(res);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>StopKadr Inbox</title></head><body style="font-family:sans-serif;padding:16px"><h1>StopKadr — проекты с телефона</h1><p>Папка на ПК: <code>${INBOX}</code></p><ul>${rows || '<li>Пока пусто</li>'}</ul></body></html>`);
    return;
  }

  const fileMatch = url.pathname.match(/^\/files\/([^/]+)\/(.+)$/);
  if (req.method === 'GET' && fileMatch) {
    const folder = decodeURIComponent(fileMatch[1]);
    const file = path.basename(decodeURIComponent(fileMatch[2]));
    const filePath = path.join(INBOX, folder, file);
    if (!filePath.startsWith(INBOX) || !fs.existsSync(filePath)) {
      json(res, 404, { error: 'Not found' });
      return;
    }
    cors(res);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${file}"`,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/upload') {
    try {
      const body = await readBody(req);
      const title = url.searchParams.get('title') || req.headers['x-project-title'] || 'project';
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const folderName = `${stamp}_${safeName(String(title))}`;
      const dir = path.join(INBOX, folderName);
      ensureInbox();
      fs.mkdirSync(dir, { recursive: true });
      const zipPath = path.join(dir, 'project.zip');
      fs.writeFileSync(zipPath, body);
      const meta = {
        title: String(title),
        projectId: req.headers['x-project-id'] || null,
        receivedAt: new Date().toISOString(),
        bytes: body.length,
      };
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
      const host = req.headers.host || `127.0.0.1:${PORT}`;
      json(res, 200, {
        ok: true,
        savedPath: zipPath,
        folder: dir,
        browseUrl: `http://${host}/browse`,
      });
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : 'Upload failed' });
    }
    return;
  }

  json(res, 404, { error: 'Use GET /health, POST /upload, GET /browse' });
});

ensureInbox();
server.listen(PORT, '0.0.0.0', () => {
  const ips = lanIps();
  console.log('\n=== StopKadr PC sync ===');
  console.log('Inbox:', INBOX);
  console.log('Port:', PORT);
  for (const ip of ips) {
    console.log(`  Phone → http://${ip}:${PORT}/upload`);
    console.log(`  Browser (2nd device) → http://${ip}:${PORT}/browse`);
  }
  console.log('\nKeep this window open while shooting.\n');
});
