# StopKadr — задание для Cursor

## Контекст проекта

Нужно разработать собственное мобильное приложение для stop motion съёмки. Первый целевой вариант — iPhone / iOS.

Приложение должно быть не просто галереей кадров, а рабочим инструментом для покадровой анимации: диорамы, миниатюры, куклы, предметная анимация, ролики для YouTube Shorts, Reels, TikTok и обычного YouTube.

Главный приоритет: стабильная интеграция с камерой, удобная покадровая съёмка, onion skin, таймлайн кадров, предпросмотр и экспорт видео.

---

## Техническая цель

Создать iOS-приложение на Swift / SwiftUI с использованием AVFoundation.

Важно: не использовать системный camera picker как основной способ съёмки. Нужен собственный live camera preview внутри приложения.

Использовать:

- Swift
- SwiftUI
- AVFoundation
- AVCaptureSession
- AVCapturePhotoOutput
- AVAssetWriter для экспорта видео
- FileManager для локального хранения проектов и кадров

Минимальная цель: стабильный локальный MVP без backend, авторизации, облака и AI-функций.

---

## Важное продуктологическое правило

Не вводить искусственные ограничения, если они не нужны технически.

Например, для таймера съёмки не делать только фиксированный список вроде `0 / 1 / 2 / 3 sec`.

Нужно реализовывать настройки гибко:

- пользователь может выбрать значение из удобного UI;
- UI может иметь быстрые пресеты, но должен позволять произвольное или расширяемое значение;
- архитектура не должна быть завязана на жёсткий enum из нескольких секунд;
- если сейчас в MVP сделаны пресеты, модель данных всё равно должна хранить обычное число, например `captureDelaySeconds: Double`.

Такой же подход применить к FPS, opacity onion skin, длительности удержания кадра, экспорту, размеру сетки и другим настройкам.

---

## Цель MVP

Пользователь должен иметь возможность:

1. Создать stop motion проект.
2. Открыть экран камеры.
3. Видеть live preview с камеры.
4. Делать кадры по одному.
5. Видеть предыдущий кадр поверх live preview через onion skin.
6. Регулировать прозрачность onion skin.
7. Смотреть список / таймлайн снятых кадров.
8. Удалять последний кадр и выбранные кадры.
9. Проигрывать анимацию внутри приложения.
10. Менять FPS предпросмотра и проекта.
11. Экспортировать результат в `.mp4`.
12. Сохранять проект локально и открывать его после перезапуска приложения.

---

## Название приложения

Рабочее название: **StopKadr**.

---

## Архитектура проекта

Сделать модульно. Не складывать всю логику в один View.

Рекомендуемая структура:

```text
StopKadr/
  App/
    StopKadrApp.swift

  Models/
    StopMotionProject.swift
    FrameItem.swift
    ProjectSettings.swift
    ExportResolution.swift

  Camera/
    CameraService.swift
    CameraPreviewView.swift
    CameraViewModel.swift
    CameraPermissionManager.swift

  Project/
    ProjectStore.swift
    ProjectListView.swift
    ProjectEditorView.swift
    NewProjectView.swift

  Timeline/
    FrameTimelineView.swift
    FrameThumbnailView.swift
    FrameActionsView.swift

  Playback/
    PlaybackView.swift
    PlaybackViewModel.swift

  Export/
    VideoExporter.swift
    ExportSettingsView.swift

  UI/
    CaptureButton.swift
    OnionSkinControl.swift
    FPSControl.swift
    CameraGridOverlay.swift
    SettingsPanel.swift
```

---

## Модели данных

### StopMotionProject

```swift
struct StopMotionProject: Identifiable, Codable {
    let id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var settings: ProjectSettings
    var frames: [FrameItem]
}
```

### FrameItem

```swift
struct FrameItem: Identifiable, Codable {
    let id: UUID
    var index: Int
    var imagePath: String
    var createdAt: Date
    var holdFrames: Int
}
```

`holdFrames` нужен, чтобы один кадр можно было удерживать дольше без физического дублирования файла.

### ProjectSettings

```swift
struct ProjectSettings: Codable {
    var fps: Double
    var onionSkinOpacity: Double
    var captureDelaySeconds: Double
    var resolution: ExportResolution
    var showGrid: Bool
    var gridDivisions: Int
    var lockFocus: Bool
    var lockExposure: Bool
    var lockWhiteBalance: Bool
}
```

Важно: `fps` и `captureDelaySeconds` должны быть числами, а не ограниченными enum-значениями.

### ExportResolution

```swift
enum ExportResolution: String, Codable, CaseIterable {
    case hd720
    case fullHD1080
    case vertical1080x1920
    case square1080
    case originalAspect
}
```

---

## Экран списка проектов

Сделать `ProjectListView`.

Функции:

- список проектов;
- кнопка создания нового проекта;
- открытие проекта;
- удаление проекта;
- отображение названия;
- количество кадров;
- дата обновления;
- миниатюра последнего кадра.

---

## Экран редактора проекта

Сделать `ProjectEditorView`.

На экране:

- live camera preview;
- onion skin overlay;
- большая кнопка capture;
- undo last frame;
- play / preview;
- export;
- настройки;
- timeline снизу;
- быстрый доступ к FPS;
- быстрый доступ к opacity onion skin;
- быстрый доступ к capture delay.

---

## Камера

Сделать `CameraService`.

Требования:

- использовать `AVCaptureSession`;
- показывать live camera preview;
- делать фото через `AVCapturePhotoOutput`;
- сохранять кадр в папку проекта;
- возвращать путь к файлу;
- поддерживать разрешения камеры;
- корректно обрабатывать отказ в разрешении;
- поддерживать переключение доступных камер, если устройство это позволяет:
  - wide;
  - ultra wide;
  - telephoto;
  - front / back.

---

## Настройки камеры для MVP

Обязательно:

- lock focus;
- lock exposure;
- tap to focus;
- grid overlay;
- capture delay;
- возможность снимать без касания основной preview-зоны;
- сохранение настроек проекта.

Важно по capture delay:

- не делать жёсткий список секунд;
- хранить значение как `Double`;
- UI может быть slider / stepper / text input / preset buttons plus custom value;
- пользователь должен иметь возможность выбрать подходящее значение, а не только несколько заранее заданных вариантов.

---

## Onion Skin

Сделать onion skin overlay.

Поведение:

- если в проекте есть хотя бы один кадр, последний кадр показывается поверх live camera preview;
- прозрачность регулируется пользователем;
- значение хранится как `Double` в диапазоне `0...1`;
- UI должен позволять плавное изменение;
- live preview должен оставаться видимым.

В будущем заложить возможность:

- показывать не только последний кадр, но и несколько предыдущих;
- выбирать reference frame;
- включать/выключать onion skin быстро.

---

## Timeline

Сделать горизонтальный таймлайн кадров.

Функции:

- миниатюры кадров;
- номер кадра;
- выделение выбранного кадра;
- удаление выбранного кадра;
- удаление последнего кадра;
- изменение `holdFrames`;
- возможность переснять последний кадр.

Drag reorder можно заложить архитектурно, но не обязательно делать в MVP.

---

## Playback

Сделать предпросмотр анимации внутри приложения.

Требования:

- проигрывание кадров с FPS из настроек проекта;
- FPS хранить как `Double`;
- UI может иметь быстрые кнопки с популярными значениями, но не должен ограничивать пользователя только ими;
- loop playback;
- play / pause;
- scrub по кадрам;
- учитывать `holdFrames`.

---

## Экспорт видео

Сделать `VideoExporter`.

Требования:

- собрать `.mp4` из последовательности изображений;
- использовать `AVAssetWriter`;
- учитывать FPS проекта;
- учитывать `holdFrames`;
- поддержать форматы:
  - 1920x1080 horizontal;
  - 1080x1920 vertical;
  - 1080x1080 square;
  - 1280x720 horizontal;
  - original aspect.

После экспорта:

- показать share sheet;
- дать сохранить в Files / Photos;
- показать ошибку, если экспорт не удался;
- не блокировать UI без статуса прогресса.

---

## Локальное хранение данных

Каждый проект хранить локально:

```text
Documents/
  StopKadr/
    Projects/
      project-id/
        project.json
        frames/
          000001.jpg
          000002.jpg
          000003.jpg
```

`project.json` должен содержать метаданные проекта, настройки и список кадров.

---

## UI / UX

Стиль:

- минималистичный;
- тёмная тема;
- крупная кнопка capture;
- снизу timeline;
- настройки не должны мешать съёмке;
- главный экран должен ощущаться как рабочая камера аниматора, а не обычная галерея.

Главный приоритет UX:

- быстро снять кадр;
- быстро увидеть прошлый кадр;
- быстро проверить движение;
- быстро удалить ошибочный кадр;
- быстро экспортировать черновик.

---

## Основной пользовательский сценарий

```text
1. Пользователь открывает приложение.
2. Нажимает New Project.
3. Вводит название проекта.
4. Попадает на экран камеры.
5. Ставит iPhone на штатив.
6. Настраивает кадр.
7. Фиксирует фокус, экспозицию и баланс белого.
8. Делает первый кадр.
9. Двигает объект.
10. Видит предыдущий кадр через onion skin.
11. Делает следующий кадр.
12. Повторяет.
13. Нажимает Play.
14. Видит черновую анимацию.
15. Меняет FPS при необходимости.
16. Удаляет или удерживает отдельные кадры.
17. Экспортирует mp4.
```

---

## Этап 1 — MVP

Сначала реализовать только:

- Project list;
- Create project;
- Local project storage;
- Camera preview;
- Capture frame;
- Save captured frames;
- Onion skin from last frame;
- Timeline thumbnails;
- Delete last frame;
- Playback frames at flexible FPS;
- Export mp4.

После каждого этапа приложение должно компилироваться.

---

## Этап 2 — улучшение камеры

После рабочего MVP добавить:

- focus lock;
- exposure lock;
- tap to focus;
- grid overlay;
- flexible timer / capture delay;
- camera lens switch;
- manual focus;
- manual exposure;
- white balance lock.

---

## Этап 3 — pro-функции

После стабильной основы добавить:

- import images from Photos;
- duplicate frame;
- hold frame for N frames;
- scenes / shots;
- audio reference track;
- waveform;
- remote trigger;
- Apple Watch trigger;
- voice / noise trigger;
- interval capture;
- project backup / export;
- iCloud sync;
- drawing guides;
- safe frame overlays for Shorts / Reels / YouTube;
- custom aspect ratio;
- multiple onion skin reference frames.

---

## Критерии готовности MVP

MVP считается готовым, если:

1. Приложение запускается на iPhone simulator и реальном iPhone.
2. На реальном iPhone открывается live preview камеры.
3. Можно создать проект.
4. Можно сделать минимум 20 кадров подряд.
5. Кадры сохраняются локально.
6. После перезапуска приложения проект и кадры остаются.
7. Последний кадр накладывается поверх камеры как onion skin.
8. Можно проиграть снятую последовательность.
9. Можно менять FPS как числовую настройку, а не только как фиксированный список.
10. Можно настроить delay capture как числовую настройку, а не только как фиксированный список.
11. Можно экспортировать `.mp4`.
12. Экспортированное видео открывается в Photos / Files.

---

## Прямое первое задание для Cursor

Начни с создания стабильного локального MVP.

Сделай по шагам:

1. Создай SwiftUI app structure.
2. Добавь модели `StopMotionProject`, `FrameItem`, `ProjectSettings`, `ExportResolution`.
3. Добавь `ProjectStore` для локального сохранения и загрузки проектов.
4. Добавь `ProjectListView`.
5. Добавь `ProjectEditorView` с camera area.
6. Подключи реальную камеру через `AVCaptureSession`.
7. Добавь capture через `AVCapturePhotoOutput`.
8. Добавь сохранение кадров в папку проекта.
9. Добавь onion skin overlay.
10. Добавь timeline.
11. Добавь playback.
12. Добавь export через `AVAssetWriter`.

После каждого этапа проверяй, что проект компилируется.

---

## Запреты для первого этапа

Не делать backend.
Не делать авторизацию.
Не делать облако.
Не делать AI-функции.
Не подключать сторонние camera SDK.
Не делать всё в одном файле.
Не хардкодить настройки там, где должен быть гибкий пользовательский выбор.

---

## Короткий промпт для Cursor

```text
Create an iOS SwiftUI stop motion app called StopKadr.

Use Swift, SwiftUI and AVFoundation. The app must have real camera integration using AVCaptureSession and AVCapturePhotoOutput, not the system camera picker.

MVP requirements:
- project list
- create project
- local project storage
- live camera preview
- capture still frames
- save frames into project folder
- show last captured frame as onion skin overlay on top of live camera preview
- opacity slider for onion skin
- horizontal frame timeline with thumbnails
- delete last frame
- playback captured frames at flexible FPS
- export mp4 from frames using AVAssetWriter
- share/export the final video

Important: do not hardcode artificial limits for settings. For example, capture delay must not be only 0/1/2/3 seconds. Store it as a numeric value such as Double and build UI that allows flexible user selection. The same principle applies to FPS and other user-adjustable settings.

Architecture:
- CameraService for AVFoundation camera logic
- ProjectStore for saving/loading projects
- VideoExporter for mp4 export
- SwiftUI views for project list, editor, timeline, playback

Do not add backend, auth, cloud sync, AI or complex pro features yet.
First build a stable local MVP that compiles and works on a real iPhone.
Implement step by step and keep the code modular.
```
