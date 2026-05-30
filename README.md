# StopKadr

Stop motion на **Expo** (React Native): камера, onion skin, таймлайн, предпросмотр, экспорт MP4 (в dev/APK сборке).

**Без Mac:** разработка на Windows, запуск через **Expo Go**, APK через **EAS Build**.

## Быстрый старт

```powershell
npm install
npx expo install
npm start
```

Откройте проект в **Expo Go** на телефоне (QR в терминале).

## Установка

**[docs/INSTALL.ru.md](./docs/INSTALL.ru.md)** — Expo Go, EAS APK, Android Studio, iPhone через Expo Go.

## Стек

- Expo SDK 54, `expo-camera`, `expo-file-system`
- Экспорт видео: `ffmpeg-kit-react-native` (не в Expo Go — только в собранном APK/dev build)

## Архив native iOS (Swift)

Первый прототип на SwiftUI: `ios-native/` (нужен Mac + Xcode).

## Spec

[CURSOR_TASK.md](./CURSOR_TASK.md)
