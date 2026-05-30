import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';
import { StopMotionProject, sortFrames } from '../models/types';
import { frameUri } from '../store/projectStore';

async function readProjectJson(projectId: string): Promise<string> {
  const path = `${FileSystem.documentDirectory}StopKadr/Projects/${projectId}/project.json`;
  return FileSystem.readAsStringAsync(path);
}

/** ZIP with project.json + frames/*.jpg — share or upload. */
export async function buildProjectZip(project: StopMotionProject): Promise<string> {
  const zip = new JSZip();
  zip.file('project.json', await readProjectJson(project.id));

  for (const frame of sortFrames(project)) {
    const uri = frameUri(project.id, frame.imagePath);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    zip.file(`frames/${frame.imagePath}`, base64, { base64: true });
  }

  const zipBase64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  const safeTitle = project.title.replace(/[^\w\u0400-\u04FF-]+/g, '_').slice(0, 40) || 'project';
  const out = `${FileSystem.cacheDirectory}StopKadr_${safeTitle}_${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(out, zipBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return out;
}
