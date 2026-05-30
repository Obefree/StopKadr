import { Platform } from 'react-native';
import type { CameraRatio } from '../models/cameraTypes';

/**
 * expo-camera на Android для 1:1 фильтрует только квадратные разрешения сенсора —
 * на многих устройствах список пустой → зависание превью. Снимаем в 4:3, кадр обрезаем.
 */
export function nativeCameraRatio(userRatio: CameraRatio): CameraRatio {
  if (Platform.OS === 'android' && userRatio === '1:1') {
    return '4:3';
  }
  return userRatio;
}

export function shouldCropCaptureToSquare(userRatio: CameraRatio): boolean {
  return Platform.OS === 'android' && userRatio === '1:1';
}
