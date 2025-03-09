var currentTab = null;
// Get the current tab
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (!tabs || !tabs.length) {
    return;
  }
  currentTab = tabs[0];
});

document.querySelector("#btn-reset").addEventListener("click", function () {
  chrome.storage.local.clear();
});

var hideSelectorInput = document.querySelector("#hide-selector-input");
var hideError = document.querySelector("#hide-selector-error");
var errorTimeout = null;
document.querySelector("#btn-hide").addEventListener("click", function () {
  chrome.tabs.sendMessage(
    currentTab.id,
    {
      type: "smartHideElement",
      selector: hideSelectorInput.value,
    },
    function (response) {
      if (response?.error) {
        hideError.textContent = response.error;
        hideError.classList.remove("hidden");
        if (errorTimeout) clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
          hideError.classList.add("hidden");
        }, 3000);
      } else if (response?.success) {
        window.close();
      }
    }
  );
});
