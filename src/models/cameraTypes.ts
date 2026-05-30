export type CameraFacing = 'back' | 'front';
export type CameraRatio = '4:3' | '16:9' | '1:1';
export type CameraFlash = 'off' | 'on' | 'auto';

export const CAMERA_RATIOS: CameraRatio[] = ['4:3', '16:9', '1:1'];

/** iOS AVFoundation device types → короткая подпись в UI */
export const LENS_LABELS: Record<string, string> = {
  builtInUltraWideCamera: '0.5× Ultra',
  builtInWideAngleCamera: '1× Wide',
  builtInTelephotoCamera: 'Telephoto',
  builtInDualCamera: 'Dual',
  builtInDualWideCamera: 'Dual Wide',
  builtInTripleCamera: 'Triple',
  builtInTrueDepthCamera: 'TrueDepth',
  builtInLiDARDepthCamera: 'LiDAR',
};

export function lensLabel(lensId: string): string {
  return LENS_LABELS[lensId] ?? lensId.replace(/^builtIn/, '').replace(/Camera$/, '');
}
