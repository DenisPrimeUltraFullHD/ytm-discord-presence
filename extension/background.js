browser.runtime.onMessage.addListener((msg, sender) => {
  msg.tab = sender.tab ? sender.tab.id : 0;
  fetch("http://127.0.0.1:8765", {
    method: "POST",
    body: JSON.stringify(msg),
  }).catch(() => {});
});