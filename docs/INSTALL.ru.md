# StopKadr — установка и первый запуск

Приложение собирается **только на Mac** с Xcode. На Windows репозиторий можно клонировать и редактировать код; для запуска на iPhone нужен Mac (или облачный Mac).

---

## 1. Что понадобится

| Требование | Минимум |
|------------|---------|
| Mac | macOS 14+ (Sonoma или новее) |
| Xcode | 15.0 или новее ([Mac App Store](https://apps.apple.com/app/xcode/id497799835)) |
| iPhone | iOS 17+, кабель USB / Wi‑Fi debugging |
| Apple ID | Бесплатный аккаунт достаточен для установки на свой телефон (7 дней, можно продлевать) |

Для публикации в App Store позже понадобится платный Apple Developer Program ($99/год).

---

## 2. Клонирование репозитория

На Mac (Terminal):

```bash
git clone https://github.com/Obefree/StopKadr.git
cd StopKadr
```

Если проект уже лежит в `Documents/GitHub/StopKadr` на Windows — скопируйте папку на Mac (iCloud, git pull, USB) или сделайте `git pull` после push.

---

## 3. Открытие в Xcode

1. Откройте файл **`StopKadr.xcodeproj`** (двойной клик или File → Open).
2. В левой панели выберите проект **StopKadr** → target **StopKadr** → вкладка **Signing & Capabilities**.
3. Включите **Automatically manage signing**.
4. В **Team** выберите свой Apple ID (Add Account… если пусто).
5. При необходимости смените **Bundle Identifier** на уникальный, например `com.ваше-имя.StopKadr` (если `com.obefree.StopKadr` занят).

---

## 4. Запуск на iPhone (рекомендуется)

Симулятор **не подходит** для полноценной съёмки — нужна реальная камера.

1. Подключите iPhone кабелем, разблокируйте, подтвердите «Доверять этому компьютеру».
2. На iPhone: **Настройки → Конфиденциальность → Режим разработчика** (если Xcode попросил — включите после первой установки).
3. В Xcode вверху выберите устройство — ваш **iPhone**, не Simulator.
4. Нажмите **Run** (▶) или `Cmd + R`.
5. При первом запуске разрешите **доступ к камере**.

Если сборка падает с signing error — проверьте Team и уникальный Bundle ID.

---

## 5. Первый сценарий в приложении

1. **New Project** → имя проекта.
2. Наведите кадр, при необходимости **Settings** → lock focus / grid.
3. Большая кнопка — **снимок кадра**; двигайте объект, повторяйте.
4. Регулируйте **onion skin** (прозрачность прошлого кадра).
5. **Play** — предпросмотр; **Export** — MP4 и share sheet (Файлы / Фото).

Кадры сохраняются локально и остаются после перезапуска приложения.

---

## 6. Cursor + Knowledge Base (опционально)

Чтобы агент видел KB и код:

1. Откройте workspace:  
   `C:\Users\lev\Documents\GitHub\Knowledge-base\Knowledge-base.code-workspace`
2. В нём есть папка **StopKadr**.
3. Маршрут в KB: `CONTEXT_ROUTER.md` → **Route: StopKadr**.

---

## 7. Частые проблемы

| Проблема | Решение |
|----------|---------|
| «No signing certificate» | Xcode → Settings → Accounts → Download Manual Profiles; выбрать Team |
| Чёрный экран камеры | Запуск на **реальном** iPhone, разрешение камеры в Настройках |
| Export не открывается | Сохранить через share sheet в «Файлы» или «Фото» |
| Сборка только на Windows | Нужен Mac с Xcode; альтернатива — MacinCloud / свой Mac mini |

---

## 8. Обновление кода

```bash
cd StopKadr
git pull origin main
```

Пересоберите в Xcode (`Cmd + R`).

Спецификация продукта: [CURSOR_TASK.md](../CURSOR_TASK.md).
