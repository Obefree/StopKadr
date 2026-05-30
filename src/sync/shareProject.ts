import * as Sharing from 'expo-sharing';
import { StopMotionProject } from '../models/types';
import { buildProjectZip } from './projectArchive';

/**
 * Save project on device / send to another iPhone via Share sheet (AirDrop, Files, etc.).
 */
export async function shareProjectArchive(project: StopMotionProject): Promise<void> {
  const zipUri = await buildProjectZip(project);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Обмен файлами недоступен на этом устройстве.');
  }
  await Sharing.shareAsync(zipUri, {
    mimeType: 'application/zip',
    dialogTitle: `StopKadr — ${project.title}`,
    UTI: 'public.zip-archive',
  });
}
