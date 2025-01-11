document.addEventListener("DOMContentLoaded", () => {
  const maxRateInput = document.getElementById("maxRate");
  const saveButton = document.getElementById("saveButton");

  chrome.storage.local.get(["maxRate"], (result) => {
    maxRateInput.value = result.maxRate || 40;
  });

  const validateInput = (value) => {
    if (!/^\d+$/.test(value)) {
      return { isValid: false, message: "숫자만 입력 가능합니다." };
    }

    const numValue = parseInt(value);

    if (numValue < 0 || numValue > 100) {
      return { isValid: false, message: "0에서 100 사이의 값을 입력해주세요." };
    }

    return { isValid: true };
  };

  maxRateInput.addEventListener("input", (e) => {
    const value = e.target.value;
    const validation = validateInput(value);

    if (!validation.isValid) {
      maxRateInput.classList.add("error");
      saveButton.disabled = true;

      let errorMessage = document.getElementById("error-message");
      if (!errorMessage) {
        errorMessage = document.createElement("div");
        errorMessage.id = "error-message";
        maxRateInput.parentNode.appendChild(errorMessage);
      }
      errorMessage.textContent = validation.message;
    } else {
      maxRateInput.classList.remove("error");
      saveButton.disabled = false;

      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.remove();
      }
    }
  });

  saveButton.addEventListener("click", () => {
    const value = maxRateInput.value;
    const validation = validateInput(value);

    if (!validation.isValid) {
      return;
    }

    const maxRate = parseInt(value);

    const sanitizedMaxRate = maxRate.toString().replace(/[<>&"']/g, "");

    const originalText = saveButton.textContent;
    saveButton.textContent = "저장됨!";
    saveButton.disabled = true;

    chrome.storage.local.set({ maxRate: sanitizedMaxRate }, () => {
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 1000);
    });
  });
});
