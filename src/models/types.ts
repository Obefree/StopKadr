export type ExportResolution =
  | 'hd720'
  | 'fullHD1080'
  | 'vertical1080x1920'
  | 'square1080'
  | 'originalAspect';

export interface ProjectSettings {
  fps: number;
  onionSkinOpacity: number;
  captureDelaySeconds: number;
  resolution: ExportResolution;
  showGrid: boolean;
  gridDivisions: number;
  lockFocus: boolean;
  lockExposure: boolean;
  lockWhiteBalance: boolean;
}

export interface FrameItem {
  id: string;
  index: number;
  imagePath: string;
  createdAt: string;
  holdFrames: number;
}

export interface StopMotionProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  frames: FrameItem[];
}

export const defaultSettings = (): ProjectSettings => ({
  fps: 12,
  onionSkinOpacity: 0.4,
  captureDelaySeconds: 0,
  resolution: 'fullHD1080',
  showGrid: true,
  gridDivisions: 3,
  lockFocus: false,
  lockExposure: false,
  lockWhiteBalance: false,
});

export function sortFrames(project: StopMotionProject): FrameItem[] {
  return [...project.frames].sort((a, b) => a.index - b.index);
}

export function lastFrame(project: StopMotionProject): FrameItem | undefined {
  const sorted = sortFrames(project);
  return sorted[sorted.length - 1];
}
