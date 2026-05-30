import * as Sharing from 'expo-sharing';
import { StopMotionProject } from '../models/types';
import {
  exportProjectToMp4,
  ExportProgress,
  getVideoExportBlockReason,
} from '../export/videoExport';
import { saveVideoToDevice } from '../utils/mediaSave';

export async function exportAndSaveVideo(
  project: StopMotionProject,
  onProgress?: ExportProgress,
): Promise<string> {
  const block = await getVideoExportBlockReason();
  if (block) throw new Error(block);
  const path = await exportProjectToMp4(project, onProgress);
  await saveVideoToDevice(path);
  return path;
}

export async function exportAndShareVideo(
  project: StopMotionProject,
  onProgress?: ExportProgress,
): Promise<string> {
  const block = await getVideoExportBlockReason();
  if (block) throw new Error(block);
  const path = await exportProjectToMp4(project, onProgress);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Обмен файлами недоступен на этом устройстве.');
  }
  await Sharing.shareAsync(path, {
    mimeType: 'video/mp4',
    dialogTitle: `StopKadr — ${project.title}`,
    UTI: 'public.mpeg-4',
  });
  return path;
}
