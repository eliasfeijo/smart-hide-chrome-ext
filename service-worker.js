chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.create({
    id: "hide",
    title: "Hide",
    type: "normal",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: "smart-hide",
    title: "Smart Hide",
    type: "normal",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

async function handleContextMenuClick(item, tab) {
  switch (item.menuItemId) {
    case "hide":
      handleHideContextMenuClick(item, tab);
      break;
    case "smart-hide":
      handleSmartHideContextMenuClick(item, tab);
      break;
    default:
      break;
  }
}

async function handleSmartHideContextMenuClick(item, tab) {
  await chrome.tabs.sendMessage(tab.id, "smartHideElement", {
    frameId: item.frameId,
  });
}

async function handleHideContextMenuClick(item, tab) {
  // Get element to hide
  const { element } = await chrome.tabs.sendMessage(
    tab.id,
    "getElementToHide",
    {
      frameId: item.frameId,
    }
  );
  // Get URL
  const url = item.frameUrl ? new URL(item.frameUrl) : new URL(tab.url);
  console.log("URL: ", url);
  storeElementToHide(element, url);
}

async function storeElementToHide(element, url) {
  try {
    // Get stored data
    const storedData = await chrome.storage.local.get(url.hostname);
    const data = storedData[url.hostname] || {};
    console.log("Stored data: ", data);

    // Create path-level data object if it doesn't exist
    if (!data[url.pathname]) {
      data[url.pathname] = {};
    }

    // Add element data with the selector as the key
    data[url.pathname][element.selector] = element;
    console.log("Updated data: ", data);

    // Store updated data
    await chrome.storage.local.set({ [url.hostname]: data });
  } catch (error) {
    console.error("Error handling context menu click: ", error);
  }
}
