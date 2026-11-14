import json
import time
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pypresence import Presence, ActivityType

CLIENT_ID = "1571152150162047129"

rpc = Presence(CLIENT_ID)
rpc.connect()

lock = threading.Lock()
state = {"key": None, "start": 0, "tab": None, "last_seen": 0}


def clear():
    if state["key"] is None:
        return
    state["key"] = None
    with lock:
        try:
            rpc.clear()
        except Exception as e:
            print("Ошибка Discord:", e)


def update(d):
    tab = d.get("tab")

    if not d.get("playing"):
        # «Пауза» от чужой вкладки игнорируем
        if tab == state["tab"]:
            clear()
        return

    state["tab"] = tab
    state["last_seen"] = time.time()

    key = (d["title"], d["artist"])
    start = time.time() - d["position"]

    if key == state["key"] and abs(start - state["start"]) < 3:
        return
    state["key"], state["start"] = key, start

    args = dict(
        activity_type=ActivityType.LISTENING,
        details=d["title"][:128],
        state=d["artist"][:128],
        large_image=d.get("cover"),
        large_text=(d.get("album") or d["title"])[:128],
        start=int(start),
        end=int(start + d["duration"]),
    )
    with lock:
        try:
            rpc.update(**args)
        except Exception as e:
            print("Ошибка Discord:", e)


def watchdog():
    # Если 8 секунд нет данных (вкладку закрыли), убираем статус
    while True:
        time.sleep(2)
        if state["key"] is not None and time.time() - state["last_seen"] > 8:
            clear()


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        update(json.loads(self.rfile.read(length)))
        self.send_response(200)
        self.end_headers()

    def log_message(self, *args):
        pass


threading.Thread(target=watchdog, daemon=True).start()
print("Сервер запущен на 127.0.0.1:8765")
HTTPServer(("127.0.0.1", 8765), Handler).serve_forever()