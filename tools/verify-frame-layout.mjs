function fitShootArea(boxW, boxH, ratio) {
  const [rw, rh] = ratio.split(':').map(Number);
  const aspect = rw / rh;
  if (boxW <= 0 || boxH <= 0) return { w: 0, h: 0 };
  if (boxW / boxH > aspect) {
    const h = boxH;
    return { w: h * aspect, h };
  }
  return { w: boxW, h: boxW / aspect };
}

function previewCoverScale(frameW, frameH, sensorAspect = 4 / 3) {
  if (frameW <= 0 || frameH <= 0) return 1;
  const scaledW = frameH * sensorAspect;
  if (scaledW < frameW) return frameW / scaledW;
  const scaledH = frameW / sensorAspect;
  return frameH / scaledH;
}

const box = { w: 390, h: 700 };
for (const r of ['16:9', '4:3', '1:1']) {
  const f = fitShootArea(box.w, box.h, r);
  const a = f.w / f.h;
  const [rw, rh] = r.split(':').map(Number);
  if (Math.abs(a - rw / rh) > 0.01) {
    console.error(`FAIL frame ${r}`);
    process.exit(1);
  }
}

const s169 = previewCoverScale(360, 202, 4 / 3);
if (s169 <= 1.01) {
  console.error('FAIL: 16:9 needs cover scale > 1');
  process.exit(1);
}
console.log('OK: frame + android cover');
