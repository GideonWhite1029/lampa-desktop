# Lampa Desktop

<img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" /> <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />


Данный проект является **неофициальным** приложением для просмотра фильмов и сериалов. Он создан на базе **Electron** и использует API различных сервисов для получения данных о фильмах и сериалах.

Исходники лампы доступны тут: https://github.com/yumata/lampa-source

## Возможности

- Внешние плееры (VLC, MPC-HC/BE/QT, KMPlayer, mpv и др.) с сохранением тайм-кода — Настройки → Плеер → «Внешний». Путь к плееру определяется автоматически.
- Картинка в картинке (`Ctrl+P`) и мини-плеер поверх окон (`Ctrl+Shift+P`).
- Экран не гаснет во время воспроизведения, окно запоминает размер и позицию.
- **Автообновление ядра Lampa**: при запуске приложение проверяет `yumata/lampa` и подтягивает свежие `app.js`/`app.css` без переустановки. Переключается в меню «Обновления».
- Автообновление самого приложения (electron) через GitHub Releases.

## Сборка

```
npm ci
npm run make      # текущая платформа
npm start         # запуск в режиме разработки
```

Форматы:

| ОС | Артефакты |
|----|-----------|
| Windows (x86, x64) | Squirrel `Setup.exe` + `nupkg` + `RELEASES`, `.msi` (WiX), портативный `.zip` |
| Linux (x64) | `.deb`, `.rpm`, `.AppImage`, `.flatpak`, портативный `.zip` |

Тяжёлые мейкеры можно отключить для локальной сборки переменными окружения:
`LAMPA_SKIP_FLATPAK=1` (нужен `flatpak-builder`), `LAMPA_SKIP_WIX=1` (нужен WiX Toolset v3),
`LAMPA_SKIP_APPIMAGE=1` (нужен `mksquashfs`).

CI (`.github/workflows`):

- `build.yml` — на каждый push в `main` собирает и публикует Windows (x86/x64) и Linux (x64) в draft-релиз; на PR — только сборка с артефактами. Раннеры сами ставят WiX, flatpak-builder + рантаймы, squashfs-tools.
- `update-lampa.yml` — ежедневно синхронизирует `src/` с `yumata/lampa` (`node scripts/update-lampa.mjs`), коммитит изменения и запускает `build.yml`.

## Задачи

- [x] Поддержка x64 и x32 (для Linux только x64)
- [x] Поддержка Linux
- [x] Автоматическое обновление приложения и ядра Lampa
- [x] Внешние плееры, PiP, мини-плеер
- [ ] Поддержка MacOS

## Лицензия

Этот проект распространяется под лицензией GPL-2.0. Подробнее смотрите в файле LICENSE.
