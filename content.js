const parseGoldRate = (message) => {
  const rateMatch = message.match(/100:(\d+)/);
  if (!rateMatch) return null;
  return parseInt(rateMatch[1]);
};

const checkNewMessages = () => {
  const messages = document.querySelectorAll('[class*="message"]');

  messages.forEach((message) => {
    if (message.dataset.processed) return;

    const content = message.textContent;
    const rate = parseGoldRate(content);
    if (!rate) {
      message.dataset.processed = "true";
      return;
    }

    chrome.storage.local.get(["maxRate"], (result) => {
      const maxRate = result.maxRate || 40;
      if (rate > maxRate) {
        message.dataset.processed = "true";
        return;
      }

      chrome.runtime.sendMessage({
        type: "notification",
        message: content,
      });
      message.dataset.processed = "true";
    });
  });
};

setInterval(checkNewMessages, 1000);
