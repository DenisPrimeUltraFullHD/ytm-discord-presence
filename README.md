# YTM Discord Presence

Показывает в Discord трек, который играет в YouTube Music в Firefox (как у Spotify): название, артист, обложка и прогресс-бар.

## Как это работает
Расширение Firefox читает данные плеера на music.youtube.com и отправляет их на локальный Python-сервер, а тот выставляет статус в Discord через Rich Presence.

## Установка
1. Создай приложение на https://discord.com/developers/applications, назови его «YouTube Music» и скопируй Application ID.
2. Вставь ID в `server/server.py` (переменная `CLIENT_ID`).
3. Установи зависимости: `pip install -r requirements.txt`
4. Запусти сервер: `python server/server.py` (Discord должен быть запущен).
5. Загрузи расширение в Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `extension/manifest.json`.

## Требования
- Python 3.9+
- Десктопный Discord
- Firefox

## Автор
- Исус Христос
- Sonnet 5.5
