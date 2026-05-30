# StopKadr — установка

**Приоритет платформы:** iOS (качество камеры и UX) → **Android** полностью поддержан с Windows.

Стек: **Expo** — Mac не обязателен для Android.

---

## Быстрый старт (Expo Go — Android и iPhone)

```powershell
cd StopKadr
npm install
npx expo install
npm start
```

Телефон: **Expo Go**, та же Wi‑Fi, скан QR.

| В Expo Go | Android | iOS |
|-----------|---------|-----|
| Съёмка, onion, timeline, Play | ✅ | ✅ |
| Export MP4 | ❌ | ❌ |
| ZIP / на ПК по Wi‑Fi | ✅ | ✅ |

---

## Сохранение файлов (iPhone, второй телефон, ПК)

Кадры **всегда** лежат на телефоне в памяти приложения. Дополнительно:

### На этом iPhone

В редакторе проекта → **«Сохранить»** → **«Архив проекта (ZIP)»** → «Сохранить в Файлы» или AirDrop.

### На ПК (та же Wi‑Fi)

1. На компьютере в папке StopKadr:

```powershell
npm run dev
```

(поднимает приёмник на порту **8792** и Expo)  
или отдельно: `npm run pc-sync`

2. На телефоне: **«Сохранить»** → **«Отправить проект на ПК»**.  
   В Expo Go IP ПК подставится сам (как у Metro). Иначе введите IP вручную.

3. На ПК проекты в папке: `Documents\StopKadr-Inbox\`

### На другом телефоне / планшете в Wi‑Fi

- **AirDrop / ZIP** с первого iPhone, или  
- После отправки на ПК откройте в браузере второго устройства:  
  `http://<IP-ПК>:8792/browse` — скачать ZIP проекта.

---

## Android — полное приложение (Windows)

Нужны: Node 20, [Android Studio](https://developer.android.com/studio) (SDK + JBR).

### Вариант A: локальный APK (рекомендуется на Windows)

```powershell
build-apk-release.bat
```

Готовый файл: `dist\StopKadr-release_*.apk` → установить на телефон.

В APK работает **Export MP4** (FFmpeg).

### Вариант B: облако EAS

```powershell
npm install -g eas-cli
eas login
eas init
npm run build:android:preview
```

---

## iOS — приоритет (нужен Mac или EAS)

| Способ | Mac |
|--------|-----|
| Expo Go + `npm start` | не нужен |
| `npm run ios` / Xcode | нужен |
| `npm run build:ios:preview` (EAS) | не нужен (облако) |

На Mac:

```bash
npm install
npx expo prebuild --platform ios
open ios/StopKadr.xcworkspace   # или .xcodeproj после prebuild
```

Signing: Team в Xcode → Run на iPhone.

---

## Сравнение сборок

| | Expo Go | APK (Android) | IPA (iOS EAS) |
|--|---------|---------------|---------------|
| Камера / кадры | ✅ | ✅ | ✅ |
| Export MP4 | ❌ | ✅ | ✅ |
| Сборка с Windows | ✅ | ✅ | только EAS |

---

## Первый сценарий

1. Новый проект (+).
2. Съёмка, onion skin, FPS.
3. Play — проверка движения.
4. Export — в APK/IPA (не в Expo Go).

---

## Проблемы

| Проблема | Решение |
|----------|---------|
| Камера Android чёрная | Разрешение камеры; перезапуск; не эмулятор без camera |
| Export в Go | Соберите APK (`build-apk-release.bat`) |
| Gradle ошибка | Android Studio SDK; `npx expo prebuild --clean` |
| iOS signing | Xcode → Team, уникальный bundle id |

[CURSOR_TASK.md](../CURSOR_TASK.md) — продуктовая спецификация.
