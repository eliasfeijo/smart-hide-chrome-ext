chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "hide",
    title: "Hide",
    type: "normal",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((item, tab) => {
  if (item.menuItemId === "hide") {
    // Get URL
    const url = item.frameUrl ? new URL(item.frameUrl) : new URL(tab.url);
    console.log("URL: ", url);
    // Get element
    let element;
    chrome.tabs.sendMessage(
      tab.id,
      "getElementToHide",
      { frameId: item.frameId },
      (data) => {
        element = data.element;
        console.log("Element to hide: ", data);
      }
    );
  }
});
