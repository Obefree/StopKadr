import * as FileSystem from 'expo-file-system/legacy';
import { expandedFrameUris } from '../store/projectStore';
import { ExportResolution, StopMotionProject } from '../models/types';

const RESOLUTION_MAP: Record<ExportResolution, { w: number; h: number } | null> = {
  hd720: { w: 1280, h: 720 },
  fullHD1080: { w: 1920, h: 1080 },
  vertical1080x1920: { w: 1080, h: 1920 },
  square1080: { w: 1080, h: 1080 },
  originalAspect: null,
};

export type ExportProgress = (p: number) => void;

/** Requires dev build / EAS (ffmpeg-kit), not Expo Go. */
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
    throw new Error(
      'Экспорт MP4 недоступен в Expo Go. Соберите APK: npm run build:android:preview (EAS) или expo run:android.',
    );
  }

  const frames = expandedFrameUris(project);
  if (frames.length === 0) throw new Error('Нет кадров для экспорта.');

  const workDir = `${FileSystem.cacheDirectory}stopkadr-export-${project.id}/`;
  await FileSystem.deleteAsync(workDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(workDir, { intermediates: true });

  for (let i = 0; i < frames.length; i++) {
    const dest = `${workDir}${String(i + 1).padStart(6, '0')}.jpg`;
    await FileSystem.copyAsync({ from: frames[i], to: dest });
    onProgress?.((i + 1) / frames.length * 0.5);
  }

  const fps = Math.max(1, project.settings.fps);
  const outPath = `${workDir}export.mp4`;
  const size = RESOLUTION_MAP[project.settings.resolution];
  const vfScale = size
    ? `scale=${size.w}:${size.h}:force_original_aspect_ratio=decrease,pad=${size.w}:${size.h}:(ow-iw)/2:(oh-ih)/2`
    : 'scale=1920:-2';

  const inputPattern = `${workDir.replace('file://', '')}%06d.jpg`;
  const outputFile = outPath.replace('file://', '');
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
