// Handles popup-only button state without calling backend services.
const collectButton = document.querySelector("[data-collect-button]");
const collectLabel = document.querySelector("[data-collect-label]");
const analyzeButton = document.querySelector("[data-analyze-button]");
const statusMessage = document.querySelector("[data-status-message]");

collectButton?.addEventListener("click", () => {
  collectButton.classList.add("is-complete");
  collectButton.setAttribute("aria-pressed", "true");

  if (collectLabel) {
    collectLabel.textContent = "Bilgiler Toplandı";
  }

  if (analyzeButton instanceof HTMLButtonElement) {
    analyzeButton.disabled = false;
    analyzeButton.focus();
  }

  if (statusMessage) {
    statusMessage.textContent =
      "İş ilanı bilgileri hazır. Şimdi analizi başlatabilirsiniz.";
  }
});

analyzeButton?.addEventListener("click", () => {
  if (statusMessage) {
    statusMessage.textContent =
      "Analiz başlatıldı. Backend bağlantısı eklendiğinde sonuç sayfasına yönlendirilecek.";
  }
});
