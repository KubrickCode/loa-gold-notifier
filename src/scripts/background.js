chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "notification") {
    const message = request.message;
    const rateMatch = message.match(/(100:\d+)/);
    let formattedMessage = message;

    if (rateMatch) {
      const rate = rateMatch[1];
      formattedMessage = `💰 등록 거래: ${rate} 💰\n\n${message}`;
    }

    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: chrome.runtime.getURL("src/public/icon.png"),
        title: "골드 거래 알림",
        message: formattedMessage,
      },
      () => {
        sendResponse({ success: true });
      }
    );
    return true;
  }
});
