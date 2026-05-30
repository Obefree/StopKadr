import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import type { CameraView } from 'expo-camera';

export function useCameraCapabilities() {
  const [lenses, setLenses] = useState<string[]>([]);
  const [pictureSizes, setPictureSizes] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async (camera: React.ElementRef<typeof CameraView> | null) => {
    if (!camera) return;
    setReady(true);
    try {
      const sizes = await camera.getAvailablePictureSizesAsync();
      setPictureSizes(sizes.sort((a, b) => {
        const pa = parseSize(a);
        const pb = parseSize(b);
        return pb.w * pb.h - pa.w * pa.h;
      }));
    } catch {
      setPictureSizes([]);
    }
    if (Platform.OS === 'ios') {
      try {
        const available = await camera.getAvailableLensesAsync();
        setLenses(available);
      } catch {
        setLenses([]);
      }
    } else {
      setLenses([]);
    }
  }, []);

  return { lenses, pictureSizes, ready, refresh, setLenses };
}

function parseSize(s: string): { w: number; h: number } {
  const m = s.match(/(\d+)\s*x\s*(\d+)/i);
  if (m) return { w: Number(m[1]), h: Number(m[2]) };
  return { w: 0, h: 0 };
}
