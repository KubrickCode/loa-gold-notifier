chrome.runtime.onMessage.addListener(({ type, message }) => {
  if (type !== "notification") return;
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "로아 골드 거래 알리미",
    message,
  });
});
