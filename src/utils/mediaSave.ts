import { Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { ensureFileUri } from './paths';

/** Save exported MP4 to gallery or open share sheet (Android + iOS). */
export async function saveVideoToDevice(localUri: string): Promise<void> {
  const uri = ensureFileUri(localUri);

  if (Platform.OS === 'android') {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status === 'granted') {
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Готово', 'Видео сохранено в галерею');
      return;
    }
  } else {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Готово', 'Видео сохранено в Фото');
      return;
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'video/mp4',
      dialogTitle: 'StopKadr — экспорт',
    });
    return;
  }

  throw new Error('Нет доступа к галерее. Разрешите сохранение в настройках приложения.');
}
