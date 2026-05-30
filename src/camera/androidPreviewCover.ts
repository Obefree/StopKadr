/** Android CameraX без ratio ≈ превью 4:3. Масштаб cover как у Image resizeMode="cover". */
export const ANDROID_SENSOR_ASPECT = 4 / 3;

export function previewCoverScale(
  frameW: number,
  frameH: number,
  sensorAspect: number = ANDROID_SENSOR_ASPECT,
): number {
  if (frameW <= 0 || frameH <= 0 || sensorAspect <= 0) return 1;
  const scaledW = frameH * sensorAspect;
  if (scaledW < frameW) return frameW / scaledW;
  const scaledH = frameW / sensorAspect;
  return frameH / scaledH;
}
