import * as FileSystem from 'expo-file-system/legacy';
import { expandedFrameUris } from '../store/projectStore';
import { ExportResolution, StopMotionProject } from '../models/types';
import { pathForFfmpeg } from '../utils/paths';

const RESOLUTION_MAP: Record<ExportResolution, { w: number; h: number } | null> = {
  hd720: { w: 1280, h: 720 },
  fullHD1080: { w: 1920, h: 1080 },
  vertical1080x1920: { w: 1080, h: 1920 },
  square1080: { w: 1080, h: 1080 },
  originalAspect: null,
};

export type ExportProgress = (p: number) => void;

export function exportUnavailableMessage(): string {
  return (
    'Экспорт MP4 недоступен в Expo Go.\n\n' +
    'Соберите приложение:\n' +
    '• Android: npm run build:android:preview\n' +
    '• iOS: eas build -p ios'
  );
}

export async function isVideoExportAvailable(): Promise<boolean> {
  try {
    await import('ffmpeg-kit-react-native');
    return true;
  } catch {
    return false;
  }
}

/** Dev build / APK / IPA — не Expo Go. */
export async function exportProjectToMp4(
  project: StopMotionProject,
  onProgress?: ExportProgress,
): Promise<string> {
  let FFmpegKit: typeof import('ffmpeg-kit-react-native').FFmpegKit;
  let ReturnCode: typeof import('ffmpeg-kit-react-native').ReturnCode;
  try {
    const mod = await import('ffmpeg-kit-react-native');
    FFmpegKit = mod.FFmpegKit;
    ReturnCode = mod.ReturnCode;
  } catch {
    throw new Error(exportUnavailableMessage());
  }

  const frames = expandedFrameUris(project);
  if (frames.length === 0) throw new Error('Нет кадров для экспорта.');

  const cache = FileSystem.cacheDirectory;
  if (!cache) throw new Error('Cache directory unavailable');

  const workDir = `${cache}stopkadr-export-${project.id}/`;
  await FileSystem.deleteAsync(workDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });

  for (let i = 0; i < frames.length; i++) {
    const dest = `${workDir}${String(i + 1).padStart(6, '0')}.jpg`;
    await FileSystem.copyAsync({ from: frames[i], to: dest });
    onProgress?.(((i + 1) / frames.length) * 0.5);
  }

  const fps = Math.max(1, project.settings.fps);
  const outPath = `${workDir}export.mp4`;
  const size = RESOLUTION_MAP[project.settings.resolution];
  const vfScale = size
    ? `scale=${size.w}:${size.h}:force_original_aspect_ratio=decrease,pad=${size.w}:${size.h}:(ow-iw)/2:(oh-ih)/2`
    : 'scale=1920:-2';

  const inputPattern = `${pathForFfmpeg(workDir)}%06d.jpg`;
  const outputFile = pathForFfmpeg(outPath);
  const cmd = `-y -framerate ${fps} -i "${inputPattern}" -vf "${vfScale},format=yuv420p" -c:v libx264 -pix_fmt yuv420p "${outputFile}"`;

  onProgress?.(0.6);
  const session = await FFmpegKit.execute(cmd);
  onProgress?.(0.95);

  if (!ReturnCode.isSuccess(await session.getReturnCode())) {
    const logs = await session.getAllLogsAsString();
    throw new Error(logs?.slice(-400) || 'FFmpeg export failed');
  }

  const info = await FileSystem.getInfoAsync(outPath);
  if (!info.exists) throw new Error('Export file missing');
  onProgress?.(1);
  return outPath;
}
