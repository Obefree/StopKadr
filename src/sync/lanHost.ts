import Constants from 'expo-constants';

export const PC_SYNC_PORT = 8792;

export function parseHostFromDebuggerHost(debuggerHost: string): string | null {
  const raw = debuggerHost.trim();
  if (!raw) return null;
  const host = raw.split(':')[0]?.trim();
  return host || null;
}

/** IP of dev machine running Metro (same Wi‑Fi as phone). */
export function readMetroLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const h = parseHostFromDebuggerHost(hostUri);
    if (h) return h;
  }

  const expoGo = Constants.expoGoConfig as { debuggerHost?: string; hostUri?: string } | null;
  if (expoGo?.debuggerHost) {
    const h = parseHostFromDebuggerHost(expoGo.debuggerHost);
    if (h) return h;
  }
  if (expoGo?.hostUri) {
    const h = parseHostFromDebuggerHost(expoGo.hostUri);
    if (h) return h;
  }

  const manifest2 = Constants.manifest2 as
    | { extra?: { expoGo?: { debuggerHost?: string; hostUri?: string } } }
    | null;
  const expoGoHost = manifest2?.extra?.expoGo?.debuggerHost ?? manifest2?.extra?.expoGo?.hostUri;
  if (expoGoHost) {
    const h = parseHostFromDebuggerHost(expoGoHost);
    if (h) return h;
  }

  const legacy = Constants.manifest as { debuggerHost?: string } | null;
  if (legacy?.debuggerHost) {
    return parseHostFromDebuggerHost(legacy.debuggerHost);
  }

  return null;
}

export function buildPcSyncBaseUrl(host: string): string {
  const h = host.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  return `http://${h}:${PC_SYNC_PORT}`;
}
