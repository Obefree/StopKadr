import * as FileSystem from 'expo-file-system/legacy';
import { buildPcSyncBaseUrl, readMetroLanHost } from './lanHost';

const SETTINGS_PATH = `${FileSystem.documentDirectory}StopKadr/sync-settings.json`;

export type SyncSettings = {
  pcHost: string;
  userSetHost: boolean;
};

async function readRaw(): Promise<SyncSettings> {
  const info = await FileSystem.getInfoAsync(SETTINGS_PATH);
  if (!info.exists) return { pcHost: '', userSetHost: false };
  try {
    return JSON.parse(await FileSystem.readAsStringAsync(SETTINGS_PATH)) as SyncSettings;
  } catch {
    return { pcHost: '', userSetHost: false };
  }
}

export async function loadSyncSettings(): Promise<SyncSettings> {
  await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}StopKadr`, { intermediates: true });
  return readRaw();
}

export async function saveSyncSettings(next: SyncSettings): Promise<void> {
  await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}StopKadr`, { intermediates: true });
  await FileSystem.writeAsStringAsync(SETTINGS_PATH, JSON.stringify(next, null, 2));
}

export type ResolvedPcSync = {
  baseUrl: string;
  source: 'manual' | 'metro' | 'none';
  label: string;
};

export async function resolvePcSyncBaseUrl(): Promise<ResolvedPcSync> {
  const saved = await loadSyncSettings();
  if (saved.userSetHost && saved.pcHost.trim()) {
    return {
      baseUrl: buildPcSyncBaseUrl(saved.pcHost),
      source: 'manual',
      label: `ПК (${saved.pcHost.trim()})`,
    };
  }
  const metro = readMetroLanHost();
  if (metro) {
    return {
      baseUrl: buildPcSyncBaseUrl(metro),
      source: 'metro',
      label: `ПК в Wi‑Fi (${metro})`,
    };
  }
  if (saved.pcHost.trim()) {
    return {
      baseUrl: buildPcSyncBaseUrl(saved.pcHost),
      source: 'manual',
      label: `ПК (${saved.pcHost.trim()})`,
    };
  }
  return { baseUrl: '', source: 'none', label: 'не найден' };
}
