import React from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';

export type CameraRef = React.ElementRef<typeof CameraView> | null;

export async function captureStill(camera: CameraRef): Promise<string> {
  if (!camera) throw new Error('Камера не готова');
  const photo = await camera.takePictureAsync({
    quality: 0.92,
    skipProcessing: Platform.OS === 'android',
    exif: false,
  });
  if (!photo?.uri) throw new Error('Не удалось снять кадр');
  return photo.uri;
}
