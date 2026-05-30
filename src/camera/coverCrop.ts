/** Центральный crop «как cover» под aspect рамки (совпадает с FILL превью CameraX). */
export function coverCropRect(
  imgW: number,
  imgH: number,
  frameAspect: number,
): { originX: number; originY: number; width: number; height: number } {
  const imgAspect = imgW / imgH;
  if (imgAspect > frameAspect) {
    const cropH = imgH;
    const cropW = Math.round(imgH * frameAspect);
    return {
      originX: Math.round((imgW - cropW) / 2),
      originY: 0,
      width: cropW,
      height: cropH,
    };
  }
  const cropW = imgW;
  const cropH = Math.round(imgW / frameAspect);
  return {
    originX: 0,
    originY: Math.round((imgH - cropH) / 2),
    width: cropW,
    height: cropH,
  };
}
