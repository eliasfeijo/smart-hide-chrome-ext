document.querySelector("#btn-reset").addEventListener("click", function () {
  chrome.storage.local.clear();
});
