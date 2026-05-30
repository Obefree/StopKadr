import React from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';

export type CameraRef = React.ElementRef<typeof CameraView> | null;

export async function captureStill(camera: CameraRef, quality = 0.92): Promise<string> {
  if (!camera) throw new Error('Камера не готова');
  const photo = await camera.takePictureAsync({
    quality: Math.min(1, Math.max(0.5, quality)),
    skipProcessing: Platform.OS === 'android',
    exif: false,
    shutterSound: true,
  });
  if (!photo?.uri) throw new Error('Не удалось снять кадр');
  return photo.uri;
}
