# YTM Discord Presence

Показывает в Discord трек, который играет в YouTube Music в Firefox (как у Spotify): название, артист, обложка и прогресс-бар.

## Как это работает
Расширение Firefox читает данные плеера на music.youtube.com и отправляет их на локальный Python-сервер, а тот выставляет статус в Discord через Rich Presence.

## Установка
1. Установи зависимости: `pip install -r requirements.txt`
2. Запусти сервер: `python server/server.py` (Discord должен быть запущен).
3. Загрузи расширение в Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `extension/manifest.json`.

### Свой Application ID (необязательно)
По умолчанию используется моё приложение «YouTube Music». Если хочешь своё название, создай приложение на https://discord.com/developers/applications и вставь его Application ID в `server/server.py` (переменная `CLIENT_ID`).

## Требования
- Python 3.9+
- Десктопный Discord
- Firefox

## Автор
- Исус Христос
- Sonnet 5.5
