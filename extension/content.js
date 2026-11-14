function toSeconds(str) {
  const parts = str.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// Источник 1: ползунок плеера (значения в секундах)
function fromSlider() {
  const el = document.querySelector("ytmusic-player-bar #progress-bar");
  if (!el) return null;
  const position = Number(el.getAttribute("aria-valuenow"));
  const duration = Number(el.getAttribute("aria-valuemax"));
  if (duration > 0 && position >= 0 && position <= duration) {
    return { position, duration };
  }
  return null;
}

// Источник 2: текст «0:20 / 2:19» в панели плеера
function fromPlayerBar() {
  const el = document.querySelector("ytmusic-player-bar .time-info");
  if (!el) return null;
  const [cur, total] = el.textContent.split("/");
  const position = toSeconds(cur || "");
  const duration = toSeconds(total || "");
  if (position !== null && duration && position <= duration) {
    return { position, duration };
  }
  return null;
}

// Источник 3: внутренний API плеера YouTube
function fromPlayerApi() {
  try {
    const player = document.querySelector("#movie_player");
    const api = player && player.wrappedJSObject;
    if (!api || !api.getCurrentTime || !api.getDuration) return null;
    const position = api.getCurrentTime();
    const duration = api.getDuration();
    if (duration > 0 && position >= 0 && position <= duration + 1) {
      return { position, duration };
    }
  } catch (e) {}
  return null;
}

function getInfo() {
  const md = navigator.mediaSession.metadata;
  const video = document.querySelector("video");
  if (!md || !md.title || !video) return { playing: false };

  const times = fromSlider() || fromPlayerBar() || fromPlayerApi();
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
  };
}

let lastTitle = null;
let pinned = { duration: 0 };

setInterval(() => {
  const info = getInfo();

  if (info.title) {
    const titleChanged = info.title !== lastTitle;

    // В начале трека запоминаем его длительность
    if (titleChanged || info.position < 3) {
      pinned = { duration: info.duration };
    }
    // Трек только что сменился: пропускаем один замер
    if (titleChanged) {
      lastTitle = info.title;
      return;
    }
    // Дальше используем запомненную длительность
    info.duration = pinned.duration;
  }

  browser.runtime.sendMessage(info);
}, 2000);