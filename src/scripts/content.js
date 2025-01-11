const parseGoldRate = (message) => {
  const rateMatch = message.match(/100:(\d+)/);
  return rateMatch ? parseInt(rateMatch[1]) : null;
};

const state = {
  lastNotificationTime: 0,
  notificationCount: 0,
};

const NOTIFICATION_COOLDOWN = 30000;
const MAX_NOTIFICATIONS_PER_MINUTE = 5;

const checkNewMessages = async () => {
  try {
    if (!chrome.runtime?.id) {
      if (safeInterval) {
        clearInterval(safeInterval);
        safeInterval = null;
      }
      return;
    }

    const messages = document.querySelectorAll('[class*="message"]');

    const now = Date.now();
    if (now - state.lastNotificationTime > 60000) {
      state.notificationCount = 0;
    }

    for (const message of messages) {
      if (!chrome.runtime?.id) break;

      if (message.dataset.processed) continue;

      const content = message.textContent;
      const rate = parseGoldRate(content);

      if (!rate) {
        message.dataset.processed = "true";
        continue;
      }

      try {
        const result = await new Promise((resolve, reject) => {
          if (!chrome.runtime?.id) {
            reject(new Error("Extension context invalid"));
            return;
          }
          chrome.storage.local.get(
            ["maxRate", "lastSaveTime", "notificationsEnabled"],
            (items) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(items);
              }
            }
          );
        });

        const maxRate = result?.maxRate || 40;
        const lastSaveTime = result?.lastSaveTime || 0;
        const notificationsEnabled = result?.notificationsEnabled !== false;
        const currentTime = Date.now();

        const messageTime = getMessageTimestamp(message);

        if (
          notificationsEnabled &&
          messageTime > lastSaveTime &&
          rate <= maxRate
        ) {
          if (
            currentTime - state.lastNotificationTime >= NOTIFICATION_COOLDOWN &&
            state.notificationCount < MAX_NOTIFICATIONS_PER_MINUTE
          ) {
            try {
              await new Promise((resolve, reject) => {
                if (!chrome.runtime?.id) {
                  reject(new Error("Extension context invalid"));
                  return;
                }
                chrome.runtime.sendMessage(
                  {
                    type: "notification",
                    message: content,
                  },
                  () => {
                    if (chrome.runtime.lastError) {
                      resolve();
                    } else {
                      resolve();
                    }
                  }
                );
              });

              state.lastNotificationTime = currentTime;
              state.notificationCount++;
            } catch (error) {
              if (error.message === "Extension context invalid") {
                if (safeInterval) {
                  clearInterval(safeInterval);
                  safeInterval = null;
                }
                break;
              }
              if (
                error.message !==
                "The message port closed before a response was received."
              ) {
                console.error("알림 전송 중 오류:", error);
              }
            }
          }
        }
      } catch (error) {
        if (error.message === "Extension context invalid") {
          if (safeInterval) {
            clearInterval(safeInterval);
            safeInterval = null;
          }
          break;
        }
        console.error("처리 중 오류:", error);
      }

      message.dataset.processed = "true";
    }
  } catch (error) {
    console.error("전체 처리 중 오류:", error);
    if (error.message === "Extension context invalid") {
      if (safeInterval) {
        clearInterval(safeInterval);
        safeInterval = null;
      }
    }
  }
};

const getMessageTimestamp = (messageElement) => {
  try {
    const timestampElement = messageElement.querySelector(
      '[class*="timestamp"]'
    );
    if (!timestampElement) return Date.now();

    const timeText =
      timestampElement.getAttribute("datetime") || timestampElement.textContent;
    return new Date(timeText).getTime();
  } catch (error) {
    console.error("타임스탬프 파싱 실패:", error);
    return Date.now();
  }
};

let safeInterval = null;

const startMonitoring = () => {
  if (safeInterval) {
    clearInterval(safeInterval);
  }
  safeInterval = setInterval(checkNewMessages, 1000);
};

startMonitoring();

window.addEventListener("unload", () => {
  if (safeInterval) {
    clearInterval(safeInterval);
    safeInterval = null;
  }
});
