# StopKadr — установка (Expo, без Mac)

Основной стек: **Expo / React Native**. Разработка и сборка APK — на **Windows**. Mac не нужен.

Нативный Swift-проект (архив): папка `ios-native/` — только если позже понадобится чистый iOS.

---

## 1. Что понадобится

| | |
|---|---|
| **Windows** | Node.js 20 LTS, npm |
| **Телефон** | Android (Expo Go) или iPhone (Expo Go из App Store) |
| **Опционально** | Android Studio — для `expo run:android` локально |
| **Опционально** | Аккаунт [expo.dev](https://expo.dev) — для облачной сборки APK (EAS) |

---

## 2. Клонирование и зависимости

```powershell
git clone https://github.com/Obefree/StopKadr.git
cd StopKadr
npm install
npx expo install
```

`npx expo install` подтянет версии пакетов, совместимые с SDK 54.

---

## 3. Запуск в Expo Go (самый быстрый старт)

1. На телефон установите **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent), [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. ПК и телефон — **одна Wi‑Fi сеть**.
3. В папке проекта:

```powershell
npm start
```

4. Отсканируйте QR-код в терминале (или в браузере Metro).
5. Разрешите **камеру** в приложении.

**В Expo Go работает:** проекты, съёмка, onion skin, таймлайн, предпросмотр.

**В Expo Go не работает:** экспорт MP4 (нужен dev build / APK с FFmpeg — см. ниже).

---

## 4. Сборка APK без Mac (EAS Build)

1. Установите EAS CLI: `npm install -g eas-cli`
2. Войдите: `eas login`
3. Привяжите проект (один раз): `eas init`
4. Сборка preview APK:

```powershell
npm run build:android:preview
```

5. Скачайте APK по ссылке из expo.dev и установите на Android.

В этой сборке доступен **экспорт MP4** (ffmpeg-kit).

---

## 5. Локальная сборка Android (если есть Android Studio)

```powershell
npx expo prebuild --platform android
npm run android
```

Или подключите устройство и `npx expo run:android`.

---

## 6. iPhone без Mac

- **Разработка:** Expo Go из App Store + `npm start` (как на Android).
- **Установка standalone .ipa без Mac:** только через **EAS Build** (`eas build -p ios`) с Apple Developer аккаунтом; на Windows это делается в облаке Expo, Mac не нужен.

---

## 7. Первый сценарий

1. **+** → новый проект.
2. Снимайте кадры (большая белая кнопка).
3. Onion skin — ползунок «Onion %».
4. **Play** — предпросмотр.
5. **Export** — в APK/EAS build; в Expo Go появится подсказка собрать APK.

Данные: `Documents/StopKadr/Projects/` на устройстве.

---

## 8. Cursor + Knowledge Base

Workspace: `Knowledge-base.code-workspace` → папка **StopKadr**.  
Маршрут KB: `CONTEXT_ROUTER.md` → **StopKadr**.

---

## 9. Частые проблемы

| Проблема | Решение |
|----------|---------|
| QR не открывается | Одна сеть Wi‑Fi; попробуйте `npx expo start --tunnel` |
| Камера чёрная | Разрешение камеры; перезапуск Expo Go |
| Export в Expo Go | Соберите APK: `npm run build:android:preview` |
| `npm install` ошибки | Node 20+, удалите `node_modules`, снова `npm install` |

Спецификация: [CURSOR_TASK.md](../CURSOR_TASK.md).
