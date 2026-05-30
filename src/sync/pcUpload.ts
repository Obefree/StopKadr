import * as FileSystem from 'expo-file-system/legacy';
import { StopMotionProject } from '../models/types';
import { buildProjectZip } from './projectArchive';
import { resolvePcSyncBaseUrl } from './syncSettings';

export type PcUploadResult = {
  savedPath: string;
  browseUrl: string;
};

export async function probePcSync(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      method: 'GET',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function uploadProjectToPc(
  project: StopMotionProject,
  baseUrl?: string,
): Promise<PcUploadResult> {
  const resolved = baseUrl ? { baseUrl: baseUrl.replace(/\/+$/, '') } : await resolvePcSyncBaseUrl();
  if (!resolved.baseUrl) {
    throw new Error(
      'ПК не найден в Wi‑Fi.\n\n' +
        'На компьютере: npm run pc-sync\n' +
        'Телефон и ПК — одна сеть. В Expo Go адрес ПК подставится автоматически.',
    );
  }

  const ok = await probePcSync(resolved.baseUrl);
  if (!ok) {
    throw new Error(
      `Сервер на ${resolved.baseUrl} не отвечает.\n\n` +
        'На ПК в папке StopKadr: npm run pc-sync',
    );
  }

  const zipUri = await buildProjectZip(project);
  const uploadUrl = `${resolved.baseUrl}/upload?title=${encodeURIComponent(project.title)}`;

  const result = await FileSystem.uploadAsync(uploadUrl, zipUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': 'application/zip',
      'X-Project-Title': project.title,
      'X-Project-Id': project.id,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    let msg = `HTTP ${result.status}`;
    try {
      const body = JSON.parse(result.body) as { error?: string };
      if (body.error) msg = body.error;
    } catch {
      if (result.body) msg = result.body.slice(0, 200);
    }
    throw new Error(msg);
  }

  const payload = JSON.parse(result.body) as { savedPath?: string; browseUrl?: string };
  return {
    savedPath: payload.savedPath ?? '',
    browseUrl: payload.browseUrl ?? resolved.baseUrl,
  };
}
