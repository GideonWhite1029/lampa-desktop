# Lampa Desktop

<img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" /> <img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" />


Данный проект является **неофициальным** приложением для просмотра фильмов и сериалов. Он создан на базе **Electron** и использует API различных сервисов для получения данных о фильмах и сериалах.

Исходники лампы доступны тут: https://github.com/yumata/lampa-source

## Задачи

- [x] Поддержка x64 и x32
- [x] Поддержка Linux
- [ ] Поддержка MacOS
- [ ] Автоматическое обновление
- [ ] Интеграция с Sentry

## Сборка

1. Импортируйте данный репозиторий к себе на устройство
2. Установите необходимые библиотеки - `npm install`
3. Для простого запуска и тестов - `electron .`
4. Для сборки под Windows - `electron-builder build --win`
5. Для сборки под Linux - `electron-builder build --linux`

## Лицензия

Этот проект распространяется под лицензией MIT. Подробнее смотрите в файле LICENSE.
