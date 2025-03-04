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

async function handleHideContextMenuClick(item, tab) {
  // Get element to hide
  await chrome.tabs.sendMessage(tab.id, "hideElement", {
    frameId: item.frameId,
  });
}

async function handleSmartHideContextMenuClick(item, tab) {
  await chrome.tabs.sendMessage(tab.id, "smartHideElement", {
    frameId: item.frameId,
  });
}
