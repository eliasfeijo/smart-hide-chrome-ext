chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "hide",
    title: "Hide",
    type: "normal",
    contexts: ["page"],
  });
  chrome.storage.local.clear();
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

async function handleContextMenuClick(item, tab) {
  if (item.menuItemId === "hide") {
    try {
      // Get URL
      const url = item.frameUrl ? new URL(item.frameUrl) : new URL(tab.url);
      console.log("URL: ", url);

      // Get stored data
      const storedData = await chrome.storage.local.get(url.hostname);
      const data = storedData[url.hostname] || {};
      console.log("Stored data: ", data);

      // Create path-level data object if it doesn't exist
      if (!data[url.pathname]) {
        data[url.pathname] = {};
      }

      // Get element to hide
      const { element } = await chrome.tabs.sendMessage(
        tab.id,
        "getElementToHide",
        {
          frameId: item.frameId,
        }
      );
      console.log("Element to hide: ", element);

      // Add element data with the selector as the key
      data[url.pathname][element.selector] = element;
      console.log("Updated data: ", data);

      // Store updated data
      await chrome.storage.local.set({ [url.hostname]: data });
    } catch (error) {
      console.error("Error handling context menu click: ", error);
    }
  }
}
