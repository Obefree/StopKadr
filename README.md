# StopKadr

Stop motion на **Expo** (React Native): камера, onion skin, таймлайн, предпросмотр, экспорт MP4.

**Платформы:** **iOS — приоритет** (качество, EAS/Xcode). **Android** — полностью с Windows (Expo Go + `build-apk-release.bat`).

## Быстрый старт

```powershell
npm install
npx expo install
npm start
```

Expo Go на **Android или iPhone** (QR). MP4 export — в собранном APK/IPA.

**Android APK (Windows):** `build-apk-release.bat` → `dist\StopKadr-release_*.apk`

## Установка

**[docs/INSTALL.ru.md](./docs/INSTALL.ru.md)** — установка.  
**[docs/STORAGE.ru.md](./docs/STORAGE.ru.md)** — где на iPhone лежат проекты и кадры.

## Стек

- Expo SDK 54, `expo-camera`, `expo-file-system`
- Экспорт видео: `ffmpeg-kit-react-native` (не в Expo Go — только в собранном APK/dev build)

## Архив native iOS (Swift)

Первый прототип на SwiftUI: `ios-native/` (нужен Mac + Xcode).

## Spec

[CURSOR_TASK.md](./CURSOR_TASK.md)
