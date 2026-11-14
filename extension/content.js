function toSeconds(str) {
  const parts = str.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function getPlayer() {
  const el = document.querySelector("#movie_player");
  return el ? el.wrappedJSObject : null;
}

// Способ 1: ищем в панели плеера текст вида «0:20 / 2:19» (без привязки к классам)
function readBarText() {
  const bar = document.querySelector("ytmusic-player-bar");
  if (!bar) return null;
  const re = /^\s*(\d+(?::\d+)+)\s*\/\s*(\d+(?::\d+)+)\s*$/;
  for (const el of bar.querySelectorAll("*")) {
    if (el.children.length) continue;
    const m = re.exec(el.textContent);
    if (m) {
      const position = toSeconds(m[1]);
      const duration = toSeconds(m[2]);
      if (position !== null && duration) return { position, duration };
    }
  }
  return null;
}

// Способ 2 и 3: данные из плеера YouTube
function readApi() {
  try {
    const api = getPlayer();
    if (!api) return null;
    const position = api.getCurrentTime();
    let duration = null;
    try {
      const len = Number(api.getPlayerResponse().videoDetails.lengthSeconds);
      if (len > 0) duration = len;
    } catch (e) {}
    return { position, duration, rawDuration: api.getDuration() };
  } catch (e) {
    return null;
  }
}

function getTimes() {
  const text = readBarText();
  const api = readApi();

  const position = api ? api.position : text ? text.position : null;
  if (position === null) return null;

  if (text && text.duration >= position - 1) {
    return { position, duration: text.duration, src: "text" };
  }
  if (api && api.duration && api.duration >= position - 1) {
    return { position, duration: api.duration, src: "meta" };
  }
  if (api && api.rawDuration > 0) {
    return { position, duration: api.rawDuration, src: "raw" };
  }
  return null;
}

function getInfo() {
  const md = navigator.mediaSession.metadata;
  const video = document.querySelector("video");
  if (!md || !md.title || !video) return { playing: false };

  const times = getTimes();
  if (!times) return { playing: false };

  const art = md.artwork && md.artwork.length
    ? md.artwork[md.artwork.length - 1].src
    : null;

  return {
    playing: !video.paused,
    title: md.title,
    artist: md.artist || "Unknown",
    album: md.album,
    cover: art,
    position: times.position,
    duration: times.duration,
    src: times.src,
  };
}

// Отладка: сработает, только если не удалось получить настоящую длину
let dumpedFor = null;
function debugDump(info) {
  if (dumpedFor === info.title) return;
  dumpedFor = info.title;
  const safe = (fn) => { try { return fn(); } catch (e) { return "ошибка: " + e; } };
  const bar = document.querySelector("ytmusic-player-bar");
  console.warn("[YTM-DEBUG] нет настоящей длины", JSON.stringify({
    title: info.title,
    position: info.position,
    duration: info.duration,
    barTexts: bar
      ? Array.from(bar.querySelectorAll("*"))
          .filter((e) => !e.children.length && /\d:\d\d/.test(e.textContent))
          .map((e) => e.tagName + "." + e.className + "=" + e.textContent.trim())
      : "нет ytmusic-player-bar",
    hasGetPlayerResponse: safe(() => typeof getPlayer().getPlayerResponse),
    lengthSeconds: safe(() => getPlayer().getPlayerResponse().videoDetails.lengthSeconds),
    videoDuration: safe(() => document.querySelector("video").duration),
  }));
}

let lastTitle = null;
let pinned = 0;

setInterval(() => {
  const info = getInfo();

  if (info.title) {
    const raw = info.duration;
    const titleChanged = info.title !== lastTitle;

    if (titleChanged || info.position < 3) pinned = raw;
    if (info.position > pinned) pinned = raw;

    if (info.src === "raw") debugDump(info);

    if (titleChanged) {
      lastTitle = info.title;
      return;
    }
    info.duration = pinned;
  }

  browser.runtime.sendMessage(info);
}, 2000);