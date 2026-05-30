import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import type { CameraRatio } from '../models/cameraTypes';

export type PreviewRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Первое число — ширина, второе — высота (16:9 → landscape-кадр). */
export function parseRatioWH(ratio: CameraRatio): { rw: number; rh: number } {
  const [rw, rh] = ratio.split(':').map(Number);
  return { rw, rh };
}

/** Ширина / высота кадра (16:9 → 16/9 ≈ 1.78). */
export function parseCameraAspect(ratio: CameraRatio): number {
  const { rw, rh } = parseRatioWH(ratio);
  return rw / rh;
}

/**
 * Рамка превью с сохранением «ширина:высота».
 * Портретный экран + 16:9 / 4:3: ширина кадра = ширина окна (16 по краю экрана).
 * Вертикальный формат (если будет 9:16): высота = высота окна.
 */
export function layoutPreviewRect(
  containerW: number,
  containerH: number,
  ratio: CameraRatio,
): PreviewRect {
  if (containerW <= 0 || containerH <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  const { rw, rh } = parseRatioWH(ratio);
  const portraitWindow = containerH > containerW;
  const landscapeFrame = rw > rh;
  const portraitFrame = rh > rw;

  if (portraitWindow && landscapeFrame) {
    const width = containerW;
    const height = (width * rh) / rw;
    return { left: 0, top: (containerH - height) / 2, width, height };
  }

  if (portraitWindow && portraitFrame) {
    const height = containerH;
    const width = (height * rw) / rh;
    return { left: (containerW - width) / 2, top: 0, width, height };
  }

  if (!portraitWindow && landscapeFrame) {
    const height = containerH;
    const width = (height * rw) / rh;
    return { left: (containerW - width) / 2, top: 0, width, height };
  }

  const side = Math.min(containerW, containerH);
  return {
    left: (containerW - side) / 2,
    top: (containerH - side) / 2,
    width: side,
    height: side,
  };
}

export function overlayResizeMode(_ratio: CameraRatio): 'cover' | 'contain' {
  return 'cover';
}

type Props = {
  ratio: CameraRatio;
  style?: ViewStyle;
  children: React.ReactNode;
};

export function CameraPreviewViewport({ ratio, style, children }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rect = layoutPreviewRect(size.w, size.h, ratio);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {rect.width > 0 ? (
        <View style={[styles.viewport, rect]} collapsable={false}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  viewport: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
