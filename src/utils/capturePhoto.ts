import React from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

export type CameraRef = React.ElementRef<typeof CameraView> | null;

export type CaptureOptions = {
  quality?: number;
  cropSquare?: boolean;
};

async function cropCenterSquare(
  uri: string,
  width: number,
  height: number,
  quality: number,
): Promise<string> {
  const side = Math.min(width, height);
  const originX = Math.round((width - side) / 2);
  const originY = Math.round((height - side) / 2);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX, originY, width: side, height: side } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result.uri;
}

export async function captureStill(
  camera: CameraRef,
  options: CaptureOptions = {},
): Promise<string> {
  const quality = Math.min(1, Math.max(0.5, options.quality ?? 0.92));
  if (!camera) throw new Error('Камера не готова');

  const photo = await camera.takePictureAsync({
    quality,
    skipProcessing: Platform.OS === 'android' && !options.cropSquare,
    exif: false,
    shutterSound: true,
  });
  if (!photo?.uri) throw new Error('Не удалось снять кадр');

  if (options.cropSquare && photo.width > 0 && photo.height > 0) {
    return cropCenterSquare(photo.uri, photo.width, photo.height, quality);
  }

  return photo.uri;
}
