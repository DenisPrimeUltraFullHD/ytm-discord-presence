function toSeconds(str) {
  const parts = str.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function readTimes(video) {
  // Основной способ: текст «0:20 / 2:19» из плеера
  const timeEl = document.querySelector("ytmusic-player-bar .time-info");
  if (timeEl) {
    const [cur, total] = timeEl.textContent.split("/");
    const p = toSeconds(cur || "");
    const d = toSeconds(total || "");
    if (p !== null && d && p <= d) return { position: p, duration: d };
  }
  // Запасной способ: время из <video>
  if (isFinite(video.duration) && video.duration > 0) {
    return { position: video.currentTime, duration: video.duration };
  }
  return null;
}

function getInfo() {
  const md = navigator.mediaSession.metadata;
  const video = document.querySelector("video");
  if (!md || !md.title || !video) return { playing: false };

  const times = readTimes(video);
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

setInterval(() => {
  const info = getInfo();
  console.log("[YTM]", info); // для отладки, потом можно удалить

  // Трек только что сменился: пропускаем один замер
  if (info.title && info.title !== lastTitle) {
    lastTitle = info.title;
    return;
  }
  browser.runtime.sendMessage(info);
}, 2000);